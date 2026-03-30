import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const chatWithAI = async (message: string, context?: string) => {
  const model = "gemini-3-flash-preview";
  const systemInstruction = `You are a professional financial advisor AI for the WealthWise system. 
  Your goal is to help users analyze their portfolio, discuss market trends, and suggest strategies.
  Keep your answers concise, professional, and data-driven.
  Avoid generic advice; try to be specific based on the context provided.
  Current context: ${context || "No specific context provided."}`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: message }] }],
      config: {
        systemInstruction,
      },
    });
    return response.text;
  } catch (error) {
    console.error("AI Chat Error:", error);
    return "Sorry, I encountered an error while processing your request. Please try again later.";
  }
};
