import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, addDoc, query, where, 
  limit, getDocs, writeBatch, doc, serverTimestamp 
} from "firebase/firestore";

// Cấu hình từ Project Settings của dự án xq-ct-mri
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

// Hàm Xóa cũ và Lưu 50 câu hỏi mới
export const refreshQuestions = async (questions: any[]) => {
  const batch = writeBatch(db);
  const oldDocs = await getDocs(collection(db, "Questions"));
  oldDocs.forEach((d) => batch.delete(d.ref));

  questions.forEach((q) => {
    const newDocRef = doc(collection(db, "Questions"));
    batch.set(newDocRef, {
      ...q,
      used: false,
      dateUsed: null,
      createdAt: serverTimestamp()
    });
  });
  await batch.commit();
};

// Hàm lấy 10 câu hỏi theo ngày (không trùng)
export const getDailyQuestions = async () => {
  const today = new Date().toISOString().split('T')[0];
  const qToday = query(collection(db, "Questions"), where("dateUsed", "==", today));
  const snapToday = await getDocs(qToday);

  if (!snapToday.empty) return snapToday.docs.map(d => ({ id: d.id, ...d.data() }));

  const qNew = query(collection(db, "Questions"), where("used", "==", false), limit(10));
  const snapNew = await getDocs(qNew);
  const batch = writeBatch(db);
  const questions = snapNew.docs.map(d => {
    batch.update(d.ref, { used: true, dateUsed: today });
    return { id: d.id, ...d.data() };
  });
  await batch.commit();
  return questions;
};

// Hàm lưu điểm số người chơi
export const saveGameScore = async (name: string, score: number) => {
  await addDoc(collection(db, "leaderboard"), {
    userName: name,
    score: score,
    timestamp: serverTimestamp()
  });
};

export const getLeaderboard = async () => {
  const q = query(collection(db, "leaderboard"), limit(10));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
};
