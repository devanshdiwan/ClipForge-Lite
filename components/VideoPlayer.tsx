import React, { forwardRef, useEffect, useState } from 'react';
import { Clip } from '../types';

interface VideoPlayerProps {
  src: string;
  activeClip: Clip | null;
}

const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(({ src, activeClip }, ref) => {
    const [currentCaption, setCurrentCaption] = useState('');

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

    const captionStyle = activeClip?.captionStyle;

  return (
    <div className="relative w-full max-w-md mx-auto aspect-[9/16] bg-black rounded-xl overflow-hidden shadow-2xl ring-2 ring-gray-700">
      <video
        ref={ref}
        src={src}
        controls
        className="absolute top-0 left-0 w-full h-full object-cover"
      />
      {activeClip && currentCaption && captionStyle && (
        <div className="absolute bottom-24 left-0 right-0 p-4 flex justify-center items-center pointer-events-none">
             <p 
                className={`text-2xl md:text-3xl text-center leading-tight`}
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
    </div>
  );
});

VideoPlayer.displayName = "VideoPlayer";
export default VideoPlayer;
