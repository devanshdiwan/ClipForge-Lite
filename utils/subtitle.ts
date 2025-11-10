import { TranscriptLine } from '../types';

const formatTimeToSRT = (seconds: number): string => {
  const date = new Date(0);
  date.setSeconds(seconds);
  const timeString = date.toISOString().substr(11, 12);
  return timeString.replace('.', ',');
};

export const generateSRT = (transcript: TranscriptLine[]): string => {
  let srtContent = '';
  transcript.forEach((line, index) => {
    const startTime = formatTimeToSRT(line.start);
    const endTime = formatTimeToSRT(line.end);
    srtContent += `${index + 1}\n`;
    srtContent += `${startTime} --> ${endTime}\n`;
    srtContent += `${line.text}\n\n`;
  });
  return srtContent;
};
