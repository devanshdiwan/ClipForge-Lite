import React, { useState, useCallback, useMemo } from 'react';
import { ProcessingConfig, ProcessingState } from './types';
import Header from './components/Header';
import UploadSection from './components/UploadSection';
import Workspace from './components/Workspace';
import Loader from './components/Loader';
import ConfigSection from './components/ConfigSection';
import { useVideoProcessor } from './hooks/useVideoProcessor';

const App: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [config, setConfig] = useState<ProcessingConfig | null>(null);
  const [startProcessing, setStartProcessing] = useState(false);

  const videoUrl = useMemo(() => {
    return videoFile ? URL.createObjectURL(videoFile) : null;
  }, [videoFile]);

  const { clips, processingState, error } = useVideoProcessor(
    videoFile,
    config,
    startProcessing
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
  }, [videoUrl]);
  
  const isProcessing = startProcessing && (processingState.status !== 'idle' && processingState.status !== 'done' && processingState.status !== 'error');
  const isFinished = startProcessing && (processingState.status === 'done' || processingState.status === 'error');

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <Header onReset={handleReset} showReset={!!videoFile} />
      <main className="flex-grow flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        {isProcessing && <Loader state={processingState} />}
        
        {!videoFile && <UploadSection onFileSelect={handleFileSelect} />}
        
        {videoFile && !startProcessing && !isFinished && (
          <ConfigSection 
            videoFile={videoFile}
            onStartProcessing={handleStartProcessing}
          />
        )}

        {isFinished && videoUrl && (
          <Workspace
            videoUrl={videoUrl}
            clips={clips}
            processingState={processingState}
            error={error}
          />
        )}
      </main>
    </div>
  );
};

export default App;
