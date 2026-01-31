import { GoogleGenerativeAI } from "@google/generative-ai";

// Sử dụng API Key của bạn
const genAI = new GoogleGenerativeAI("AIzaSyD-XGxySXdw-ZpN692u_qjjY3mFtWB1Jzo");

export const generateQuestionsFromDoc = async (text: string) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `Dựa vào tài liệu: ${text}. Soạn 50 câu hỏi trắc nghiệm không trùng. Trả về JSON mảng: [{"question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": 0}]`;

  try {
    const result = await model.generateContent(prompt);
    const textRes = result.response.text().replace(/```json|```/g, "");
    return JSON.parse(textRes);
  } catch (error) {
    console.error("AI Error:", error);
    return [];
  }
};
