import { GoogleGenerativeAI } from "@google/generative-ai";
import * as pdfjs from 'pdfjs-dist';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const genAI = new GoogleGenerativeAI("AIzaSyD-XGxySXdw-ZpN692u_qjjY3mFtWB1Jzo");

const fileToGenerativePart = async (file: File) => {
  const base64Promise = new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return { inlineData: { data: await base64Promise as string, mimeType: file.type } };
};

export const readPDF = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  let text = "";
  const maxPages = Math.min(pdf.numPages, 20); // Giới hạn 20 trang để tránh treo
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item: any) => item.str).join(" ") + "\n";
  }
  return text;
};

export const generateQuiz = async (file: File, text: string) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const isScan = text.trim().length < 100;
  const truncatedText = text.length > 30000 ? text.substring(0, 30000) : text;

  let parts: any[] = isScan 
    ? ["Đây là PDF scan. Hãy đọc ảnh và soạn 50 câu trắc nghiệm. Trả về JSON: [{\"question\":\"...\",\"options\":[\"A\",\"B\",\"C\",\"D\"],\"correctAnswer\":0}]", await fileToGenerativePart(file)]
    : [`Dựa vào: ${truncatedText}. Soạn 50 câu trắc nghiệm. Trả về JSON: [{\"question\":\"...\",\"options\":[\"A\",\"B\",\"C\",\"D\"],\"correctAnswer\":0}]`];

  const result = await model.generateContent(parts);
  return JSON.parse(result.response.text().replace(/```json|```/g, "").trim());
};
