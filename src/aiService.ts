import { GoogleGenerativeAI } from "@google/generative-ai";
import * as pdfjs from 'pdfjs-dist';

// Thiết lập worker từ CDN để tránh lỗi nạp thư viện
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// KHẮC PHỤC TRIỆT ĐỂ: Khai báo Key trực tiếp
const API_KEY = "AIzaSyD-XGxySXdw-ZpN692u_qjjY3mFtWB1Jzo"; 
const genAI = new GoogleGenerativeAI(API_KEY);

export const readPDF = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let text = "";
    // Giới hạn 15 trang để không làm treo trình duyệt
    const maxPages = Math.min(pdf.numPages, 15); 
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item: any) => item.str).join(" ") + "\n";
    }
    return text;
  } catch (err) {
    console.error("Lỗi đọc PDF:", err);
    throw new Error("Không thể đọc nội dung file PDF này.");
  }
};

export const generateQuiz = async (file: File, text: string) => {
  // Khởi tạo model cụ thể
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const isScan = text.trim().length < 100;
  const truncatedText = text.length > 25000 ? text.substring(0, 25000) : text;

  let parts: any[] = isScan 
    ? [
        "Đây là ảnh tài liệu. Hãy soạn 50 câu trắc nghiệm y khoa. Trả về JSON mảng: [{\"question\":\"...\",\"options\":[\"A\",\"B\",\"C\",\"D\"],\"correctAnswer\":0}]", 
        { inlineData: { data: await fileToBase64(file), mimeType: file.type } }
      ]
    : [
        `Dựa vào: ${truncatedText}. Soạn 50 câu trắc nghiệm. Trả về JSON mảng: [{\"question\":\"...\",\"options\":[\"A\",\"B\",\"C\",\"D\"],\"correctAnswer\":0}]`
      ];

  try {
    const result = await model.generateContent(parts);
    const responseText = result.response.text();
    // Làm sạch JSON để tránh lỗi Parse
    const cleanJson = responseText.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw error;
  }
};

// Hàm bổ trợ chuyển file sang Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });
};
