import { GoogleGenAI, Type } from "@google/genai";
import { Language } from '../types';

const API_KEY = (typeof process !== 'undefined' && process.env?.API_KEY) || '';

if (!API_KEY) {
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const generateTranscriptAndScenes = async (
  videoTopic: string,
  sourceLanguage: Language,
  targetLanguage: Language
): Promise<{ start: number, end: number, text: string }[]> => {
  const isTranslation = sourceLanguage !== targetLanguage;
  const prompt = `
    You are an expert video content creator and linguist.
    A user has provided a video about "${videoTopic}" which is in ${sourceLanguage}.
    Your task is to generate a plausible, engaging 2-minute transcript for this video, but delivered in ${targetLanguage}.
    ${isTranslation ? `This means you must effectively translate and culturally adapt the content from ${sourceLanguage} to ${targetLanguage}, making it sound natural and fluent, as if it were originally created in ${targetLanguage}. This simulates video dubbing.` : ''}
    The video should have several distinct, engaging segments.
    Format the output as a JSON array of objects. Each object must have "start" (start time in seconds), "end" (end time in seconds), and "text" (the spoken line in ${targetLanguage}).
    Ensure timestamps are sequential and logical for a 2-minute video.
    Provide at least 15-20 transcript lines.
  `;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              start: { type: Type.NUMBER },
              end: { type: Type.NUMBER },
              text: { type: Type.STRING },
            },
            required: ["start", "end", "text"],
          },
        },
      },
    });
    const jsonText = response.text.trim();
    try {
        return JSON.parse(jsonText);
    } catch (parseError) {
        console.error("Error parsing Gemini response as JSON:", jsonText);
        throw new Error("Failed to parse transcript from Gemini. The model may have returned an invalid format.");
    }
  } catch (error) {
    console.error("Error generating transcript:", error);
    if (error instanceof Error && (error.message.includes("API key not valid") || error.message.includes("API_KEY"))) {
       throw new Error("Your API key is not valid. Please check your environment configuration.");
    }
    throw new Error("Failed to generate transcript from Gemini.");
  }
};

export const generateHook = async (transcriptExcerpt: string, targetLanguage: Language): Promise<string> => {
  const prompt = `
    Generate a short, viral-style hook (under 15 words) in ${targetLanguage} for a video clip with the following transcript.
    Make it intriguing and attention-grabbing. Do not include quotes.
    Transcript: "${transcriptExcerpt}"
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
