export type CaptionDesignPreset = 'Modern' | 'Bold' | 'Minimal';
export type Language = 'English' | 'Hindi' | 'Spanish' | 'French';

export interface CaptionStyle {
  preset: CaptionDesignPreset;
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

export type ProcessingStatus = 'idle' | 'transcribing' | 'analyzing' | 'generating' | 'done' | 'error';

export interface ProcessingState {
  status: ProcessingStatus;
  message: string;
  progress: number;
}

export type TargetDuration = 15 | 30 | 60;

export interface ProcessingConfig {
  targetDuration: TargetDuration;
  captionDesign: CaptionDesignPreset;
  sourceLanguage: Language;
  targetLanguage: Language;
}
