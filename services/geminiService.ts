import { GoogleGenAI, Type } from "@google/genai";
import { Vehicle, MaintenanceRecord, AIInsight, FuelRecord } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelName = "gemini-3-flash-preview";

export const analyzeFleetData = async (
  vehicles: Vehicle[],
  maintenance: MaintenanceRecord[]
): Promise<AIInsight> => {
  
  const dataContext = JSON.stringify({
    vehicleCount: vehicles.length,
    activeVehicles: vehicles.filter(v => v.status === 'Ativo').length,
    maintenanceRecords: maintenance.slice(0, 20), // Send recent records to avoid token limits if list is huge
    totalCost: maintenance.reduce((acc, curr) => acc + curr.cost, 0)
  });

  const prompt = `
    Analise os seguintes dados de frota e manutenção.
    Forneça insights estratégicos para um gestor de frotas.
    Retorne uma pontuação de saúde da frota (0-100), um resumo geral, 
    oportunidades de economia e pontos de atenção urgente.
    
    Dados: ${dataContext}
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            savings_opportunity: { type: Type.STRING },
            urgent_attention: { type: Type.STRING },
            fleet_health_score: { type: Type.NUMBER }
          },
          required: ["summary", "savings_opportunity", "urgent_attention", "fleet_health_score"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AIInsight;
  } catch (error) {
    console.error("Error generating fleet insight:", error);
    // Fallback if AI fails or key is missing
    return {
      summary: "Não foi possível gerar a análise com IA no momento. Verifique sua chave de API.",
      savings_opportunity: "-",
      urgent_attention: "-",
      fleet_health_score: 0
    };
  }
};

export const askFleetAI = async (
  question: string,
  vehicles: Vehicle[],
  maintenance: MaintenanceRecord[],
  fuelRecords: FuelRecord[]
): Promise<string> => {
  
  // Prepare a concise data context
  const context = JSON.stringify({
    veiculos: vehicles.map(v => ({ id: v.id, modelo: v.model, placa: v.plate, km: v.mileage, status: v.status })),
    manutencoes: maintenance.map(m => ({ desc: m.description, custo: m.cost, data: m.date, status: m.status, tipo: m.type, veiculoId: m.vehicleId })),
    abastecimentos: fuelRecords.map(f => ({ litros: f.liters, custo: f.totalCost, data: f.date, km: f.odometer, veiculoId: f.vehicleId }))
  });

  const systemInstruction = `
    Você é um assistente especialista em gestão de frotas (Fleet AI).
    Você tem acesso aos dados brutos da frota (veículos, manutenções e abastecimentos) fornecidos no contexto.
    Responda à pergunta do usuário baseando-se EXCLUSIVAMENTE nestes dados.
    Seja conciso, direto e profissional. Se precisar fazer cálculos (média de consumo, custo total), faça-os com precisão.
    Se não encontrar a informação nos dados, diga que não consta nos registros.
    Responda sempre em Português do Brasil.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Contexto de Dados JSON: ${context}\n\nPergunta do Usuário: ${question}`,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || "Desculpe, não consegui processar sua pergunta.";
  } catch (error) {
    console.error("Error asking fleet AI:", error);
    return "Ocorreu um erro ao consultar a IA. Verifique sua conexão ou tente novamente.";
  }
};