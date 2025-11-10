import { useState, useEffect } from 'react';
import { Clip, ProcessingState, TranscriptLine, ProcessingConfig, CaptionStyle, CaptionDesignPreset } from '../types';
import { generateTranscriptAndScenes, generateHook } from '../services/geminiService';

const TARGET_CLIPS = 6;

const CAPTION_DESIGNS: Record<CaptionDesignPreset, CaptionStyle> = {
  Modern: {
    preset: 'Modern',
    font: 'Inter',
    textColor: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    highlightColor: '#7B61FF',
    textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
    fontWeight: 700,
  },
  Bold: {
    preset: 'Bold',
    font: 'Inter',
    textColor: '#FFFF00',
    backgroundColor: 'rgba(0, 0, 0, 0.0)',
    highlightColor: '#FFFFFF',
    textShadow: '0 0 5px #000, 0 0 5px #000, 0 0 5px #000',
    fontWeight: 800,
  },
  Minimal: {
    preset: 'Minimal',
    font: 'Inter',
    textColor: '#FFFFFF',
    backgroundColor: 'transparent',
    highlightColor: '#7B61FF',
    textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
    fontWeight: 600,
  },
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
        const { targetDuration, sourceLanguage, targetLanguage, captionDesign } = config;
        const captionStyle = CAPTION_DESIGNS[captionDesign];

        const MIN_CLIP_LENGTH = targetDuration - 5;
        const MAX_CLIP_LENGTH = targetDuration + 15;

        setProcessingState({ status: 'transcribing', message: `Generating transcript in ${targetLanguage}...`, progress: 10 });
        const videoTopic = videoFile.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
        const fullTranscript: { start: number, end: number, text: string }[] = await generateTranscriptAndScenes(videoTopic, sourceLanguage, targetLanguage);

        setProcessingState({ status: 'analyzing', message: 'Analyzing for engaging moments...', progress: 40 });
        const potentialClips: TranscriptLine[][] = [];
        let currentClipLines: TranscriptLine[] = [];
        let currentClipDuration = 0;

        for (const line of fullTranscript) {
          const lineDuration = line.end - line.start;
          if (currentClipDuration + lineDuration > MAX_CLIP_LENGTH) {
            if (currentClipDuration >= MIN_CLIP_LENGTH) {
              potentialClips.push(currentClipLines);
            }
            currentClipLines = currentClipLines.slice(Math.floor(currentClipLines.length / 2));
            currentClipDuration = currentClipLines.reduce((sum, l) => sum + (l.end - l.start), 0);
          }
          currentClipLines.push({ text: line.text, start: line.start, end: line.end });
          currentClipDuration += lineDuration;
        }
        if (currentClipLines.length > 0 && currentClipDuration >= MIN_CLIP_LENGTH) {
          potentialClips.push(currentClipLines);
        }

        const scoredClips = potentialClips.map(clipLines => {
          const text = clipLines.map(l => l.text).join(' ');
          const duration = clipLines[clipLines.length-1].end - clipLines[0].start;
          let emotionScore = 0;
          const emotionKeywords = ['amazing', 'secret', 'best', 'hack', 'tip', 'reveal', 'shocking', 'insane', 'crazy', 'believe', 'watch this', 'increíble', 'secreto', 'mejor', 'truco', 'revelar', 'impactante', 'loco', 'creer', 'mira esto', 'अद्भुत', 'रहस्य', 'सबसे अच्छा', 'टिप', 'खुलासा', 'चौंकाने वाला', 'पागल', 'विश्वास', 'यह देखो'];
          emotionKeywords.forEach(kw => {
            if (text.toLowerCase().includes(kw)) emotionScore += 5;
          });
          const lengthFitScore = 1 - (Math.abs(duration - targetDuration) / targetDuration);
          const score = (emotionScore * 0.5) + (clipLines.length * 0.2) + (lengthFitScore * 0.3);
          return { lines: clipLines, score };
        }).sort((a, b) => b.score - a.score);

        const topClipsLines = scoredClips.slice(0, TARGET_CLIPS);
        
        setProcessingState({ status: 'generating', message: 'Creating short clips...', progress: 70 });
        
        const generatedClips: Clip[] = [];
        for (let i = 0; i < topClipsLines.length; i++) {
            const clipLines = topClipsLines[i].lines;
            if (!clipLines || clipLines.length === 0) continue;

            const excerpt = clipLines.map(l => l.text).join(' ').substring(0, 200);
            const hook = await generateHook(excerpt, targetLanguage);

            generatedClips.push({
                id: `clip-${Date.now()}-${i}`,
                startTime: clipLines[0].start,
                endTime: clipLines[clipLines.length - 1].end,
                hook,
                transcript: clipLines,
                captionStyle: captionStyle,
            });
            setProcessingState(prev => ({ ...prev, progress: 70 + ((i + 1) / topClipsLines.length) * 30 }));
        }

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
