
import React from 'react';
import { SparklesIcon } from './icons/SparklesIcon';

interface HeaderProps {
  onReset: () => void;
  showReset: boolean;
}

const Header: React.FC<HeaderProps> = ({ onReset, showReset }) => {
  return (
    <header className="w-full p-4 border-b border-gray-700 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <SparklesIcon className="w-7 h-7 text-[#7B61FF]" />
          <h1 className="text-2xl font-bold text-white">ClipForge Lite</h1>
        </div>
        {showReset && (
           <button 
             onClick={onReset}
             className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 rounded-md hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 transition-colors">
             Start Over
           </button>
        )}
      </div>
    </header>
  );
};

export default Header;
