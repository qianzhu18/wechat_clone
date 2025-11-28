import { GoogleGenAI, Type } from "@google/genai";
import { MessageItem } from '../types';

export const generateScript = async (prompt: string, count: number): Promise<MessageItem[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
    You are a WeChat marketing conversation generator. 
    You create realistic, engaging dialogs between a "me" (seller/marketer) and "other" (customer/client).
    
    Rules:
    1. Language: Chinese (Simplified).
    2. Punctuation: MUST use full-width Chinese punctuation (e.g., ，。？！) instead of half-width.
    3. Tone: Casual, friendly, using emojis appropriate for WeChat.
    4. Format: Generate a conversation based on the user's scenario.
    5. Do not include timestamp messages, only conversation turns.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Scenario: ${prompt}. Generate about ${count} messages.`,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            role: { 
              type: Type.STRING, 
              enum: ["me", "other"],
              description: "Who is sending the message. 'me' is the green bubble (right), 'other' is white bubble (left)."
            },
            content: { 
              type: Type.STRING,
              description: "The text content of the message."
            }
          },
          required: ["role", "content"]
        }
      }
    }
  });

  const generatedData = JSON.parse(response.text || "[]");

  // Map to our internal format with UUIDs
  return generatedData.map((item: any) => ({
    id: crypto.randomUUID(),
    role: item.role,
    type: 'text',
    content: item.content
  }));
};