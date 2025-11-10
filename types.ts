export type CaptionTemplate = 'Hormozi1' | 'Hormozi2' | 'Karaoke';

export interface CaptionStyle {
  preset: CaptionTemplate;
  font: 'Inter' | 'Poppins' | 'Roboto';
  textColor: string;
  backgroundColor: string;
  highlightColor: string;
  textShadow?: string;
  fontWeight?: number;
}

export interface TranscriptLine {
  text: string;
  start: number;
  end: number;
}

export interface Clip {
  id: string;
  startTime: number;
  endTime: number;
  hook: string;
  transcript: TranscriptLine[];
  captionStyle: CaptionStyle;
}

export type ProcessingStatus = 'idle' | 'preparing' | 'detecting' | 'analyzing' | 'generating' | 'done' | 'error';

export interface ProcessingState {
  status: ProcessingStatus;
  message: string;
  progress: number;
}

export type ClipLength = '<30' | '30-60' | '60-90' | 'original';
export type VideoLayout = 'auto' | 'fill' | 'fit' | 'square';

export interface ProcessingConfig {
  processingTimeframe: [number, number];
  clipLength: ClipLength;
  layout: VideoLayout;
  template: CaptionTemplate;
  hookTitle: boolean;
  callToAction: boolean;
  ctaText: string;
  backgroundMusic: boolean;
  backgroundMusicFile?: File | null;
  watermarkFile?: File | null;
  wordsPerCaption: number;
}
