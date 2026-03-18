import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

async function fileToGenerativePart(file) {
  const base64EncodedDataPromise = new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
}

export const analyzeBirdImage = async (file) => {
  if (!API_KEY) {
    throw new Error("Gemini API key is missing. Please add VITE_GEMINI_API_KEY to your .env file.");
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `Identify the main bird species in this image. 
Respond ONLY with a valid JSON object in this exact format: 
{ "species": "Name of Bird", "confidence": 95 }
where confidence is an integer between 0 and 100 representing your certainty. 
Do not include any markdown formatting, backticks, or extra text.`;
    
    const imagePart = await fileToGenerativePart(file);
    
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    let text = response.text();
    
    // Clean up potential markdown formatting that Gemini might sometimes add
    let jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    }
    
    const parsed = JSON.parse(jsonString);
    return {
      species: parsed.species || "Unknown Bird",
      confidence: parsed.confidence || 0
    };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
};
