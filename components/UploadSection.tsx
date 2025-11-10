import React, { useCallback, useState } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { LinkIcon } from './icons/LinkIcon';

interface UploadSectionProps {
  onFileSelect: (file: File) => void;
}

const UploadSection: React.FC<UploadSectionProps> = ({ onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');

  const isValidYoutubeUrl = (url: string) => url.includes('youtube.com') || url.includes('youtu.be');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setYoutubeUrl(e.target.value);
  };

  const handleUrlImport = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isValidYoutubeUrl(youtubeUrl)) {
      alert("YouTube import is for demonstration purposes only.\n\nTo enable full video processing and downloading, please upload a local .mp4, .mov, or .webm file. Client-side downloading from YouTube is restricted by browser security policies.");
      const videoIdMatch = youtubeUrl.match(/(?:v=|\/|embed\/|watch\?v=|&v=)([a-zA-Z0-9_-]{11})/);
      const videoName = videoIdMatch ? videoIdMatch[1] : `youtube_video`;
      const dummyFile = new File(
        ["dummy content for demo"],
        `${videoName}.mp4`,
        { type: "video/mp4" }
      );
      onFileSelect(dummyFile);
    }
  };


  return (
    <div className="text-center w-full max-w-2xl">
      <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
        Turn Long Videos Into Viral Shorts
      </h2>
      <p className="text-lg text-gray-400 mb-8 max-w-xl mx-auto">
        Upload your video, and let our AI automatically find the most engaging moments and create ready-to-post vertical clips.
      </p>

      <div 
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        className={`relative group border-2 border-dashed border-gray-600 rounded-2xl p-8 sm:p-12 transition-all duration-300 ${isDragging ? 'border-purple-500 bg-gray-800/50' : 'hover:border-gray-500'}`}>
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="bg-gray-800 p-4 rounded-full group-hover:bg-purple-500 transition-colors">
            <UploadIcon className="w-8 h-8 text-gray-400 group-hover:text-white" />
          </div>
          <p className="text-lg font-semibold text-gray-300">
            Drag & Drop a video file here
          </p>
          <p className="text-gray-500">or</p>
          <label
            htmlFor="file-upload"
            className="cursor-pointer px-6 py-3 bg-[#7B61FF] text-white font-semibold rounded-lg shadow-md hover:bg-purple-600 transition-all transform hover:scale-105"
          >
            Browse Files
          </label>
          <input
            id="file-upload"
            name="file-upload"
            type="file"
            className="sr-only"
            accept="video/mp4,video/quicktime,video/webm"
            onChange={handleFileChange}
          />
        </div>
      </div>
       <p className="text-xs text-gray-500 mt-4">Supports .mp4, .mov and .webm files.</p>

       <div className="my-6 flex items-center">
        <div className="flex-grow border-t border-gray-700"></div>
        <span className="flex-shrink mx-4 text-gray-500 uppercase text-sm font-semibold">Or Import from YouTube</span>
        <div className="flex-grow border-t border-gray-700"></div>
      </div>
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <LinkIcon className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type="url"
          value={youtubeUrl}
          onChange={handleUrlChange}
          placeholder="Paste a YouTube link here"
          className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg py-3 pl-12 pr-32 focus:ring-purple-500 focus:border-purple-500 transition-colors"
          aria-label="YouTube video URL"
        />
        <button
          onClick={handleUrlImport}
          disabled={!isValidYoutubeUrl(youtubeUrl)}
          className="absolute inset-y-1.5 right-1.5 px-5 py-2 bg-[#7B61FF] text-white font-semibold rounded-md shadow-md hover:bg-purple-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
          aria-label="Import from YouTube"
        >
          Import
        </button>
      </div>
    </div>
  );
};

export default UploadSection;
