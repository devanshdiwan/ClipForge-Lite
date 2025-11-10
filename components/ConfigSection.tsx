import React, { useState } from 'react';
import { TargetDuration, Language, CaptionDesignPreset, ProcessingConfig } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';

interface ConfigSectionProps {
  videoFile: File;
  onStartProcessing: (config: ProcessingConfig) => void;
}

const durationOptions: { value: TargetDuration, label: string, description: string }[] = [
  { value: 15, label: 'Approx. 15s', description: 'Quick Highlights' },
  { value: 30, label: 'Approx. 30s', description: 'Balanced Stories' },
  { value: 60, label: 'Approx. 60s', description: 'Full Context' },
];

const languageOptions: Language[] = ['English', 'Hindi', 'Spanish', 'French'];

const captionDesigns: { value: CaptionDesignPreset, label: string }[] = [
    { value: 'Modern', label: 'Modern' },
    { value: 'Bold', label: 'Bold' },
    { value: 'Minimal', label: 'Minimal' }
];

const ConfigSection: React.FC<ConfigSectionProps> = ({ videoFile, onStartProcessing }) => {
  const [config, setConfig] = useState<Omit<ProcessingConfig, 'targetDuration'>>({
      captionDesign: 'Modern',
      sourceLanguage: 'English',
      targetLanguage: 'English',
  });
  const [targetDuration, setTargetDuration] = useState<TargetDuration>(30);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartProcessing({ ...config, targetDuration });
  };
  
  return (
    <div className="w-full max-w-4xl text-center animate-fade-in-up">
      <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
        Customize Your Clips
      </h2>
      <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
        Your video <span className="font-semibold text-purple-400">{videoFile.name}</span> is loaded. Fine-tune the AI settings below.
      </p>

      <form onSubmit={handleSubmit} className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 space-y-8">
        
        {/* Languages Section */}
        <div>
          <label className="block text-xl font-semibold text-gray-200 mb-4 text-left">
            Language & Dubbing
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-800 rounded-lg">
            <div>
              <label htmlFor="source-lang" className="block text-sm font-medium text-gray-400 mb-2">Video Language</label>
              <select id="source-lang" value={config.sourceLanguage} onChange={e => setConfig({...config, sourceLanguage: e.target.value as Language})} className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-purple-500 focus:border-purple-500">
                {languageOptions.map(lang => <option key={lang} value={lang}>{lang}</option>)}
              </select>
            </div>
             <div>
              <label htmlFor="target-lang" className="block text-sm font-medium text-gray-400 mb-2">Convert To (Dubbing)</label>
              <select id="target-lang" value={config.targetLanguage} onChange={e => setConfig({...config, targetLanguage: e.target.value as Language})} className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-purple-500 focus:border-purple-500">
                {languageOptions.map(lang => <option key={lang} value={lang}>{lang}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Clip Length Section */}
        <div>
          <label className="block text-xl font-semibold text-gray-200 mb-4 text-left">
            Target Clip Length
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {durationOptions.map(opt => (
              <button key={opt.value} type="button" onClick={() => setTargetDuration(opt.value)} className={`p-4 rounded-lg transition-all duration-200 border-2 ${targetDuration === opt.value ? 'bg-purple-600 border-purple-400 shadow-lg' : 'bg-gray-700 border-gray-600 hover:border-gray-500'}`}>
                <span className="block font-bold text-white text-lg">{opt.label}</span>
                <span className="block text-sm text-gray-300">{opt.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Caption Design Section */}
        <div>
           <label className="block text-xl font-semibold text-gray-200 mb-4 text-left">
            Caption Design
          </label>
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {captionDesigns.map(opt => (
              <button key={opt.value} type="button" onClick={() => setConfig({...config, captionDesign: opt.value})} className={`p-4 rounded-lg transition-all duration-200 border-2 ${config.captionDesign === opt.value ? 'bg-purple-600 border-purple-400 shadow-lg' : 'bg-gray-700 border-gray-600 hover:border-gray-500'}`}>
                <span className="block font-bold text-white text-lg">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
        
        <button type="submit" className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#7B61FF] text-white font-bold text-lg rounded-lg shadow-md hover:bg-purple-600 transition-all transform hover:scale-105">
          <SparklesIcon className="w-6 h-6" />
          Generate Clips
        </button>
      </form>
    </div>
  );
};

export default ConfigSection;
