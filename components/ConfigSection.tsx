import React, { useState, useRef } from 'react';
import { ProcessingConfig, Language, ClipLength, VideoLayout, CaptionTemplate } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { UploadIcon } from './icons/UploadIcon';

interface ConfigSectionProps {
  videoFile: File;
  onStartProcessing: (config: ProcessingConfig) => void;
}

const Toggle: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void }> = ({ label, checked, onChange }) => (
  <label className="flex items-center justify-between cursor-pointer">
    <span className="text-gray-300">{label}</span>
    <div className="relative">
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
    </div>
  </label>
);


const ConfigSection: React.FC<ConfigSectionProps> = ({ videoFile, onStartProcessing }) => {
    const [config, setConfig] = useState<ProcessingConfig>({
        videoLanguage: 'English',
        translateCaptions: false,
        translationLanguage: 'Spanish',
        processingTimeframe: [0, 100],
        clipLength: '30-60',
        layout: 'fit',
        template: 'Hormozi1',
        hookTitle: true,
        callToAction: true,
        ctaText: 'Follow for more!',
        backgroundMusic: false,
        backgroundMusicFile: null,
        watermarkFile: null,
        wordsPerCaption: 3,
    });
    
    const [showAdvanced, setShowAdvanced] = useState(true);
    const watermarkInputRef = useRef<HTMLInputElement>(null);
    const musicInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onStartProcessing(config);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'watermark' | 'music') => {
        if (e.target.files && e.target.files[0]) {
            if (type === 'watermark') {
                setConfig({...config, watermarkFile: e.target.files[0]});
            } else {
                setConfig({...config, backgroundMusic: true, backgroundMusicFile: e.target.files[0]});
            }
        }
    }

    const clipLengthOptions: { value: ClipLength, label: string }[] = [
        { value: '<30', label: '<30s' },
        { value: '30-60', label: '30s~60s' },
        { value: '60-90', label: '60s~90s' },
        { value: 'original', label: 'Original' },
    ];
    
    const layoutOptions: { value: VideoLayout, label: string }[] = [
        { value: 'auto', label: 'Auto' },
        { value: 'fill', label: 'Fill' },
        { value: 'fit', label: 'Fit' },
        { value: 'square', label: 'Square' },
    ];

    const templateOptions: { value: CaptionTemplate, label: string }[] = [
        { value: 'Hormozi1', label: 'Hormozi 1' },
        { value: 'Hormozi2', label: 'Hormozi 2' },
        { value: 'Karaoke', label: 'Karaoke' },
    ];

    const languageOptions: Language[] = ['English', 'Hindi', 'Spanish', 'French'];
  
  return (
    <div className="w-full max-w-4xl animate-fade-in-up">
        <form onSubmit={handleSubmit} className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 sm:p-8 space-y-8">
            <div className="text-center">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
                    Forge Your Clips
                </h2>
                <p className="text-md text-gray-400">
                    Video: <span className="font-semibold text-purple-400">{videoFile.name}</span>
                </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                    {/* Language */}
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <h3 className="font-semibold text-lg mb-3 text-white">Language</h3>
                        <div className="space-y-3">
                            <div>
                                <label htmlFor="video-lang" className="block text-sm font-medium text-gray-400 mb-1">Video Language</label>
                                <select id="video-lang" value={config.videoLanguage} onChange={e => setConfig({...config, videoLanguage: e.target.value as Language})} className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-purple-500 focus:border-purple-500">
                                    {languageOptions.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                                </select>
                            </div>
                            <Toggle label="Translate Captions" checked={config.translateCaptions} onChange={c => setConfig({...config, translateCaptions: c})} />
                             {config.translateCaptions && (
                                <select value={config.translationLanguage} onChange={e => setConfig({...config, translationLanguage: e.target.value as Language})} className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-purple-500 focus:border-purple-500">
                                    {languageOptions.filter(l => l !== config.videoLanguage).map(lang => <option key={lang} value={lang}>{lang}</option>)}
                                </select>
                            )}
                        </div>
                    </div>
                     {/* Clip Length & Layout */}
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                         <h3 className="font-semibold text-lg mb-3 text-white">Format</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Preferred Clip Length</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {clipLengthOptions.map(opt => (
                                        <button type="button" key={opt.value} onClick={() => setConfig({...config, clipLength: opt.value})} className={`px-2 py-1 text-sm rounded-md transition-colors border ${config.clipLength === opt.value ? 'bg-purple-600 border-purple-400 text-white' : 'bg-gray-700 border-gray-600 hover:border-gray-500'}`}>{opt.label}</button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Layout</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {layoutOptions.map(opt => (
                                        <button type="button" key={opt.value} onClick={() => setConfig({...config, layout: opt.value})} className={`px-2 py-1 text-sm rounded-md transition-colors border ${config.layout === opt.value ? 'bg-purple-600 border-purple-400 text-white' : 'bg-gray-700 border-gray-600 hover:border-gray-500'}`}>{opt.label}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Template */}
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <h3 className="font-semibold text-lg mb-3 text-white">Template Selection</h3>
                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {templateOptions.map(opt => (
                                <button key={opt.value} type="button" onClick={() => setConfig({...config, template: opt.value})} className={`py-3 rounded-lg transition-all duration-200 border-2 text-center ${config.template === opt.value ? 'bg-purple-600 border-purple-400 shadow-lg' : 'bg-gray-700 border-gray-600 hover:border-gray-500'}`}>
                                    <span className="block font-bold text-white text-md">{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Advanced */}
                     <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="w-full flex justify-between items-center">
                            <h3 className="font-semibold text-lg text-white flex items-center gap-2"><SettingsIcon className="w-5 h-5" /> Advanced Options</h3>
                             <svg className={`w-5 h-5 text-gray-400 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        </button>
                        {showAdvanced && (
                            <div className="mt-4 pt-4 border-t border-gray-700 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-300">Add Watermark</span>
                                    <button type="button" onClick={() => watermarkInputRef.current?.click()} className="text-sm text-purple-400 hover:text-purple-300 font-semibold">
                                        {config.watermarkFile ? 'Change' : 'Upload'}
                                    </button>
                                    <input type="file" ref={watermarkInputRef} onChange={(e) => handleFileChange(e, 'watermark')} className="hidden" accept="image/png,image/jpeg" />
                                </div>
                                 {config.watermarkFile && <p className="text-xs text-gray-400 text-right -mt-2">{config.watermarkFile.name}</p>}

                                <Toggle label="Background Music" checked={config.backgroundMusic} onChange={c => setConfig({...config, backgroundMusic: c, backgroundMusicFile: c ? config.backgroundMusicFile : null})} />
                                {config.backgroundMusic && (
                                     <button type="button" onClick={() => musicInputRef.current?.click()} className="w-full text-sm text-purple-400 hover:text-purple-300 font-semibold p-2 bg-gray-700/50 rounded-md border border-dashed border-gray-600">
                                        {config.backgroundMusicFile ? config.backgroundMusicFile.name : 'Select Audio File'}
                                     </button>
                                )}
                                <input type="file" ref={musicInputRef} onChange={(e) => handleFileChange(e, 'music')} className="hidden" accept="audio/mpeg,audio/wav" />
                                
                                <Toggle label="Hook Title" checked={config.hookTitle} onChange={c => setConfig({...config, hookTitle: c})} />
                                <Toggle label="Call to Action (CTA)" checked={config.callToAction} onChange={c => setConfig({...config, callToAction: c})} />
                                {config.callToAction && (
                                    <input type="text" value={config.ctaText} onChange={e => setConfig({...config, ctaText: e.target.value})} placeholder="e.g. Follow for more!" className="w-full bg-gray-700 text-white text-sm p-2 rounded-md border border-gray-600 focus:ring-purple-500 focus:border-purple-500"/>
                                )}
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">Words Per Caption ({config.wordsPerCaption})</label>
                                     <input type="range" min="1" max="5" value={config.wordsPerCaption} onChange={e => setConfig({...config, wordsPerCaption: Number(e.target.value)})} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-sm" />
                                </div>
                            </div>
                        )}
                    </div>
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
