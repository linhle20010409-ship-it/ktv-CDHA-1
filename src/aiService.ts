import { GoogleGenerativeAI } from "@google/generative-ai";
import * as pdfjs from 'pdfjs-dist';

// Cấu hình Worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// --- QUAN TRỌNG: API KEY ĐÃ ĐƯỢC ĐIỀN TRỰC TIẾP ---
const API_KEY = "AIzaSyBv74n5_pxbHxbU6ayPdxk2zOsYhDSq40Y"; 
const genAI = new GoogleGenerativeAI(API_KEY);

const fileToGenerativePart = async (file: File) => {
  const base64Promise = new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return { inlineData: { data: await base64Promise as string, mimeType: file.type } };
};

export const readPDF = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let text = "";
    const maxPages = Math.min(pdf.numPages, 15); 
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item: any) => item.str).join(" ") + "\n";
    }
    return text;
  } catch (err) {
    console.error("Lỗi đọc PDF:", err);
    return "";
  }
};

export const generateQuiz = async (file: File, text: string) => {
  // Kiểm tra key trước khi chạy để tránh lỗi "API Key must be set"
  if (!API_KEY) {
    alert("Chưa có API Key! Vui lòng kiểm tra lại code.");
    return null;
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const isScan = text.trim().length < 100;
  const truncatedText = text.length > 25000 ? text.substring(0, 25000) : text;

  let parts: any[] = isScan 
    ? ["Đây là tài liệu y khoa dạng ảnh. Hãy soạn 50 câu trắc nghiệm. Trả về JSON mảng: [{\"question\":\"...\",\"options\":[\"A\",\"B\",\"C\",\"D\"],\"correctAnswer\":0}]", await fileToGenerativePart(file)]
    : [`Dựa vào văn bản y khoa: ${truncatedText}. Hãy soạn 50 câu trắc nghiệm. Trả về JSON mảng: [{\"question\":\"...\",\"options\":[\"A\",\"B\",\"C\",\"D\"],\"correctAnswer\":0}]`];

  try {
    const result = await model.generateContent(parts);
    const responseText = result.response.text();
    const cleanJson = responseText.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("AI Error:", error);
    alert("Lỗi từ AI: " + error);
    return null;
  }
};
