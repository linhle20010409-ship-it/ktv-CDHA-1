import { GoogleGenerativeAI } from "@google/generative-ai";
import * as pdfjs from 'pdfjs-dist';

// Cấu hình Worker cho PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const genAI = new GoogleGenerativeAI("AIzaSyD-XGxySXdw-ZpN692u_qjjY3mFtWB1Jzo");

export const readPDFDocument = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    fullText += textContent.items.map((item: any) => item.str).join(" ") + "\n";
  }
  return fullText;
};

export const generateQuestionsFromDoc = async (text: string) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `Dựa vào tài liệu này: ${text}. Hãy soạn đúng 50 câu hỏi trắc nghiệm kiến thức. Trả về DUY NHẤT định dạng JSON mảng: [{"question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": 0}]`;

  try {
    const result = await model.generateContent(prompt);
    const textRes = result.response.text().replace(/```json|```/g, "");
    return JSON.parse(textRes);
  } catch (error) {
    console.error("AI Error:", error);
    return [];
  }
};
