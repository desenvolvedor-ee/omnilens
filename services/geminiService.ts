
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { UniversalReport, FileType } from "../types";

// Inicialização estrita conforme as diretrizes
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getPromptForCategory = (category: FileType, filename: string): string => {
  const base = `Você é o OmniLens Pro, um sistema de inteligência multimodal de nível militar. Analise o arquivo "${filename}" com precisão forense.`;
  
  switch (category) {
    case 'video':
      return `${base} Analise os frames visuais. Identifique eventos críticos, objetos em movimento, texto legível e mudanças de cena. Gere uma linha do tempo técnica.`;
    case 'audio':
      return `${base} Transcreva o áudio com alta fidelidade. Analise a variação de tom, identifique falantes se possível e resuma os tópicos principais.`;
    case 'image':
      return `${base} Realize uma análise visual profunda: OCR de textos, identificação de objetos, geolocalização sugerida pelo contexto e metadados visuais.`;
    case 'document':
      return `${base} Realize a leitura completa. Extraia fatos, nomes próprios, datas e faça uma síntese executiva dos argumentos principais.`;
    default:
      return `${base} Realize uma análise técnica exaustiva do conteúdo fornecido.`;
  }
};

export const analyzeMultimodal = async (
  parts: any[],
  category: FileType,
  filename: string
): Promise<UniversalReport> => {
  // Uso de Gemini 3 Pro conforme solicitado para tarefas complexas
  const model = 'gemini-3-pro-preview';
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
