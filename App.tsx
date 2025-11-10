import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ProcessingConfig } from './types';
import Header from './components/Header';
import UploadSection from './components/UploadSection';
import Workspace from './components/Workspace';
import Loader from './components/Loader';
import ConfigSection from './components/ConfigSection';
import { useVideoProcessor } from './hooks/useVideoProcessor';
import { loadFFmpeg } from './services/exportService';

type FFmpegStatus = 'idle' | 'loading' | 'loaded' | 'error';

const App: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [config, setConfig] = useState<ProcessingConfig | null>(null);
  const [startProcessing, setStartProcessing] = useState(false);
  const [ffmpegStatus, setFfmpegStatus] = useState<FFmpegStatus>('idle');

  const videoUrl = useMemo(() => {
    return videoFile ? URL.createObjectURL(videoFile) : null;
  }, [videoFile]);

  // Pre-load FFmpeg as soon as a video is selected
  useEffect(() => {
    if (videoFile && ffmpegStatus === 'idle') {
      console.log("Starting FFmpeg load...");
      setFfmpegStatus('loading');
      loadFFmpeg().then(() => {
        console.log("FFmpeg loaded successfully.");
        setFfmpegStatus('loaded');
      }).catch(err => {
        console.error("Failed to load FFmpeg:", err);
        setFfmpegStatus('error');
      });
    }
  }, [videoFile, ffmpegStatus]);

  const { clips, processingState, error } = useVideoProcessor(
    videoFile,
    config,
    startProcessing,
  );

  const handleFileSelect = (file: File) => {
    setVideoFile(file);
    setStartProcessing(false);
    setConfig(null);
  };

  const handleStartProcessing = (newConfig: ProcessingConfig) => {
    setConfig(newConfig);
    setStartProcessing(true);
  };
  
  const handleReset = useCallback(() => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoFile(null);
    setStartProcessing(false);
    setConfig(null);
    setFfmpegStatus('idle');
  }, [videoUrl]);
  
  const isProcessing = startProcessing && !['idle', 'done', 'error'].includes(processingState.status);
  const isFinished = startProcessing && (processingState.status === 'done' || processingState.status === 'error');

  const renderContent = () => {
    if (isProcessing) return <Loader state={processingState} />;
    
    if (!videoFile) return <UploadSection onFileSelect={handleFileSelect} />;
    
    if (videoFile && !startProcessing && !isFinished) {
      return (
        <ConfigSection 
          videoFile={videoFile}
          onStartProcessing={handleStartProcessing}
          ffmpegStatus={ffmpegStatus}
        />
      );
    }

    if (isFinished && videoUrl && config && videoFile) {
      return (
        <Workspace
          videoUrl={videoUrl}
          videoFile={videoFile}
          clips={clips}
          processingState={processingState}
          error={error}
          config={config}
        />
      );
    }
    return null;
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <Header onReset={handleReset} showReset={!!videoFile} />
      <main className="flex-grow flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;