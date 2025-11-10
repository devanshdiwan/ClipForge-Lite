import { TranscriptLine } from '../types';

const formatTimeToSRT = (seconds: number): string => {
  const date = new Date(0);
  date.setSeconds(seconds);
  const timeString = date.toISOString().substr(11, 12);
  return timeString.replace('.', ',');
};

export const generateSRT = (transcript: TranscriptLine[]): string => {
  let srtContent = '';
  let counter = 1;
  transcript.forEach((line) => {
    const startTime = formatTimeToSRT(line.start);
    const endTime = formatTimeToSRT(line.end);
    srtContent += `${counter}\n`;
    srtContent += `${startTime} --> ${endTime}\n`;
    // We use the `line.text` for the whole duration, which will be styled word-by-word by FFmpeg's ASS renderer
    // This provides a simpler SRT that is compatible with more complex ASS styling via `force_style`.
    srtContent += `${line.text}\n\n`;
    counter++;
  });
  return srtContent;
};
