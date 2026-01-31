import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp } from "firebase/firestore";

// Cấu hình lấy chính xác từ image_11843e.png của bạn
const firebaseConfig = {
  apiKey: "AIzaSyD-XGxySXdw-ZpN692u_qjjY3mFtWB1Jzo",
  authDomain: "xq-ct-mri.firebaseapp.com",
  projectId: "xq-ct-mri",
  storageBucket: "xq-ct-mri.firebasestorage.app",
  messagingSenderId: "978386756404",
  appId: "1:978386756404:web:2dc045eb850f2836f4fb61",
  measurementId: "G-H8PPVKFCTR"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Hàm lưu điểm số
export const saveGameScore = async (name: string, score: number) => {
  try {
    await addDoc(collection(db, "leaderboard"), {
      userName: name,
      score: score,
      timestamp: serverTimestamp(),
      date: new Date().toLocaleDateString()
    });
    console.log("Ghi điểm thành công!");
  } catch (e) {
    console.error("Lỗi ghi điểm: ", e);
  }
};
