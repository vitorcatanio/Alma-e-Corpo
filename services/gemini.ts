import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, AIWorkoutSuggestion, SportType } from "../types";

export const generateWorkoutSuggestion = async (
    profile: UserProfile, 
    sport: SportType
): Promise<AIWorkoutSuggestion | null> => {
    
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const model = 'gemini-3-flash-preview';

        const prompt = `
        Crie um plano de treino detalhado para um cliente com o seguinte perfil:
        - Esporte: ${sport}
        - Idade: ${profile.age}
        - Sexo: ${profile.gender}
        - Objetivo: ${profile.goal}
        
        Forneça uma lista estruturada de exercícios incluindo nome (em português do Brasil), séries, repetições (ou distância), carga (ou ritmo), e descanso.
        Também forneça uma justificativa (rationale) para este treino.
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        rationale: { type: Type.STRING },
                        exercises: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    sets: { type: Type.NUMBER },
                                    repsOrDistance: { type: Type.STRING },
                                    loadOrPace: { type: Type.STRING },
                                    rest: { type: Type.STRING },
                                    notes: { type: Type.STRING }
                                }
                            }
                        }
                    },
                    propertyOrdering: ["title", "rationale", "exercises"]
                }
            }
        });

        const text = response.text;
        if (text) {
            return JSON.parse(text) as AIWorkoutSuggestion;
        }
        return null;

    } catch (error) {
        console.error("Gemini AI Error:", error);
        return null;
    }
};

export const analyzeProgress = async (
    progressHistory: {date: string, weight: number}[],
    goal: string
): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const model = 'gemini-3-flash-preview';
        
        const historyStr = JSON.stringify(progressHistory);
        const prompt = `
        Analise o seguinte histórico de peso para um cliente com o objetivo: "${goal}".
        Histórico: ${historyStr}
        
        Dê um resumo curto e encorajador de 2 frases sobre a tendência e uma dica rápida. Responda em Português do Brasil.
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });

        return response.text || "Continue focado nos seus objetivos!";

    } catch (e) {
        console.error("Gemini Progress Analysis Error:", e);
        return "Ótimo trabalho mantendo seu progresso atualizado!";
    }
}