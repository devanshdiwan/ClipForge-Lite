import { useState, useEffect } from 'react';
import { Clip, ProcessingState, TranscriptLine, ProcessingConfig, CaptionStyle, CaptionTemplate } from '../types';
import { loadFFmpeg, getFFmpeg } from '../services/exportService';

const TARGET_CLIPS = 8;

const CAPTION_TEMPLATES: Record<CaptionTemplate, CaptionStyle> = {
  Hormozi1: {
    preset: 'Hormozi1',
    font: 'Inter',
    textColor: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.0)',
    highlightColor: '#39FF14', // Neon green
    textShadow: '3px 3px 0px #000, -3px -3px 0px #000, 3px -3px 0px #000, -3px 3px 0px #000',
    fontWeight: 800,
  },
  Hormozi2: {
    preset: 'Hormozi2',
    font: 'Inter',
    textColor: '#000000',
    backgroundColor: '#FFFF00',
    highlightColor: '#FF0000',
    textShadow: 'none',
    fontWeight: 800,
  },
  Karaoke: {
    preset: 'Karaoke',
    font: 'Inter',
    textColor: '#FFFFFF',
    backgroundColor: 'rgba(255, 20, 147, 0.7)', // Deep pink
    highlightColor: '#FFFF00',
    textShadow: '2px 2px 3px rgba(0,0,0,0.5)',
    fontWeight: 700,
  },
};

const getVideoDuration = (videoFile: File): Promise<number> => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = URL.createObjectURL(videoFile);
        video.onloadedmetadata = () => {
            URL.revokeObjectURL(video.src);
            resolve(video.duration);
        };
        video.onerror = (e) => {
            URL.revokeObjectURL(video.src);
            reject(new Error("Failed to load video metadata."));
        };
    });
};


const detectScenes = async (
    videoFile: File, 
    onProgress: (progress: number, message: string) => void
): Promise<{ segments: { start: number, end: number }[], duration: number }> => {
  await loadFFmpeg();
  const ffmpeg = getFFmpeg().getFFmpegInstance();
  const { fetchFile } = getFFmpeg();

  const duration = await getVideoDuration(videoFile);

  ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(videoFile));

  const logMessages: string[] = [];
  ffmpeg.setLogger(({ message }: { message: string }) => {
    logMessages.push(message);
    if (message.includes('time=')) {
        const timeMatch = message.match(/time=(\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
        if (timeMatch) {
            const hours = parseInt(timeMatch[1], 10);
            const minutes = parseInt(timeMatch[2], 10);
            const seconds = parseInt(timeMatch[3], 10);
            const centiseconds = parseInt(timeMatch[4], 10);
            const currentTime = hours * 3600 + minutes * 60 + seconds + centiseconds / 100;
            const progress = (currentTime / duration) * 100;
            onProgress(progress * 0.5, 'Detecting scenes...'); // This part is 50% of the analysis
        }
    }
  });

  await ffmpeg.run('-i', 'input.mp4', '-af', 'silencedetect=n=-50dB:d=0.8', '-f', 'null', '-');
  
  ffmpeg.setLogger(null);

  const silenceLines = logMessages.filter(line => line.includes('silence_'));
  const silences: { start: number, end: number }[] = [];
  let currentSilence: Partial<{ start: number, end: number }> = {};

  silenceLines.forEach(line => {
    const startMatch = line.match(/silence_start: (\d+\.?\d*)/);
    if (startMatch) {
      currentSilence.start = parseFloat(startMatch[1]);
    }
    const endMatch = line.match(/silence_end: (\d+\.?\d*)/);
    if (endMatch && currentSilence.start !== undefined) {
      currentSilence.end = parseFloat(endMatch[1]);
      silences.push(currentSilence as { start: number, end: number });
      currentSilence = {};
    }
  });

  const segments: { start: number, end: number }[] = [];
  let lastEnd = 0;
  silences.forEach(silence => {
    if (silence.start > lastEnd) {
      segments.push({ start: lastEnd, end: silence.start });
    }
    lastEnd = silence.end;
  });

  if (lastEnd < duration) {
    segments.push({ start: lastEnd, end: duration });
  }

  ffmpeg.FS('unlink', 'input.mp4');

  return { segments: segments.filter(s => s.end - s.start > 2), duration };
};


export const useVideoProcessor = (
  videoFile: File | null,
  config: ProcessingConfig | null,
  enabled: boolean,
) => {
  const [processingState, setProcessingState] = useState<ProcessingState>({
    status: 'idle',
    message: '',
    progress: 0,
  });
  const [clips, setClips] = useState<Clip[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoFile || !enabled || !config) {
      setProcessingState({ status: 'idle', message: '', progress: 0 });
      setClips([]);
      setError(null);
      return;
    }

    const processVideo = async () => {
      try {
        setError(null);
        setClips([]);
        const { clipLength, template } = config;
        const captionStyle = CAPTION_TEMPLATES[template];

        setProcessingState({ status: 'preparing', message: 'Initializing...', progress: 0 });
        
        const { segments } = await detectScenes(videoFile, (p, m) => {
            setProcessingState({ status: 'detecting', message: m, progress: p });
        });

        if (segments.length === 0) {
            throw new Error("No active scenes detected. The video might be mostly silent or in an unsupported audio format.");
        }
        
        setProcessingState({ status: 'analyzing', message: 'Analyzing detected scenes...', progress: 50 });
        
        let minClipLength, maxClipLength;
        switch (clipLength) {
            case '<30': minClipLength = 10; maxClipLength = 29; break;
            case '30-60': minClipLength = 30; maxClipLength = 60; break;
            case '60-90': minClipLength = 61; maxClipLength = 90; break;
            default: minClipLength = 10; maxClipLength = 180;
        }

        let filteredSegments = segments.filter(s => (s.end - s.start) >= minClipLength && (s.end - s.start) <= maxClipLength);

        if (filteredSegments.length === 0) {
            console.warn("No scenes in desired range, falling back to all scenes.");
            filteredSegments = segments;
        }

        const sortedSegments = filteredSegments.sort((a, b) => (b.end - b.start) - (a.end - a.start));
        const topSegments = sortedSegments.slice(0, TARGET_CLIPS);
        
        setProcessingState({ status: 'generating', message: `Creating ${topSegments.length} clips...`, progress: 80 });
        
        const generatedClips: Clip[] = topSegments.map((segment, i) => {
            const duration = segment.end - segment.start;
            const mockTranscript: TranscriptLine[] = [{
                text: `[Auto-detected speech segment from ${segment.start.toFixed(1)}s to ${segment.end.toFixed(1)}s]`,
                start: segment.start,
                end: segment.end,
            }];

            return {
                id: `clip-${Date.now()}-${i}`,
                startTime: segment.start,
                endTime: segment.end,
                hook: `Engaging Moment #${i + 1}`,
                transcript: mockTranscript,
                captionStyle: captionStyle,
            };
        });

        setClips(generatedClips);
        setProcessingState({ status: 'done', message: 'Your clips are ready!', progress: 100 });

      } catch (err) {
        console.error(err);
        const message = err instanceof Error ? err.message : 'An unknown error occurred during processing.';
        setError(message);
        setProcessingState({ status: 'error', message: `Error: ${message}`, progress: 0 });
      }
    };

    processVideo();
  }, [videoFile, enabled, config]);

  return { processingState, clips, error };
};
