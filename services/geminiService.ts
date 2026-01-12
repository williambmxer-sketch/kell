
import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeOS(vehicleModel: string, fault: string) {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analise tecnicamente o seguinte problema em uma oficina mecânica:
      Veículo: ${vehicleModel}
      Falha Relatada: ${fault}
      
      Forneça um breve laudo técnico sugerindo possíveis causas e peças que devem ser verificadas.`,
      config: {
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            possibleCauses: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Lista de possíveis causas mecânicas"
            },
            suggestedParts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Peças recomendadas para verificação/substituição"
            },
            technicalNote: {
              type: Type.STRING,
              description: "Uma breve nota técnica para o mecânico"
            }
          },
          required: ["possibleCauses", "suggestedParts", "technicalNote"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return null;
  }
}
