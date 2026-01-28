
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { UniversalReport, FileType } from "../types";

const getPromptForCategory = (category: FileType, filename: string): string => {
  const base = `Você é o OmniLens Pro, um sistema de inteligência multimodal de nível militar. Analise o arquivo "${filename}" com precisão forense.`;
  
  switch (category) {
    case 'video':
      return `${base} Analise os frames visuais. Identifique eventos críticos, objetos em movimento e texto legível.`;
    case 'audio':
      return `${base} Transcreva o áudio com alta fidelidade e identifique falantes.`;
    default:
      return `${base} Realize uma análise técnica exaustiva do conteúdo.`;
  }
};

export const analyzeMultimodal = async (
  parts: any[],
  category: FileType,
  filename: string,
  providedApiKey?: string
): Promise<UniversalReport> => {
  const apiKey = providedApiKey || (typeof process !== 'undefined' ? process.env.API_KEY : '') || '';
  
  if (!apiKey) {
    throw new Error("API_KEY_REQUIRED");
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-2.0-flash';
  const prompt = getPromptForCategory(category, filename);

  const response: GenerateContentResponse = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        ...parts,
        { text: prompt + "\nResponda estritamente em JSON (idioma Português do Brasil). Estrutura: { summary: string, keyInsights: string[], detailedAnalysis: [{timestamp: string, description: string, tags: string[], importance: string}], entitiesFound: string[], sentiment: string }" }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          keyInsights: { type: Type.ARRAY, items: { type: Type.STRING } },
          detailedAnalysis: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                timestamp: { type: Type.STRING },
                description: { type: Type.STRING },
                tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                importance: { type: Type.STRING }
              },
              required: ["description", "tags", "importance"]
            }
          },
          entitiesFound: { type: Type.ARRAY, items: { type: Type.STRING } },
          sentiment: { type: Type.STRING }
        },
        required: ["summary", "keyInsights", "detailedAnalysis"]
      }
    }
  });

  const textOutput = response.text || '{}';
  const result = JSON.parse(textOutput);
  
  return {
    ...result,
    fileId: Math.random().toString(36).substr(2, 9)
  };
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });
};
