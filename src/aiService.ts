import { GoogleGenerativeAI } from "@google/generative-ai";
import * as pdfjs from 'pdfjs-dist';

// Cấu hình Worker cho PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const genAI = new GoogleGenerativeAI("AIzaSyD-XGxySXdw-ZpN692u_qjjY3mFtWB1Jzo");

// Hàm chuyển đổi file sang Base64 để AI có thể "nhìn" hình ảnh
const fileToGenerativePart = async (file: File) => {
  const base64Promise = new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64Promise as string, mimeType: file.type },
  };
};

export const readPDF = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item: any) => item.str).join(" ") + "\n";
  }
  return text;
};

export const generateQuiz = async (file: File, text: string) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  // Nếu text trích xuất được quá ít, chúng ta gửi cả file (hình ảnh) cho AI đọc
  const isImagePdf = text.trim().length < 100;
  let promptConfig: any[];

  if (isImagePdf) {
    console.log("Phát hiện PDF dạng ảnh, đang gửi dữ liệu hình ảnh cho AI...");
    const imagePart = await fileToGenerativePart(file);
    promptConfig = [
      "Đây là tài liệu PDF dạng hình ảnh. Hãy đọc nội dung trong ảnh và soạn 50 câu hỏi trắc nghiệm y khoa. Trả về JSON mảng: [{\"question\": \"...\", \"options\": [\"A\", \"B\", \"C\", \"D\"], \"correctAnswer\": 0}]",
      imagePart
    ];
  } else {
    promptConfig = [
      `Dựa vào tài liệu: ${text}. Soạn 50 câu hỏi trắc nghiệm y khoa. Trả về JSON mảng: [{\"question\": \"...\", \"options\": [\"A\", \"B\", \"C\", \"D\"], \"correctAnswer\": 0}]`
    ];
  }

  try {
    const result = await model.generateContent(promptConfig);
    const responseText = result.response.text();
    const cleanJson = responseText.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("AI Error:", error);
    return null;
  }
};
