
import { GoogleGenAI, Type } from "@google/genai";
import { Vehicle, MaintenanceRecord, AIInsight, FuelRecord } from '../types';

const modelName = "gemini-3-pro-preview";

/**
 * Remove campos pesados (Base64) que não agregam valor à análise textual
 * e causam erro de limite de tokens.
 */
const sanitizeData = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  } else if (typeof data === 'object' && data !== null) {
    const sanitized = { ...data };
    const heavyFields = ['receiptUrl', 'photoUrl', 'avatarUrl', 'receipt_url', 'photo_url'];
    heavyFields.forEach(field => {
      if (field in sanitized) {
        sanitized[field] = "[REMOVED_FOR_ANALYSIS]";
      }
    });
    return sanitized;
  }
  return data;
};

const cleanJsonResponse = (text: string): string => {
  const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    return cleaned.substring(start, end + 1);
  }
  return cleaned;
};

export const getThemeInsight = async (
  theme: 'fuel' | 'maintenance' | 'planner',
  data: any
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const themes = {
    fuel: "Analise os abastecimentos. Identifique médias de KM/L suspeitas, variações de preço e eficiência da frota.",
    maintenance: "Analise o histórico de manutenção. Identifique gastos excessivos em corretivas e sugira melhorias no cronograma.",
    planner: "Analise a frota e sugira um plano de manutenção preventiva baseado na idade e quilometragem dos veículos."
  };

  // Sanitiza os dados para remover imagens em Base64
  const sanitizedData = sanitizeData(data);

  const prompt = `
    Contexto: Gestão de Frota Profissional.
    Tema: ${themes[theme]}
    Dados para análise: ${JSON.stringify(sanitizedData)}
    
    Instrução: Retorne um parágrafo conciso (máximo 4 linhas) com uma recomendação técnica acionável baseada estritamente nos dados. 
    Seja direto e use tom profissional.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    });
    return response.text || "Não foi possível gerar um insight no momento.";
  } catch (error: any) {
    console.error(`Erro no insight de ${theme}:`, error);
    if (error?.message?.includes('token count')) {
      return "Erro: O volume de dados enviado é muito grande para análise imediata. Tente filtrar os registros.";
    }
    return "Falha ao consultar a IA. Verifique os dados e tente novamente.";
  }
};

export const analyzeFleetData = async (
  vehicles: Vehicle[],
  maintenance: MaintenanceRecord[]
): Promise<AIInsight> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const dataContext = JSON.stringify({
    vehicleCount: vehicles.length,
    activeVehicles: vehicles.filter(v => v.status === 'Ativo').length,
    maintenanceRecords: sanitizeData(maintenance.slice(0, 30)),
    totalCost: maintenance.reduce((acc, curr) => acc + curr.cost, 0),
    vehiclesSummary: sanitizeData(vehicles)
  });

  const prompt = `
    Analise os seguintes dados de frota e manutenção.
    Forneça insights estratégicos para um gestor de frotas.
    Retorne OBRIGATORIAMENTE um JSON puro com:
    - summary: resumo geral dos custos e saúde da frota.
    - savings_opportunity: onde o gestor pode economizar (ex: pneus, combustivel, preventivas).
    - urgent_attention: o que precisa de ação imediata.
    - fleet_health_score: nota de 0 a 100.
    
    Dados atuais: ${dataContext}
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
    if (!text) throw new Error("Sem resposta da IA");
    
    return JSON.parse(cleanJsonResponse(text)) as AIInsight;
  } catch (error) {
    console.error("Erro na análise da frota:", error);
    return {
      summary: "Não foi possível gerar a análise automática no momento.",
      savings_opportunity: "Revise os custos de manutenção manualmente.",
      urgent_attention: "Verifique se há ordens de manutenção críticas pendentes.",
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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const context = JSON.stringify({
    veiculos: sanitizeData(vehicles).map((v: any) => ({ modelo: `${v.brand} ${v.model}`, placa: v.plate, km: v.mileage, status: v.status })),
    manutencoes: sanitizeData(maintenance).map((m: any) => ({ desc: m.description, custo: m.cost, data: m.date, status: m.status, tipo: m.type })),
    abastecimentos: sanitizeData(fuelRecords).map((f: any) => ({ litros: f.liters, custo: f.totalCost, data: f.date, km: f.odometer }))
  });

  const systemInstruction = `
    Você é o Fleet AI, assistente virtual especializado em gestão de frotas.
    Contexto da frota atual: ${context}
    Instruções: Responda baseado nos dados fornecidos, seja conciso e profissional em Português (Brasil).
    Se o usuário perguntar algo que não está nos dados, informe que não tem acesso a essa informação específica.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: question,
      config: {
        systemInstruction: systemInstruction,
      }
    });
    return response.text || "Desculpe, não consegui processar essa informação.";
  } catch (error) {
    console.error("Erro no chat Fleet AI:", error);
    return "Ocorreu um erro ao consultar a inteligência artificial. O volume de dados pode estar muito alto.";
  }
};
