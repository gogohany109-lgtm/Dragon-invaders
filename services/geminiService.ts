import { GoogleGenAI } from "@google/genai";

// Initialize the API client
const apiKey = process.env.API_KEY || '';
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export const generateDragonLore = async (score: number, outcome: 'victory' | 'defeat'): Promise<string> => {
  if (!ai) return "The oracles are silent (API Key missing).";

  try {
    const prompt = `
      You are a medieval chronicler describing the outcome of a battle between a lone Knight and the Dragon Horde.
      
      Outcome: ${outcome.toUpperCase()}
      Score Achieved: ${score}
      
      Write a very short, dramatic, 2-sentence flavor text suitable for a "Game Over" or "Victory" screen. 
      Use archaic but readable English. 
      If Victory, praise the knight's valor. 
      If Defeat, describe the kingdom burning.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text?.trim() || "The history books are illegible.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The mists of time obscure the prophecy.";
  }
};