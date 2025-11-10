import React, { useState, useRef, useCallback } from 'react';
import { Clip, ProcessingState } from '../types';
import VideoPlayer from './VideoPlayer';
import ClipCard from './ClipCard';
import { DownloadIcon } from './icons/DownloadIcon';

interface WorkspaceProps {
  videoUrl: string;
  clips: Clip[];
  processingState: ProcessingState;
  error: string | null;
}

const Workspace: React.FC<WorkspaceProps> = ({ videoUrl, clips, processingState, error }) => {
  const [activeClip, setActiveClip] = useState<Clip | null>(null);
  const [modalContent, setModalContent] = useState<{title: string, message: string} | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlayClip = useCallback((clip: Clip) => {
    setActiveClip(clip);
    if (videoRef.current) {
      videoRef.current.currentTime = clip.startTime;
      videoRef.current.play();
    }
  }, []);

  const showModal = (title: string, message: string) => {
    setModalContent({title, message});
    setTimeout(() => setModalContent(null), 4000);
  }

  const handleExportAll = () => {
    showModal("Your Shorts are ready!", "The batch download would start automatically in a real app.");
  }
  
  const handleDownloadClip = (clip: Clip) => {
    showModal(`Exporting Clip!`, `Downloading the clip "${clip.hook}" would start now.`);
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-red-900/20 border border-red-500 rounded-lg">
        <h3 className="text-2xl font-bold text-red-400 mb-2">Processing Failed</h3>
        <p className="text-red-300">{error}</p>
        <p className="text-sm text-gray-400 mt-2">Please try reloading the page or using a different video file.</p>
      </div>
    );
  }
  
  if (processingState.status !== 'done') {
      return null; // Loader is handled by App.tsx
  }

  return (
    <div className="w-full h-full flex-grow flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
      <div className="flex-1 lg:w-3/5 flex flex-col">
        <VideoPlayer ref={videoRef} src={videoUrl} activeClip={activeClip} />
      </div>
      <div className="flex-1 lg:w-2/5 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Generated Clips ({clips.length})</h2>
          <button onClick={handleExportAll} className="flex items-center gap-2 px-4 py-2 bg-[#7B61FF] text-white font-semibold rounded-lg shadow-md hover:bg-purple-600 transition-all transform hover:scale-105 disabled:bg-gray-600 disabled:cursor-not-allowed" disabled={clips.length === 0}>
            <DownloadIcon className="w-5 h-5" />
            Export All
          </button>
        </div>
        <div className="flex-grow bg-gray-800/50 rounded-lg p-4 overflow-y-auto space-y-4">
          {clips.length > 0 ? clips.map((clip) => (
            <ClipCard
              key={clip.id}
              clip={clip}
              isActive={activeClip?.id === clip.id}
              onPlay={() => handlePlayClip(clip)}
              onDownload={() => handleDownloadClip(clip)}
            />
          )) : (
             <div className="text-center py-16 text-gray-400">
               <p>No clips were generated.</p>
               <p className="text-sm">This might happen with very short videos.</p>
             </div>
          )}
        </div>
      </div>
       {modalContent && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl p-8 text-center shadow-2xl animate-fade-in-up">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold text-white mb-2">{modalContent.title}</h3>
              <p className="text-gray-300">{modalContent.message}</p>
            </div>
          </div>
      )}
    </div>
  );
};

export default Workspace;
