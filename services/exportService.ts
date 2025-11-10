import { Clip, ProcessingConfig } from '../types';
import { generateSRT } from '../utils/subtitle';

let ffmpegInstance: any = null;
let loadPromise: Promise<void> | null = null;

const createAndLoadFFmpeg = async (): Promise<void> => {
    // 1. Wait for the global FFmpeg object from the script tag in index.html
    console.log('Waiting for FFmpeg global object...');
    const FFmpeg = await new Promise<any>((resolve, reject) => {
        const startTime = Date.now();
        const timeout = 120000; // 120 seconds

        const check = () => {
            if ((window as any).FFmpeg) {
                console.log("FFmpeg global object found.");
                resolve((window as any).FFmpeg);
            } else if (Date.now() - startTime > timeout) {
                reject(new Error(`FFmpeg library failed to load within ${timeout/1000} seconds. It might be blocked by an ad-blocker or a network issue.`));
            } else {
                setTimeout(check, 250); // Poll every 250ms
            }
        };
        check();
    });

    // 2. Create and load the FFmpeg instance if it doesn't exist
    if (!ffmpegInstance) {
        console.log('Creating FFmpeg instance...');
        const { createFFmpeg } = FFmpeg;
        ffmpegInstance = createFFmpeg({
            log: true,
            // Use the single-threaded core to avoid SharedArrayBuffer issues
            corePath: 'https://unpkg.com/@ffmpeg/core-st@0.12.6/dist/ffmpeg-core.js',
        });
    }

    if (!ffmpegInstance.isLoaded()) {
        console.log('Loading FFmpeg core...');
        await ffmpegInstance.load();
        console.log('FFmpeg core loaded.');
    }
};


export const loadFFmpeg = async (): Promise<void> => {
    if (!loadPromise) {
        loadPromise = createAndLoadFFmpeg();
    }
    try {
        await loadPromise;
    } catch (error) {
        // Reset promise on failure to allow retries
        loadPromise = null; 
        throw error;
    }
};

export const getFFmpeg = () => {
    const FFmpegGlobal = (window as any).FFmpeg;
    if (!FFmpegGlobal || !ffmpegInstance || !ffmpegInstance.isLoaded()) {
        throw new Error("FFmpeg not ready. Ensure loadFFmpeg() has been called and resolved successfully.");
    }
    return { ...FFmpegGlobal, getFFmpegInstance: () => ffmpegInstance };
};

export const exportClip = async (
  videoFile: File,
  clip: Clip,
  config: ProcessingConfig,
): Promise<Blob> => {
    await loadFFmpeg();

    const ffmpeg = getFFmpeg().getFFmpegInstance();
    const { fetchFile } = getFFmpeg();
    const { startTime, endTime, transcript, hook, captionStyle } = clip;
    const { layout, hookTitle, callToAction, ctaText, watermarkFile, backgroundMusic, backgroundMusicFile } = config;
    
    const inputFiles: { name: string, file: File }[] = [{ name: 'input.mp4', file: videoFile }];
    if (watermarkFile) inputFiles.push({ name: 'watermark.png', file: watermarkFile });
    if (backgroundMusic && backgroundMusicFile) inputFiles.push({ name: 'music.mp3', file: backgroundMusicFile });

    for (const { name, file } of inputFiles) {
        ffmpeg.FS('writeFile', name, await fetchFile(file));
    }

    const subtitlesFileName = 'subtitles.srt';
    const outputFileName = 'output.mp4';
    const fontFileName = 'font.ttf';

    const srtData = generateSRT(transcript);
    ffmpeg.FS('writeFile', subtitlesFileName, srtData);
    
    const fontResponse = await fetch('https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7W0Q5nw.woff2');
    const fontBlob = await fontResponse.arrayBuffer();
    ffmpeg.FS('writeFile', fontFileName, new Uint8Array(fontBlob));

    const command: string[] = ['-i', 'input.mp4'];
    if (watermarkFile) command.push('-i', 'watermark.png');
    if (backgroundMusic && backgroundMusicFile) command.push('-i', 'music.mp3');

    command.push('-ss', (startTime).toString(), '-to', (endTime).toString());

    const complexFilters: string[] = [];
    let videoStream = '[0:v]';
    let audioStream = '[0:a]';

    const videoFilters: string[] = [];
    if (layout === 'fill') videoFilters.push('crop=ih*9/16:ih');
    else if (layout === 'square') videoFilters.push('crop=ih:ih');
    
    if (layout === 'square') videoFilters.push('scale=1080:1080');
    else videoFilters.push('scale=1080:1920');

    const escapeText = (text: string) => text.replace(/'/g, "'\\''").replace(/:/g, "\\:").replace(/%/g, "\\%");
    
    const toASSColor = (hex: string) => `&H${hex.substring(5, 7)}${hex.substring(3, 5)}${hex.substring(1, 3)}`;
    const primaryColor = captionStyle.textColor;
    const outlineColor = (captionStyle.textShadow && captionStyle.textShadow !== 'none') ? '#000000' : primaryColor;
    const fontSize = 64;
    const subtitleStyle = `FontName=Inter,FontSize=${fontSize},PrimaryColour=${toASSColor(primaryColor)},BorderStyle=1,Outline=2,OutlineColour=${toASSColor(outlineColor)},Shadow=1,Alignment=2`;
    videoFilters.push(`subtitles=${subtitlesFileName}:force_style='${subtitleStyle}'`);
    
    if (hookTitle) videoFilters.push(`drawtext=fontfile=${fontFileName}:text='${escapeText(hook)}':x=(w-text_w)/2:y=(h*0.2):fontsize=80:fontcolor=white:shadowcolor=black:shadowx=2:shadowy=2`);
    if (callToAction && ctaText) videoFilters.push(`drawtext=fontfile=${fontFileName}:text='${escapeText(ctaText)}':x=(w-text_w)/2:y=(h*0.8):fontsize=60:fontcolor=white:box=1:boxcolor=black@0.5:boxborderw=10`);

    complexFilters.push(`${videoStream}${videoFilters.join(',')}[v]`);
    videoStream = '[v]';
    
    if (watermarkFile) {
        complexFilters.push(`[1:v]scale=200:-1[wm];${videoStream}[wm]overlay=W-w-20:H-h-20[v_wm]`);
        videoStream = '[v_wm]';
    }

    if (backgroundMusic && backgroundMusicFile) {
        const musicInputIndex = watermarkFile ? 2 : 1;
        complexFilters.push(`${audioStream}volume=0.8[a0];[${musicInputIndex}:a]volume=0.2[a1];[a0][a1]amix=inputs=2:duration=first[a_mix]`);
        audioStream = '[a_mix]';
    }

    command.push('-filter_complex', complexFilters.join(';'));
    command.push('-map', videoStream, '-map', audioStream);
    command.push('-preset', 'veryfast', '-c:v', 'libx264', '-c:a', 'aac', '-pix_fmt', 'yuv420p');
    command.push(outputFileName);
    
    await ffmpeg.run(...command);

    const data = ffmpeg.FS('readFile', outputFileName);
    const videoBlob = new Blob([data.buffer], { type: 'video/mp4' });
    
    inputFiles.forEach(f => ffmpeg.FS('unlink', f.name));
    ffmpeg.FS('unlink', subtitlesFileName);
    ffmpeg.FS('unlink', outputFileName);
    ffmpeg.FS('unlink', fontFileName);

    return videoBlob;
};