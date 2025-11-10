import { GoogleGenAI, Type } from "@google/genai";
import { Language } from '../types';

// Helper function to get a configured AI instance securely
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    // This provides a clearer, immediate error if the key is missing.
    throw new Error("Your API key is not valid. Please check your environment configuration.");
  }
  return new GoogleGenAI({ apiKey });
};


interface Scene {
  topic: string;
  summary: string;
  viralityScore: number;
  reasoning: string;
  startTime: number;
  endTime: number;
  transcript: { 
      start: number; 
      end: number; 
      text: string; 
      emoji?: string;
      words: { start: number; end: number; text: string }[];
  }[];
}

export const analyzeVideoContent = async (
  frames: string[],
  duration: number,
  videoTopic: string,
  sourceLanguage: Language,
  targetLanguage: Language,
  clipLengthRange: { min: number; max: number }
): Promise<{ scenes: Scene[] }> => {
  const ai = getAI();
  const isTranslation = sourceLanguage !== targetLanguage;
  
  const prompt = `
    You are an expert AI video editor, like the engine behind Opus Clip. Your task is to analyze a video's content based on a series of frames and identify the most viral-worthy short clips.

    The user has provided a video about "${videoTopic}". The video is ${Math.round(duration)} seconds long and is in ${sourceLanguage}.
    I am providing you with ${frames.length} frames sampled evenly from the video.

    Your process is:
    1.  **Analyze Visuals & Generate Plausible Transcript:** Review the frames to understand the video's narrative. Based on visuals and topic, create a plausible, detailed transcript in ${targetLanguage}. ${isTranslation ? `This involves translating from ${sourceLanguage}.` : ''}
    2.  **CRITICAL - Word-Level Timestamps:** For each line in the transcript, you MUST provide precise, word-by-word timestamps. Each word needs its own "start" and "end" time. This is essential for karaoke-style captions.
    3.  **Suggest Emojis:** For each transcript line, suggest a single, relevant "emoji" that captures the tone or content of the sentence.
    4.  **Segment into Scenes:** Break the video into distinct scenes based on topics. Each scene MUST have a duration between ${clipLengthRange.min} and ${clipLengthRange.max} seconds.
    5.  **Score for Virality:** For each scene, assign a \`viralityScore\` (1-10) and provide \`reasoning\`.
    6.  **Summarize:** Write a short \`summary\` for each scene.

    The final output MUST be a JSON object with a "scenes" key. Each scene must contain: "topic", "summary", "viralityScore", "reasoning", "startTime", "endTime", and a "transcript" array. Each object in the "transcript" array must contain: "start", "end", "text", an optional "emoji", and a "words" array (containing objects with "start", "end", "text").

    Ensure all timestamps are accurate relative to the video's ${Math.round(duration)}s duration. Generate at least 5-8 distinct scenes.
  `;

  const contentParts = [
    { text: prompt },
    ...frames.map(frameData => ({
        inlineData: {
            mimeType: 'image/jpeg',
            data: frameData.split(',')[1],
        }
    }))
  ];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro', // UPGRADED MODEL for better complex reasoning
      contents: { parts: contentParts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  topic: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  viralityScore: { type: Type.NUMBER },
                  reasoning: { type: Type.STRING },
                  startTime: { type: Type.NUMBER },
                  endTime: { type: Type.NUMBER },
                  transcript: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        start: { type: Type.NUMBER },
                        end: { type: Type.NUMBER },
                        text: { type: Type.STRING },
                        emoji: { type: Type.STRING },
                        words: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              start: { type: Type.NUMBER },
                              end: { type: Type.NUMBER },
                              text: { type: Type.STRING },
                            },
                            required: ["start", "end", "text"],
                          }
                        }
                      },
                      required: ["start", "end", "text", "words"],
                    },
                  },
                },
                required: ["topic", "summary", "viralityScore", "reasoning", "startTime", "endTime", "transcript"],
              },
            },
          },
          required: ["scenes"],
        },
      },
    });
    const jsonText = response.text.trim();
    try {
        return JSON.parse(jsonText);
    } catch (parseError) {
        console.error("Error parsing Gemini response as JSON:", jsonText);
        throw new Error("Failed to parse AI analysis. The model may have returned an invalid format.");
    }
  } catch (error) {
    console.error("Error analyzing video content:", error);
    if (error instanceof Error && error.message.includes("API key")) {
       throw error;
    }
    throw new Error("Failed to analyze video content with Gemini.");
  }
};

export const generateHook = async (transcriptExcerpt: string, targetLanguage: Language): Promise<string> => {
  const ai = getAI();
  const prompt = `
    Generate a short, viral-style hook (under 15 words) in ${targetLanguage} for a video clip with the following summary.
    Make it intriguing and attention-grabbing. Do not include quotes.
    Summary: "${transcriptExcerpt}"
  `;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    return response.text.trim().replace(/"/g, '');
  } catch (error) {
    console.error("Error generating hook:", error);
    throw new Error("Failed to generate hook from Gemini.");
  }
};