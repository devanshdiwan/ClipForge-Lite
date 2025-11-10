import React, { forwardRef, useEffect, useState, useLayoutEffect } from 'react';
import { Clip, ProcessingConfig } from '../types';

interface VideoPlayerProps {
  src: string;
  activeClip: Clip | null;
  config: ProcessingConfig;
}

const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(({ src, activeClip, config }, ref) => {
    const [currentCaption, setCurrentCaption] = useState('');
    const [videoLayoutClass, setVideoLayoutClass] = useState('object-cover');

    useEffect(() => {
        const videoElement = (ref as React.RefObject<HTMLVideoElement>).current;
        if (!videoElement) return;

        const handleTimeUpdate = () => {
            if (activeClip) {
                const currentTime = videoElement.currentTime;
                if (currentTime >= activeClip.endTime) {
                    videoElement.pause();
                }
                const activeLine = activeClip.transcript.find(line => currentTime >= line.start && currentTime <= line.end);
                setCurrentCaption(activeLine ? activeLine.text : '');
            } else {
                setCurrentCaption('');
            }
        };
        
        videoElement.addEventListener('timeupdate', handleTimeUpdate);

        return () => {
            if (videoElement) {
              videoElement.removeEventListener('timeupdate', handleTimeUpdate);
            }
        };
    }, [activeClip, ref]);

    useLayoutEffect(() => {
        const video = (ref as React.RefObject<HTMLVideoElement>).current;
        if (!video) return;

        const setLayout = () => {
            switch (config.layout) {
                case 'fill':
                    setVideoLayoutClass('object-cover');
                    break;
                case 'fit':
                case 'square': 
                    setVideoLayoutClass('object-contain');
                    break;
                case 'auto':
                    if (video.videoWidth / video.videoHeight > 9 / 16) {
                        setVideoLayoutClass('object-contain');
                    } else {
                        setVideoLayoutClass('object-cover');
                    }
                    break;
                default:
                    setVideoLayoutClass('object-cover');
            }
        };

        if (video.readyState >= 1) {
            setLayout();
        } else {
            video.addEventListener('loadedmetadata', setLayout, { once: true });
        }

        return () => {
            video.removeEventListener('loadedmetadata', setLayout);
        };
    }, [config.layout, ref]);

    const captionStyle = activeClip?.captionStyle;
    const containerAspectRatio = config.layout === 'square' ? 'aspect-[1/1]' : 'aspect-[9/16]';

  return (
    <div className={`relative w-full max-w-md mx-auto ${containerAspectRatio} bg-black rounded-xl overflow-hidden shadow-2xl ring-2 ring-gray-700`}>
      <video
        ref={ref}
        src={src}
        controls
        className={`absolute top-0 left-0 w-full h-full ${videoLayoutClass}`}
      />
      {activeClip && config.hookTitle && (
        <div className="absolute top-16 left-0 right-0 p-4 flex justify-center items-center pointer-events-none">
            <p className="text-xl font-bold text-white text-center" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                {activeClip.hook}
            </p>
        </div>
      )}

      {activeClip && currentCaption && captionStyle && (
        <div className="absolute inset-0 p-4 flex justify-center items-center pointer-events-none">
             <p 
                className={`text-2xl md:text-3xl text-center leading-tight max-w-[90%]`}
                style={{
                    fontFamily: `'${captionStyle.font}', sans-serif`,
                    color: captionStyle.textColor,
                    backgroundColor: captionStyle.backgroundColor,
                    textShadow: captionStyle.textShadow,
                    fontWeight: captionStyle.fontWeight,
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                }}
             >
                {currentCaption}
             </p>
        </div>
      )}

      {activeClip && config.callToAction && config.ctaText && (
          <div className="absolute bottom-16 left-0 right-0 p-4 flex justify-center items-center pointer-events-none">
               <p className="text-lg font-semibold text-gray-200 bg-black/50 p-2 rounded-md" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
                  {config.ctaText}
               </p>
          </div>
      )}
    </div>
  );
});

VideoPlayer.displayName = "VideoPlayer";
export default VideoPlayer;
