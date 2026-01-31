import React, { useState, useEffect } from 'react';
import { getDailyQuestions, saveGameScore, getLeaderboard, refreshQuestions } from './firebase';
import { readPDF, generateQuiz } from './aiService';
import { Trophy, Upload, PlayCircle, Loader2, ChevronRight } from 'lucide-react';

function App() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [userName, setUserName] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const q = await getDailyQuestions(); setQuestions(q);
    const lb = await getLeaderboard(); setLeaderboard(lb);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true); setMsg("Đang đọc PDF (Giới hạn 20 trang đầu)...");
    try {
      const text = await readPDF(file);
      setMsg("AI đang soạn 50 câu hỏi...");
      const aiQ = await generateQuiz(file, text);
      await refreshQuestions(aiQ);
      alert("Thành công!"); window.location.reload();
    } catch (err) { alert("Lỗi xử lý file!"); }
    setIsLoading(false);
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
      <p className="font-bold text-slate-700">{msg}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border">
          <h1 className="text-2xl font-black text-blue-600 tracking-tight">
  KTV-CDHA Quiz (BẢN MỚI V1)
</h1>>
          <button onClick={() => setShowAdmin(!showAdmin)} className="p-2 bg-slate-100 rounded-lg"><Upload size={18} /></button>
        </div>

        {showAdmin && (
          <div className="mb-6 p-6 bg-white border-2 border-dashed border-blue-200 rounded-xl">
            <input type="file" accept=".pdf" onChange={handleUpload} className="text-sm" />
          </div>
        )}

        {!isGameOver ? (
          questions.length > 0 ? (
            <div className="bg-white p-8 rounded-2xl shadow-lg border">
              <div className="flex justify-between mb-6"><span className="text-xs font-bold text-blue-500">CÂU {currentIdx + 1}/10</span></div>
              <h2 className="text-xl font-bold mb-8">{questions[currentIdx].question}</h2>
              <div className="grid gap-3">
                {questions[currentIdx].options.map((opt: any, i: number) => (
                  <button key={i} onClick={() => {
                    if (i === questions[currentIdx].correctAnswer) setScore(score + 1);
                    if (currentIdx + 1 < questions.length) setCurrentIdx(currentIdx + 1);
                    else setIsGameOver(true);
                  }} className="w-full text-left p-4 rounded-xl border hover:bg-blue-50 transition-all flex items-center">
                    <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mr-3 font-bold">{String.fromCharCode(65+i)}</span>{opt}
                  </button>
                ))}
              </div>
            </div>
          ) : <div className="text-center py-10">Chưa có dữ liệu PDF.</div>
        ) : (
          <div className="bg-white p-10 rounded-2xl shadow-xl text-center">
            <Trophy size={60} className="text-yellow-400 mx-auto mb-4" />
            <h2 className="text-3xl font-black mb-6">{score} / 10</h2>
            <input type="text" placeholder="Tên bạn..." className="w-full p-3 border rounded-lg mb-4 text-center" onChange={e=>setUserName(e.target.value)} />
            <button onClick={async () => { await saveGameScore(userName, score); alert("Đã lưu!"); loadData(); }} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">LƯU ĐIỂM</button>
          </div>
        )}
      </div>
    </div>
  );
}
export default App;
