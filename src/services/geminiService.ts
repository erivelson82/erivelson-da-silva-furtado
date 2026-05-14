import { GoogleGenAI } from "@google/genai";
import { Transaction, PendingAccount, BudgetLimit, CreditCard } from '../types';

let aiInstance: GoogleGenAI | null = null;

const getAIInstance = () => {
  if (!aiInstance) {
    const apiKey = (typeof process !== 'undefined' && process && process.env) ? (process.env as any).GEMINI_API_KEY : null;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY environment variable is missing.");
      return null;
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

export const geminiService = {
  getAssistantResponse: async (
    message: string, 
    context: {
      transactions: Transaction[];
      pending: PendingAccount[];
      budgets: BudgetLimit[];
      cards: CreditCard[];
    }
  ) => {
    try {
      const ai = getAIInstance();
      if (!ai) {
        return "O assistente de IA está desativado pois a chave de API (GEMINI_API_KEY) não foi configurada.";
      }
      const systemInstruction = `
        Você é o FinançaPro AI, um assistente financeiro pessoal inteligente e amigável.
        Seu objetivo é ajudar o usuário a gerenciar suas finanças, analisar gastos e economizar dinheiro.

        Dados atuais do usuário:
        - Transações: ${JSON.stringify(context.transactions)}
        - Contas Pendentes: ${JSON.stringify(context.pending)}
        - Orçamentos: ${JSON.stringify(context.budgets)}
        - Cartões de Crédito: ${JSON.stringify(context.cards)}

        Diretrizes:
        1. Seja conciso e direto.
        2. Dê dicas práticas baseadas nos dados fornecidos.
        3. Identifique padrões de gastos (ex: "Você gastou muito em alimentação este mês").
        4. Alerte sobre contas vencendo ou orçamentos estourados.
        5. Use um tom encorajador e profissional.
        6. Responda sempre em Português do Brasil.
        7. Não invente dados. Se não houver dados suficientes, peça ao usuário para cadastrar mais informações.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: message,
        config: {
          systemInstruction,
        },
      });

      return response.text;
    } catch (error) {
      console.error("AI Assistant Error:", error);
      return "Desculpe, tive um problema ao analisar seus dados. Tente novamente em instantes.";
    }
  }
};
