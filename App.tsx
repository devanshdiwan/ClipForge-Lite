import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ProcessingConfig, ProcessingState } from './types';
import Header from './components/Header';
import UploadSection from './components/UploadSection';
import Workspace from './components/Workspace';
import Loader from './components/Loader';
import ConfigSection from './components/ConfigSection';
import { useVideoProcessor } from './hooks/useVideoProcessor';
import SelectKeyScreen from './components/SelectKeyScreen';
import { SpinnerIcon } from './components/icons/SpinnerIcon';

// Fix: Defined an AIStudio interface to resolve conflicting type declarations for `window.aistudio`.
// Fix: Moved the AIStudio interface declaration inside the `declare global` block to resolve a TypeScript error where the type was being treated as local to the module, causing a conflict with global window augmentation.
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio: AIStudio;
  }
}

const App: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [config, setConfig] = useState<ProcessingConfig | null>(null);
  const [startProcessing, setStartProcessing] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'ready' | 'needed' | 'unavailable'>('checking');

  useEffect(() => {
    const checkApiKey = async () => {
      // The `aistudio` object might be injected after the initial script load.
      // We'll poll for a short period to see if it becomes available to avoid race conditions.
      let aistudioReady = false;
      for (let i = 0; i < 5; i++) {
        if (typeof window.aistudio?.hasSelectedApiKey === 'function') {
          aistudioReady = true;
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (aistudioReady) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setApiKeyStatus(hasKey ? 'ready' : 'needed');
      } else {
        console.error("AI Studio API key management is not available in this environment.");
        setApiKeyStatus('unavailable');
      }
    };
    checkApiKey();
  }, []);

  const handleApiKeyError = useCallback(() => {
    setApiKeyStatus('needed');
  }, []);

  const videoUrl = useMemo(() => {
    return videoFile ? URL.createObjectURL(videoFile) : null;
  }, [videoFile]);

  const { clips, processingState, error } = useVideoProcessor(
    videoFile,
    config,
    startProcessing,
    handleApiKeyError,
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
  
  const handleSelectKey = async () => {
    if (typeof window.aistudio?.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      // Assume success to avoid race conditions
      setApiKeyStatus('ready');
    } else {
      // This path should ideally not be reached due to the initial check.
      alert("API Key selection is not available in this environment.");
    }
  };

  const isProcessing = startProcessing && !['idle', 'done', 'error'].includes(processingState.status);
  const isFinished = startProcessing && (processingState.status === 'done' || processingState.status === 'error');

  const renderContent = () => {
    if (apiKeyStatus === 'checking') {
      return (
         <div className="flex flex-col items-center justify-center h-full">
            <SpinnerIcon className="w-12 h-12 text-purple-500" />
            <p className="mt-4 text-lg">Checking API Key status...</p>
         </div>
      );
    }

    if (apiKeyStatus === 'unavailable') {
      return (
        <div className="text-center p-8 bg-yellow-900/20 border border-yellow-500 rounded-lg max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold text-yellow-400 mb-2">Environment Error</h3>
          <p className="text-yellow-300">API Key selection is not available in this environment.</p>
          <p className="text-sm text-gray-400 mt-2">This application requires integration with a platform that provides API key management to function correctly.</p>
        </div>
      );
    }
    
    if (apiKeyStatus === 'needed') {
      return <SelectKeyScreen onSelectKey={handleSelectKey} />;
    }

    if (isProcessing) return <Loader state={processingState} />;
    
    if (!videoFile) return <UploadSection onFileSelect={handleFileSelect} />;
    
    if (videoFile && !startProcessing && !isFinished) {
      return (
        <ConfigSection 
          videoFile={videoFile}
          onStartProcessing={handleStartProcessing}
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
      <Header onReset={handleReset} showReset={!!videoFile && apiKeyStatus === 'ready'} />
      <main className="flex-grow flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;