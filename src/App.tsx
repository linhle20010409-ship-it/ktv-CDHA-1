import React, { useState, useEffect } from 'react';
import { 
  getDailyQuestions, 
  saveGameScore, 
  getLeaderboard, 
  refreshQuestions 
} from './firebase';
import { readPDF, generateQuiz } from './aiService';
import { Trophy, Upload, PlayCircle, Loader2, ChevronRight, AlertCircle } from 'lucide-react';

function App() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [userName, setUserName] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const q = await getDailyQuestions();
      setQuestions(q);
      const lb = await getLeaderboard();
      setLeaderboard(lb);
    } catch (err) {
      console.error("Lỗi tải dữ liệu:", err);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
        alert("File quá lớn (>15MB). Vui lòng nén nhỏ lại.");
        return;
    }

    setIsLoading(true);
    setStatusMsg("Đang đọc dữ liệu từ PDF...");
    
    try {
      const text = await readPDF(file);
      setStatusMsg("AI đang soạn 50 câu hỏi (Có thể mất 30s)...");
      
      const aiQuestions = await generateQuiz(file, text); 
      
      if (aiQuestions && aiQuestions.length > 0) {
        setStatusMsg("Đang lưu vào hệ thống...");
        await refreshQuestions(aiQuestions);
        alert("Thành công! Đã cập nhật bộ câu hỏi mới.");
        window.location.reload();
      } else {
        alert("AI không trả về kết quả. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error(error);
      alert("Lỗi xử lý: " + error);
    } finally {
      setIsLoading(false);
      setStatusMsg("");
    }
  };

  const handleAnswer = async (selectedIdx: number) => {
    if (selectedIdx === questions[currentIdx].correctAnswer) {
        setScore(score + 1);
    }
    if (currentIdx + 1 < questions.length) {
        setCurrentIdx(currentIdx + 1);
    } else {
        setIsGameOver(true);
    }
  };

  const submitScore = async () => {
    if (!userName.trim()) return alert("Hãy nhập tên!");
    await saveGameScore(userName, score);
    alert("Đã lưu điểm!");
    loadData();
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6 text-center">
      <Loader2 className="w-16 h-16 animate-spin text-blue-600 mb-4" />
      <h2 className="text-xl font-bold text-slate-800">{statusMsg}</h2>
      <p className="text-slate-400 mt-2 italic">Vui lòng không tắt trình duyệt...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <div className="max-w-3xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-blue-600 tracking-tight">
              KTV-CDHA Quiz (FINAL FIX)
            </h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Hệ thống ôn luyện AI</p>
          </div>
          <button 
            onClick={() => setShowAdmin(!showAdmin)}
            className="p-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white transition-all shadow-inner"
          >
            <Upload size={20} />
          </button>
        </div>

        {/* Admin Panel */}
        {showAdmin && (
          <div className="mb-8 p-6 bg-white border-2 border-dashed border-blue-200 rounded-2xl">
            <h3 className="text-blue-700 font-bold mb-4 flex items-center">
                <AlertCircle size={18} className="mr-2"/> Admin: Nạp đề thi PDF
            </h3>
            <input 
                type="file" 
                accept=".pdf" 
                onChange={handleUpload} 
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-blue-600 file:text-white file:border-0 hover:file:bg-blue-700 cursor-pointer" 
            />
            <p className="mt-2 text-xs text-slate-400">* Hỗ trợ file PDF văn bản và file Scan (ảnh).</p>
          </div>
        )}

        {/* Game UI */}
        {!isGameOver ? (
          questions.length > 0 ? (
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-slate-100">
              <div className="mb-8 flex justify-between items-center">
                <span className="text-xs font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full uppercase">
                    Câu {currentIdx + 1} / {questions.length}
                </span>
                <span className="text-sm font-bold text-slate-400 italic">Score: {score}</span>
              </div>
              <h2 className="text-2xl font-bold mb-10 leading-snug">{questions[currentIdx].question}</h2>
              <div className="grid gap-4">
                {questions[currentIdx].options.map((opt: string, i: number) => (
                  <button key={i} onClick={() => handleAnswer(i)} className="w-full text-left p-5 rounded-2xl border-2 border-slate-50 hover:border-blue-500 hover:bg-blue-50 font-semibold transition-all flex items-center group">
                    <span className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mr-4 text-slate-500 group-hover:bg-blue-500 group-hover:text-white font-bold transition-colors">{String.fromCharCode(65+i)}</span>
                    <span className="flex-1">{opt}</span>
                    <ChevronRight className="opacity-0 group-hover:opacity-100 text-blue-500 transition-all"/>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border shadow-sm">
              <PlayCircle size={60} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-500 font-medium">Chưa có dữ liệu. Admin vui lòng upload tài liệu.</p>
            </div>
          )
        ) : (
          <div className="bg-white p-10 rounded-3xl shadow-xl text-center border border-slate-100 animate-in zoom-in duration-300">
            <Trophy size={80} className="text-yellow-400 mx-auto mb-6" />
            <h2 className="text-4xl font-black mb-2 text-slate-800">Hoàn thành!</h2>
            <p className="text-slate-500 mb-8">Điểm số của bạn:</p>
            <div className="text-6xl font-black text-blue-600 mb-10">{score} <span className="text-2xl text-slate-300">/ {questions.length}</span></div>
            
            <input type="text" placeholder="Nhập tên để lưu bảng vàng..." className="w-full p-4 border rounded-xl mb-4 text-center font-bold text-lg" onChange={(e)=>setUserName(e.target.value)} />
            <button onClick={submitScore} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all">LƯU KẾT QUẢ</button>
            
            <div className="mt-10 border-t pt-8">
              <h3 className="font-bold mb-4 uppercase text-slate-400 tracking-widest flex justify-center items-center"><Trophy size={16} className="mr-2"/> Top Xếp Hạng</h3>
              {leaderboard.map((item: any, i: number) => (
                <div key={i} className="flex justify-between py-3 border-b border-slate-50 last:border-0">
                  <span className="font-bold text-slate-400">#{i+1} {item.userName}</span>
                  <span className="font-black text-blue-600">{item.score}đ</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default App;
