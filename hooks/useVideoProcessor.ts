import { useState, useEffect } from 'react';
import { Clip, ProcessingState, TranscriptLine, ProcessingConfig, CaptionStyle, CaptionTemplate, Word } from '../types';
import { analyzeVideoContent, generateHook } from '../services/geminiService';

const TARGET_CLIPS = 6;
const FRAME_COUNT = 20;

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

const extractFrames = (videoFile: File, onProgress: (progress: number) => void): Promise<{ frames: string[], duration: number }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const frames: string[] = [];
    
    if (!ctx) {
        return reject(new Error("Could not create canvas context"));
    }

    video.preload = 'metadata';
    video.src = URL.createObjectURL(videoFile);

    video.onloadedmetadata = () => {
      const duration = video.duration;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const interval = duration / FRAME_COUNT;
      let currentTime = 0;
      let framesExtracted = 0;

      const captureFrame = () => {
        if (framesExtracted >= FRAME_COUNT) {
          URL.revokeObjectURL(video.src);
          onProgress(100);
          resolve({ frames, duration });
          return;
        }
        video.currentTime = currentTime;
      };

      video.onseeked = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        frames.push(canvas.toDataURL('image/jpeg', 0.8));
        framesExtracted++;
        currentTime += interval;
        onProgress((framesExtracted / FRAME_COUNT) * 100);
        captureFrame();
      };
      
      video.onerror = () => {
          URL.revokeObjectURL(video.src);
          reject(new Error("Error seeking video. The file may be corrupt or in an unsupported format."));
      }

      captureFrame();
    };
    
    video.onerror = () => {
        reject(new Error("Failed to load video metadata. The file might be corrupt."));
    }
  });
};

const createKaraokeTranscript = (
  aiTranscript: { words: Word[], emoji?: string }[],
  wordsPerCaption: number
): TranscriptLine[] => {
    const karaokeLines: TranscriptLine[] = [];
    const allWords = aiTranscript.flatMap(line => line.words.map(w => ({...w, emoji: line.emoji})));

    for (let i = 0; i < allWords.length; i += wordsPerCaption) {
        const chunk = allWords.slice(i, i + wordsPerCaption);
        if (chunk.length > 0) {
            const firstWord = chunk[0];
            const lastWord = chunk[chunk.length - 1];
            karaokeLines.push({
                text: chunk.map(w => w.text).join(' '),
                start: firstWord.start,
                end: lastWord.end,
                words: chunk,
                emoji: firstWord.emoji,
            });
        }
    }
    return karaokeLines;
};


export const useVideoProcessor = (
  videoFile: File | null,
  config: ProcessingConfig | null,
  enabled: boolean,
  onApiKeyError: () => void,
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
        const { clipLength, videoLanguage, translateCaptions, translationLanguage, template, wordsPerCaption } = config;
        const captionStyle = CAPTION_TEMPLATES[template];

        let minClipLength, maxClipLength;
        switch (clipLength) {
            case '<30': minClipLength = 10; maxClipLength = 29; break;
            case '30-60': minClipLength = 30; maxClipLength = 60; break;
            case '60-90': minClipLength = 61; maxClipLength = 90; break;
            case 'original': minClipLength = 91; maxClipLength = 180; break;
            default: minClipLength = 25; maxClipLength = 60;
        }

        const sourceLanguage = videoLanguage;
        const targetLanguage = translateCaptions ? translationLanguage : videoLanguage;

        setProcessingState({ status: 'preparing', message: 'Preparing video for analysis...', progress: 0 });
        const { frames, duration } = await extractFrames(videoFile, (p) => {
            setProcessingState(prev => ({ ...prev, progress: p * 0.2 })); // Extraction is 0-20%
        });
        
        if (duration < 10) {
            throw new Error("Video is too short. Please use a video longer than 10 seconds.");
        }

        setProcessingState({ status: 'analyzing', message: `AI is analyzing video content...`, progress: 20 });
        const videoTopic = videoFile.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
        
        const analysisResult = await analyzeVideoContent(frames, duration, videoTopic, sourceLanguage, targetLanguage, { min: minClipLength, max: maxClipLength });
        
        setProcessingState({ status: 'analyzing', message: 'Finding best moments...', progress: 60 });
        const allScenes = analysisResult.scenes;

        let filteredScenes = allScenes;
        if (clipLength !== 'original') {
          filteredScenes = allScenes.filter(scene => {
              const duration = scene.endTime - scene.startTime;
              return duration >= minClipLength && duration <= maxClipLength;
          });
        }
        
        if (filteredScenes.length === 0 && allScenes.length > 0) {
            console.warn(`No scenes found within the ${minClipLength}-${maxClipLength}s range. Falling back to the best available scenes regardless of length.`);
            filteredScenes = allScenes; 
        }

        const sortedScenes = filteredScenes.sort((a, b) => b.viralityScore - a.viralityScore);
        
        const topScenes = sortedScenes.slice(0, TARGET_CLIPS);
        
        if (topScenes.length === 0) {
           throw new Error(`The AI could not identify any clip-worthy scenes. Please try a different video or adjust length settings.`);
        }

        setProcessingState({ status: 'generating', message: `Creating ${topScenes.length} short clips...`, progress: 80 });
        
        const generatedClips: Clip[] = [];
        for (let i = 0; i < topScenes.length; i++) {
            const scene = topScenes[i];
            if (!scene || scene.transcript.length === 0) continue;
            
            const hook = await generateHook(scene.summary, targetLanguage);
            
            const karaokeTranscript = createKaraokeTranscript(scene.transcript, wordsPerCaption);

            generatedClips.push({
                id: `clip-${Date.now()}-${i}`,
                startTime: scene.startTime,
                endTime: scene.endTime,
                hook,
                transcript: karaokeTranscript,
                captionStyle: captionStyle,
            });
            setProcessingState(prev => ({ ...prev, progress: 80 + ((i + 1) / topScenes.length) * 20 }));
        }

        setClips(generatedClips);
        setProcessingState({ status: 'done', message: 'Your clips are ready!', progress: 100 });

      } catch (err) {
        console.error(err);
        const message = err instanceof Error ? err.message : 'An unknown error occurred during processing.';

        if (message.toLowerCase().includes('api key')) {
            onApiKeyError();
        }

        setError(message);
        setProcessingState({ status: 'error', message: `Error: ${message}`, progress: 0 });
      }
    };

    processVideo();
  }, [videoFile, enabled, config, onApiKeyError]);

  return { processingState, clips, error };
};