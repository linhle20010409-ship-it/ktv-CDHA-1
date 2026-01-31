import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyD-XGxySXdw-ZpN692u_qjjY3mFtWB1Jzo");

export const generateQuestionsFromDoc = async (text: string) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `Dựa vào tài liệu sau: ${text}. 
  Hãy soạn đúng 50 câu hỏi trắc nghiệm kiến thức không trùng lặp.
  Trả về duy nhất định dạng JSON mảng các đối tượng: 
  [{"question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": 0}]`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const cleanJson = response.text().replace(/```json|```/g, "");
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("AI lỗi:", error);
    return [];
  }
};
