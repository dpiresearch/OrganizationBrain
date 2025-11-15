import { GoogleGenAI, Type, Modality } from '@google/genai';
import type { UploadedFile } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisModel = 'gemini-2.5-pro';
const ttsModel = 'gemini-2.5-flash-preview-tts';

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "A concise text summary answering the user's question based on the provided files. Format using markdown."
    },
    charts: {
      type: Type.ARRAY,
      description: "An array of data visualizations for a dashboard. Only include charts if the data supports it.",
      items: {
        type: Type.OBJECT,
        properties: {
          type: {
            type: Type.STRING,
            description: "The type of chart: 'bar', 'line', or 'pie'."
          },
          title: {
            type: Type.STRING,
            description: "The title of the chart."
          },
          dataKey: {
            type: Type.STRING,
            description: "The key for the numerical value. For consistency, this MUST be the string 'y'."
          },
          categoryKey: {
             type: Type.STRING,
            description: "The key for the category label. For consistency, this MUST be the string 'x'."
          },
          data: {
            type: Type.ARRAY,
            description: "The data for the chart. An array of objects, where each object is a data point with an 'x' key (the category) and a 'y' key (the numerical value).",
            items: {
              type: Type.OBJECT,
              properties: {
                x: {
                  type: Type.STRING,
                  description: "The category label for this data point (e.g., a date, a username)."
                },
                y: {
                  type: Type.NUMBER,
                  description: "The numerical value for this data point (e.g., a count, a duration)."
                }
              },
              required: ['x', 'y']
            }
          }
        },
        required: ['type', 'title', 'dataKey', 'categoryKey', 'data'],
      }
    }
  },
  required: ['summary', 'charts'],
};


export const analyzeData = async (userQuery: string, files: UploadedFile[]): Promise<string> => {
  const fileContents = files.map(file => `---
File: ${file.name}
Content:
${file.content}
---`).join('\n\n');

  const fullPrompt = `
    User Question: "${userQuery}"

    ${files.length > 0 ? `Please analyze the following documents to answer the user's question:
    ${fileContents}` : 'Please answer the user\'s question.'}
  `;

  const response = await ai.models.generateContent({
    model: analysisModel,
    contents: fullPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      temperature: 0.2,
    },
  });

  return response.text;
};

export const generateSpeech = async (text: string): Promise<string | null> => {
  if (!text) return null;
  
  // Clean up markdown for better speech flow
  const plainText = text.replace(/(\*|_|`|#)/g, '');

  const response = await ai.models.generateContent({
    model: ttsModel,
    contents: [{ parts: [{ text: `Say with a professional and clear tone: ${plainText}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
      },
    },
  });
  
  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  return base64Audio || null;
};