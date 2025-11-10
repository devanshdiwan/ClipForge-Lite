import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Clip, ProcessingConfig, ProcessingState } from '../types';
import VideoPlayer from './VideoPlayer';
import ClipCard from './ClipCard';
import { DownloadIcon } from './icons/DownloadIcon';
import { exportClip, loadFFmpeg } from '../services/exportService';
import { SpinnerIcon } from './icons/SpinnerIcon';

declare const JSZip: any;

interface WorkspaceProps {
  videoUrl: string;
  clips: Clip[];
  processingState: ProcessingState;
  error: string | null;
  config: ProcessingConfig;
  videoFile: File;
}

const Workspace: React.FC<WorkspaceProps> = ({ videoUrl, clips: initialClips, processingState, error, config, videoFile }) => {
  const [activeClip, setActiveClip] = useState<Clip | null>(null);
  const [modalContent, setModalContent] = useState<{title: string, message: string} | null>(null);
  const [exportingClipId, setExportingClipId] = useState<string | null>(null);
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [displayClips, setDisplayClips] = useState<Clip[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setDisplayClips(initialClips);
    if (initialClips.length > 0) {
      setActiveClip(initialClips[0]);
    }
  }, [initialClips]);

  const handlePlayClip = useCallback((clip: Clip) => {
    setActiveClip(clip);
    if (videoRef.current) {
      videoRef.current.currentTime = clip.startTime;
      videoRef.current.play();
    }
  }, []);

  const handleDeleteClip = (clipId: string) => {
    setDisplayClips(prev => prev.filter(c => c.id !== clipId));
    if (activeClip?.id === clipId) {
      setActiveClip(null);
    }
  }

  const showModal = (title: string, message: string) => {
    setModalContent({title, message});
    setTimeout(() => setModalContent(null), 4000);
  }

  const handleExportAll = async () => {
    if (isExportingAll) return;
    setIsExportingAll(true);
    showModal("Preparing batch export...", `Processing ${displayClips.length} clips. This may take a while.`);

    try {
        await loadFFmpeg();
        const zip = new JSZip();
        
        for (let i = 0; i < displayClips.length; i++) {
            const clip = displayClips[i];
            setExportingClipId(clip.id); // Visually indicate which clip is processing
            const videoBlob = await exportClip(videoFile, clip, config);
            zip.file(`clip_${i + 1}_${clip.hook.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`, videoBlob);
        }
        
        setExportingClipId(null);
        const zipBlob = await zip.generateAsync({ type: "blob" });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = "ClipForge_Lite_Export.zip";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        showModal("Export Complete!", "Your clips have been downloaded in a ZIP file.");

    } catch (err) {
        console.error("Batch export failed", err);
        const message = err instanceof Error ? err.message : 'Unknown error';
        showModal("Export Failed", `An error occurred: ${message}`);
    } finally {
        setIsExportingAll(false);
        setExportingClipId(null);
    }
  }
  
  const handleDownloadClip = async (clip: Clip) => {
    if (exportingClipId === clip.id) return;

    setExportingClipId(clip.id);
    try {
        await loadFFmpeg();
        const videoBlob = await exportClip(videoFile, clip, config);

        const link = document.createElement('a');
        link.href = URL.createObjectURL(videoBlob);
        link.download = `clip_${clip.hook.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        showModal("Download Started!", `Your clip "${clip.hook}" is downloading.`);

    } catch(err) {
        console.error("Failed to export clip:", err);
        const message = err instanceof Error ? err.message : 'Unknown error';
        showModal("Export Failed", `Could not export clip: ${message}`);
    } finally {
        setExportingClipId(null);
    }
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-red-900/20 border border-red-500 rounded-lg max-w-2xl mx-auto">
        <h3 className="text-2xl font-bold text-red-400 mb-2">Processing Failed</h3>
        <p className="text-red-300">{error}</p>
        <p className="text-sm text-gray-400 mt-2">Please try reloading the page or using a different video file. If this persists, check your API key configuration.</p>
      </div>
    );
  }
  
  if (processingState.status !== 'done') {
      return null; // Loader is handled by App.tsx
  }

  return (
    <div className="w-full h-full flex-grow flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
      <div className="flex-1 lg:w-3/5 flex flex-col">
        <VideoPlayer ref={videoRef} src={videoUrl} activeClip={activeClip} config={config} />
      </div>
      <div className="flex-1 lg:w-2/5 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Generated Clips ({displayClips.length})</h2>
          <button onClick={handleExportAll} className="flex items-center gap-2 px-4 py-2 bg-[#7B61FF] text-white font-semibold rounded-lg shadow-md hover:bg-purple-600 transition-all transform hover:scale-105 disabled:bg-gray-600 disabled:cursor-not-allowed" disabled={displayClips.length === 0 || isExportingAll || !!exportingClipId}>
            {isExportingAll ? <SpinnerIcon className="w-5 h-5" /> : <DownloadIcon className="w-5 h-5" />}
            {isExportingAll ? 'Exporting...' : 'Export All'}
          </button>
        </div>
        <div className="flex-grow bg-gray-800/50 rounded-lg p-4 overflow-y-auto space-y-4">
          {displayClips.length > 0 ? displayClips.map((clip) => (
            <ClipCard
              key={clip.id}
              clip={clip}
              isActive={activeClip?.id === clip.id}
              isExporting={exportingClipId === clip.id || (isExportingAll && exportingClipId === clip.id)}
              onPlay={() => handlePlayClip(clip)}
              onDownload={() => handleDownloadClip(clip)}
              onDelete={() => handleDeleteClip(clip.id)}
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
          <div className="fixed bottom-5 right-5 bg-gray-800 rounded-xl p-6 text-center shadow-2xl animate-fade-in-up border border-gray-700 z-50">
            <div className="flex items-center gap-4">
               <div className="text-3xl">🎉</div>
               <div>
                <h3 className="text-lg font-bold text-white text-left">{modalContent.title}</h3>
                <p className="text-gray-300 text-left">{modalContent.message}</p>
               </div>
            </div>
          </div>
      )}
    </div>
  );
};

export default Workspace;
