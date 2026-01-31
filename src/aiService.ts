import { GoogleGenerativeAI } from "@google/generative-ai";
import * as pdfjs from 'pdfjs-dist';

// Cấu hình Worker cho thư viện đọc PDF (tránh lỗi thiếu worker)
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// --- CẬP NHẬT API KEY MỚI CỦA BẠN TẠI ĐÂY ---
const API_KEY = "AIzaSyBv74n5_pxbHxbU6ayPdxk2zOsYhDSq40Y"; 
const genAI = new GoogleGenerativeAI(API_KEY);

// Hàm hỗ trợ chuyển file sang Base64 (cho tính năng đọc ảnh/scan)
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
    
    // Giới hạn đọc tối đa 15 trang đầu để tránh làm treo trình duyệt
    const maxPages = Math.min(pdf.numPages, 15); 
    
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      // Nối các dòng chữ lại với nhau
      text += content.items.map((item: any) => item.str).join(" ") + "\n";
    }
    return text;
  } catch (err) {
    console.error("Lỗi đọc PDF:", err);
    // Trả về chuỗi rỗng để hàm generateQuiz tự chuyển sang chế độ đọc ảnh
    return "";
  }
};

export const generateQuiz = async (file: File, text: string) => {
  // Khởi tạo model Gemini 1.5 Flash (nhanh và rẻ)
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  // Logic tự động: Nếu ít chữ (<100 ký tự) thì coi là file Scan và gửi ảnh
  const isScan = text.trim().length < 100;
  
  // Cắt bớt văn bản nếu quá dài (tránh lỗi Request too large)
  const truncatedText = text.length > 25000 ? text.substring(0, 25000) : text;

  let parts: any[] = isScan 
    ? [
        "Đây là tài liệu y khoa dạng ảnh scan. Hãy phân tích kỹ nội dung và soạn 50 câu hỏi trắc nghiệm. Yêu cầu trả về DUY NHẤT một chuỗi JSON thuần túy (không có markdown) theo định dạng mảng: [{\"question\":\"...\",\"options\":[\"A\",\"B\",\"C\",\"D\"],\"correctAnswer\":0}]", 
        await fileToGenerativePart(file)
      ]
    : [
        `Dựa vào văn bản y khoa sau: ${truncatedText}. Hãy soạn 50 câu hỏi trắc nghiệm. Yêu cầu trả về DUY NHẤT một chuỗi JSON thuần túy theo định dạng mảng: [{\"question\":\"...\",\"options\":[\"A\",\"B\",\"C\",\"D\"],\"correctAnswer\":0}]`
      ];

  try {
    const result = await model.generateContent(parts);
    const response = result.response;
    const responseText = response.text();
    
    // Làm sạch chuỗi kết quả (xóa các ký tự ```json thừa)
    const cleanJson = responseText.replace(/```json|```/g, "").trim();
    
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Lỗi tạo câu hỏi:", error);
    alert("Lỗi kết nối AI: " + error); // Hiển thị lỗi rõ ràng cho người dùng
    return null;
  }
};
