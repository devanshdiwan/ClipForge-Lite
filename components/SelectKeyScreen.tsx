import React from 'react';
import { KeyIcon } from './icons/KeyIcon';

interface SelectKeyScreenProps {
    onSelectKey: () => void;
}

const SelectKeyScreen: React.FC<SelectKeyScreenProps> = ({ onSelectKey }) => {
    return (
        <div className="text-center w-full max-w-lg animate-fade-in-up">
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 sm:p-12">
                <div className="mx-auto bg-purple-900/50 w-16 h-16 rounded-full flex items-center justify-center border-2 border-purple-700">
                   <KeyIcon className="w-8 h-8 text-purple-400" />
                </div>
                <h2 className="text-3xl font-extrabold text-white mt-6 mb-3">
                    API Key Required
                </h2>
                <p className="text-gray-400 mb-6">
                    To use the AI-powered features of ClipForge Lite, you need to provide your own Gemini API key. Your key is stored securely and is only used for processing your videos.
                </p>
                <button
                    onClick={onSelectKey}
                    className="w-full px-6 py-4 bg-[#7B61FF] text-white font-bold text-lg rounded-lg shadow-md hover:bg-purple-600 transition-all transform hover:scale-105"
                >
                    Select API Key
                </button>
                 <p className="text-xs text-gray-500 mt-4">
                    Using the Gemini API may incur costs. For details, see the{' '}
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-purple-400">
                        billing documentation
                    </a>.
                </p>
            </div>
        </div>
    );
};

export default SelectKeyScreen;
