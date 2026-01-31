import React, { useState, useEffect } from 'react';
import { 
  getDailyQuestions, 
  saveGameScore, 
  getLeaderboard, 
  refreshQuestions 
} from './firebase';
import { readPDF, generateQuiz } from './aiService';
import { Trophy, Upload, PlayCircle, Loader2, CheckCircle2, XCircle } from 'lucide-react';

function App() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [userName, setUserName] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);

  // Nạp câu hỏi và bảng xếp hạng khi mở trang
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    const q = await getDailyQuestions();
    setQuestions(q);
    const lb = await getLeaderboard(); // Sử dụng đúng tên hàm có chữ L hoa
    setLeaderboard(lb);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const text = await readPDF(file);
      const aiQuestions = await generateQuiz(text);
      if (aiQuestions && aiQuestions.length > 0) {
        await refreshQuestions(aiQuestions);
        alert("Đã cập nhật 50 câu hỏi mới thành công!");
        window.location.reload();
      }
    } catch (error) {
      console.error(error);
      alert("Có lỗi khi xử lý file!");
    }
    setIsLoading(false);
  };

  const handleAnswer = async (selectedIdx: number) => {
    if (selectedIdx === questions[currentIdx].correctAnswer) {
      setScore(score + 1);
    }

    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setIsGameOver(true);
      if (userName) await saveGameScore(userName, score);
    }
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
      <p className="text-lg font-medium">AI đang soạn 50 câu hỏi từ tài liệu...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header Admin - Nút Upload */}
        <div className="mb-8 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <h1 className="text-xl font-bold text-slate-800">KTV-CDHA Quiz</h1>
          <button 
            onClick={() => setShowAdmin(!showAdmin)}
            className="text-slate-500 hover:text-blue-600 p-2"
          >
            <Upload className="w-5 h-5" />
          </button>
        </div>

        {showAdmin && (
          <div className="mb-8 p-6 bg-blue-50 border-2 border-dashed border-blue-200 rounded-xl">
            <p className="text-sm font-bold text-blue-800 mb-2 uppercase">Khu vực Admin</p>
            <input 
              type="file" 
              accept=".pdf" 
              onChange={handleUpload}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            />
          </div>
        )}

        {/* Game UI */}
        {!isGameOver ? (
          questions.length > 0 ? (
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <span className="text-sm font-bold text-blue-600 uppercase tracking-wider">
                  Câu hỏi {currentIdx + 1}/{questions.length}
                </span>
                <span className="text-sm font-medium text-slate-400">Điểm: {score}</span>
              </div>
              
              <h2 className="text-2xl font-bold text-slate-800 mb-8 leading-tight">
                {questions[currentIdx].question}
              </h2>

              <div className="grid gap-4">
                {questions[currentIdx].options.map((opt: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    className="w-full text-left p-4 rounded-xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 transition-all font-medium text-slate-700 flex items-center group"
                  >
                    <span className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-blue-500 group-hover:text-white flex items-center justify-center mr-4 transition-colors">
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center p-12 bg-white rounded-2xl shadow-sm">
              <PlayCircle className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500">Chưa có câu hỏi. Admin vui lòng upload PDF tài liệu.</p>
            </div>
          )
        ) : (
          <div className="bg-white p-8 rounded-2xl shadow-xl text-center border border-slate-100">
            <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Hoàn thành!</h2>
            <p className="text-slate-500 mb-8 text-lg">Bạn đạt được <span className="text-blue-600 font-bold">{score}/{questions.length}</span> điểm</p>
            
            <div className="mb-8">
              <input 
                type="text" 
                placeholder="Nhập tên để lưu điểm..." 
                className="p-3 border rounded-lg w-full mb-4 text-center"
                onChange={(e) => setUserName(e.target.value)}
              />
              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
              >
                Chơi lại ngày mai
              </button>
            </div>

            <div className="mt-10 pt-8 border-t border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center justify-center italic">
                <Trophy className="w-5 h-5 mr-2 text-yellow-500" /> Bảng Xếp Hạng Top 10
              </h3>
              <div className="space-y-3">
                {leaderboard.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="font-bold text-slate-400 w-8">#{i + 1}</span>
                    <span className="flex-1 text-left font-medium text-slate-700">{item.userName || "Ẩn danh"}</span>
                    <span className="font-bold text-blue-600">{item.score} điểm</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
