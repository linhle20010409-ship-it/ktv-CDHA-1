import { GoogleGenerativeAI } from "@google/generative-ai";
import * as pdfjs from 'pdfjs-dist';

// Thiết lập worker cho PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// Khai báo API Key rõ ràng
const API_KEY = "AIzaSyD-XGxySXdw-ZpN692u_qjjY3mFtWB1Jzo"; 
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
    const maxPages = Math.min(pdf.numPages, 15); // Giảm xuống 15 trang để an toàn hơn cho bộ nhớ
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
  // Khởi tạo model bên trong hàm để đảm bảo nạp Key
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const isScan = text.trim().length < 100;
  const truncatedText = text.length > 25000 ? text.substring(0, 25000) : text;

  let parts: any[] = isScan 
    ? [
        "Đây là hình ảnh tài liệu y khoa. Hãy đọc kỹ nội dung và soạn đúng 50 câu hỏi trắc nghiệm kiến thức. Trả về DUY NHẤT mã JSON theo định dạng mảng: [{\"question\":\"...\",\"options\":[\"A\",\"B\",\"C\",\"D\"],\"correctAnswer\":0}]. Không kèm văn bản giải thích.", 
        await fileToGenerativePart(file)
      ]
    : [
        `Dựa vào nội dung y khoa sau: ${truncatedText}. Hãy soạn 50 câu hỏi trắc nghiệm. Trả về DUY NHẤT mã JSON định dạng mảng: [{\"question\":\"...\",\"options\":[\"A\",\"B\",\"C\",\"D\"],\"correctAnswer\":0}]`
      ];

  try {
    const result = await model.generateContent(parts);
    const response = await result.response;
    const responseText = response.text();
    
    // Làm sạch chuỗi JSON từ AI
    const cleanJson = responseText.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw new Error("Không thể kết nối với AI hoặc API Key hết hạn."); // Ném lỗi để App.tsx bắt được
  }
};
