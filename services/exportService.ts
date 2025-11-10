import { Clip, ProcessingConfig } from '../types';
import { generateSRT } from '../utils/subtitle';

let ffmpegInstance: any = null;

export const getFFmpeg = () => {
    const ffmpegGlobal = (window as any).FFmpeg;
    if (!ffmpegGlobal) {
        throw new Error("FFmpeg library not loaded. It might be blocked by an ad-blocker or a network issue.");
    }
    return { ...ffmpegGlobal, getFFmpegInstance: () => ffmpegInstance };
}


export const loadFFmpeg = async (): Promise<void> => {
  if (ffmpegInstance && ffmpegInstance.isLoaded()) return;

  const { createFFmpeg } = getFFmpeg();
  ffmpegInstance = createFFmpeg({
    log: true,
    corePath: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
  });
  await ffmpegInstance.load();
};

export const exportClip = async (
  videoFile: File,
  clip: Clip,
  config: ProcessingConfig,
): Promise<Blob> => {
    if (!ffmpegInstance || !ffmpegInstance.isLoaded()) {
        await loadFFmpeg();
    }

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
