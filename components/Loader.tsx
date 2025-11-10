
import React from 'react';
import { ProcessingState } from '../types';

interface LoaderProps {
  state: ProcessingState;
}

const Loader: React.FC<LoaderProps> = ({ state }) => {
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
      <div className="w-full max-w-md text-center p-8">
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-gray-700 rounded-full"></div>
          <div 
            className="absolute inset-0 border-4 border-purple-500 rounded-full animate-spin"
            style={{ clipPath: `inset(0 ${100 - state.progress}% 0 0)` }}
          ></div>
          <div className="w-full h-full flex items-center justify-center text-xl font-bold text-purple-300">
            {Math.round(state.progress)}%
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{state.message}</h2>
        <p className="text-gray-400">Please keep this window open. This may take a moment...</p>
      </div>
    </div>
  );
};

export default Loader;
