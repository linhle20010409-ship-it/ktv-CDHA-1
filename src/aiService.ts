import { GoogleGenerativeAI } from "@google/generative-ai";
import * as pdfjs from 'pdfjs-dist';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const genAI = new GoogleGenerativeAI("AIzaSyD-XGxySXdw-ZpN692u_qjjY3mFtWB1Jzo");

export const readPDF = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item: any) => (item as any).str).join(" ") + "\n";
  }
  return text;
};

export const generateQuiz = async (text: string) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `Dựa vào tài liệu: ${text}. Soạn 50 câu hỏi trắc nghiệm kiến thức. Trả về JSON array: [{"question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": 0}]`;
  const result = await model.generateContent(prompt);
  const response = result.response.text().replace(/```json|```/g, "");
  return JSON.parse(response);
};
