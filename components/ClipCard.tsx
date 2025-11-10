import React from 'react';
import { Clip } from '../types';
import { PlayIcon } from './icons/PlayIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { TrashIcon } from './icons/TrashIcon';

interface ClipCardProps {
  clip: Clip;
  isActive: boolean;
  isExporting: boolean;
  onPlay: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const KEYWORDS = ['amazing', 'secret', 'best', 'hack', 'tip', 'reveal', 'shocking', 'insane', 'crazy', 'believe', 'watch this', 'increíble', 'secreto', 'mejor', 'truco', 'revelar', 'impactante', 'loco', 'creer', 'mira esto', 'अद्भुत', 'रहस्य', 'सबसे अच्छा', 'टिप', 'खुलासा', 'चौंकाने वाला', 'पागल', 'विश्वास', 'यह देखो'];

const highlightKeywords = (text: string, highlightColor: string) => {
    const regex = new RegExp(`\\b(${KEYWORDS.join('|')})\\b`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) => 
        KEYWORDS.find(kw => kw.toLowerCase() === part.toLowerCase()) ? (
            <span key={index} style={{ color: highlightColor, fontWeight: 'bold' }}>{part}</span>
        ) : (
            part
        )
    );
};


const ClipCard: React.FC<ClipCardProps> = ({ clip, isActive, isExporting, onPlay, onDownload, onDelete }) => {
  const duration = clip.endTime - clip.startTime;
  const firstEmoji = clip.transcript[0]?.emoji;
  
  return (
    <div className={`p-4 rounded-lg transition-all duration-300 ${isActive ? 'bg-purple-900/50 ring-2 ring-purple-500' : 'bg-gray-700/50 hover:bg-gray-700'}`}>
      <div className="flex items-start gap-4">
        <button 
          onClick={onPlay} 
          className="flex-shrink-0 w-12 h-12 bg-gray-800 rounded-md flex items-center justify-center hover:bg-purple-600 transition-colors group"
          aria-label={`Play clip from ${formatTime(clip.startTime)} to ${formatTime(clip.endTime)}`}>
          <PlayIcon className={`w-6 h-6 transition-colors ${isActive ? 'text-purple-400' : 'text-gray-400 group-hover:text-white'}`} />
        </button>
        <div className="flex-1">
          <p className="font-bold text-white">{firstEmoji && <span className="mr-2">{firstEmoji}</span>}"{clip.hook}"</p>
          <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
            <span>{formatTime(clip.startTime)} - {formatTime(clip.endTime)}</span>
            <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
            <span>{duration.toFixed(1)}s</span>
          </div>
          <p className="text-sm text-gray-300 mt-2 line-clamp-2">
            {highlightKeywords(clip.transcript.map(t => t.text).join(' '), clip.captionStyle.highlightColor)}
          </p>
        </div>
        <div className="flex flex-col gap-2">
            <button
               onClick={onDownload}
               disabled={isExporting}
               className="flex-shrink-0 w-10 h-10 bg-gray-800 rounded-md flex items-center justify-center hover:bg-purple-600 transition-colors group disabled:bg-gray-600 disabled:cursor-wait"
               aria-label="Download this clip"
            >
              {isExporting ? <SpinnerIcon className="w-5 h-5 text-white" /> : <DownloadIcon className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />}
            </button>
            <button
               onClick={onDelete}
               disabled={isExporting}
               className="flex-shrink-0 w-10 h-10 bg-gray-800 rounded-md flex items-center justify-center hover:bg-red-500 transition-colors group disabled:bg-gray-600 disabled:cursor-not-allowed"
               aria-label="Delete this clip"
            >
              <TrashIcon className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default ClipCard;
