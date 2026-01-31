import React, { useState, useEffect } from 'react';
import { 
  getDailyQuestions, 
  saveGameScore, 
  getLeaderboard, 
  refreshQuestions 
} from './firebase';
import { readPDF, generateQuiz } from './aiService';
import { Trophy, Upload, PlayCircle, Loader2, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';

function App() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [userName, setUserName] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);

  // Khởi tạo dữ liệu khi tải trang
  useEffect(() => {
    const init = async () => {
      const q = await getDailyQuestions();
      setQuestions(q);
      const lb = await getLeaderboard(); // Đã sửa đúng tên hàm
      setLeaderboard(lb);
    };
    init();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("Bắt đầu xử lý file:", file.name);
    setIsLoading(true);
    
    try {
      const text = await readPDF(file);
      console.log("Nội dung PDF trích xuất thành công");
      
      const aiQuestions = await generateQuiz(text);
      console.log("AI đã soạn xong 50 câu hỏi");
      
      if (aiQuestions && aiQuestions.length > 0) {
        await refreshQuestions(aiQuestions);
        alert("Thành công! 50 câu hỏi mới đã được nạp vào hệ thống.");
        window.location.reload();
      } else {
        alert("AI không thể tạo câu hỏi. Hãy kiểm tra lại nội dung PDF.");
      }
    } catch (error) {
      console.error("Lỗi Upload:", error);
      alert("Lỗi: " + error);
    } finally {
      setIsLoading(false);
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
    if (!userName.trim()) return alert("Vui lòng nhập tên!");
    await saveGameScore(userName, score);
    const lb = await getLeaderboard();
    setLeaderboard(lb);
    alert("Đã lưu điểm thành công!");
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <Loader2 className="w-16 h-16 animate-spin text-blue-500 mb-4" />
      <h2 className="text-xl font-bold text-slate-700">AI đang phân tích tài liệu...</h2>
      <p className="text-slate-500">Quá trình soạn 50 câu hỏi có thể mất 30-60 giây</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <div className="max-w-3xl mx-auto px-4 py-8">
        
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-blue-600 tracking-tight">KTV-CDHA Quiz</h1>
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
          <div className="mb-8 p-6 bg-white border-2 border-dashed border-blue-200 rounded-2xl shadow-lg">
            <h3 className="text-blue-700 font-bold mb-4 flex items-center">
              <Upload className="mr-2" size={18} /> Cập nhật kho câu hỏi (PDF)
            </h3>
            <input 
              type="file" 
              accept=".pdf" 
              onChange={handleUpload}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
            />
            <p className="mt-3 text-xs text-slate-400 font-medium italic">* Lưu ý: AI sẽ xóa bộ câu hỏi cũ và soạn mới 50 câu từ tài liệu này.</p>
          </div>
        )}

        {/* Quiz Area */}
        {!isGameOver ? (
          questions.length > 0 ? (
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
              <div className="bg-blue-600 p-1">
                <div className="bg-blue-600 h-1" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}></div>
              </div>
              
              <div className="p-8 md:p-12">
                <div className="flex justify-between items-center mb-10">
                  <span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-bold tracking-wide">
                    CÂU HỎI {currentIdx + 1} / {questions.length}
                  </span>
                  <div className="flex items-center text-slate-400">
                    <Trophy size={16} className="mr-1 text-yellow-500" />
                    <span className="text-sm font-bold">Điểm: {score}</span>
                  </div>
                </div>

                <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-10 leading-snug">
                  {questions[currentIdx].question}
                </h2>

                <div className="grid gap-4">
                  {questions[currentIdx].options.map((option: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => handleAnswer(i)}
                      className="group flex items-center w-full p-5 text-left rounded-2xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 shadow-sm"
                    >
                      <span className="w-10 h-10 flex-shrink-0 rounded-xl bg-slate-100 text-slate-500 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center font-bold mr-4 transition-colors">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="text-lg font-semibold text-slate-700 group-hover:text-blue-900 leading-tight">
                        {option}
                      </span>
                      <ChevronRight className="ml-auto text-slate-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all" size={20} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100">
              <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <PlayCircle size={48} className="text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Chưa có bộ câu hỏi</h3>
              <p className="text-slate-500 max-w-sm mx-auto px-4">Admin cần nhấn vào nút tải lên ở góc phải để nạp tài liệu PDF học tập.</p>
            </div>
          )
        ) : (
          /* Result & Leaderboard Section */
          <div className="space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="bg-white p-10 rounded-3xl shadow-xl text-center border border-slate-100">
              <div className="relative inline-block mb-6">
                <Trophy size={80} className="text-yellow-400 mx-auto" />
                <CheckCircle2 size={32} className="text-green-500 absolute -bottom-2 -right-2 bg-white rounded-full" />
              </div>
              <h2 className="text-4xl font-black text-slate-800 mb-2">Hoàn thành!</h2>
              <p className="text-slate-500 text-lg mb-8">Kết quả hôm nay của bạn:</p>
              
              <div className="text-6xl font-black text-blue-600 mb-10 tracking-tighter">
                {score} <span className="text-2xl text-slate-300">/ {questions.length}</span>
              </div>

              <div className="max-w-sm mx-auto space-y-4">
                <input 
                  type="text" 
                  placeholder="Nhập họ tên của bạn..." 
                  className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 focus:outline-none text-center font-bold text-lg"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                />
                <button 
                  onClick={submitScore}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
                >
                  LƯU ĐIỂM XẾP HẠNG
                </button>
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  QUAY LẠI TRANG CHỦ
                </button>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100">
              <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center italic uppercase tracking-tighter">
                <Trophy size={24} className="mr-2 text-yellow-500" /> Bảng Vàng Thành Tích
              </h3>
              <div className="divide-y divide-slate-50">
                {leaderboard.length > 0 ? leaderboard.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-center py-4 px-2">
                    <div className="flex items-center">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold mr-4 ${
                        i === 0 ? 'bg-yellow-100 text-yellow-700' : 
                        i === 1 ? 'bg-slate-100 text-slate-600' :
                        i === 2 ? 'bg-orange-100 text-orange-700' : 'text-slate-300'
                      }`}>
                        {i + 1}
                      </span>
                      <span className="font-bold text-slate-700">{item.userName || "Người chơi ẩn danh"}</span>
                    </div>
                    <span className="font-black text-blue-600">{item.score} điểm</span>
                  </div>
                )) : (
                  <p className="text-center py-6 text-slate-400 italic font-medium">Chưa có ai ghi danh hôm nay...</p>
                )}
              </div>
            </div>
          </div>
        )}
        
        <p className="text-center mt-12 text-slate-300 text-sm font-bold uppercase tracking-widest">
          © 2026 KTV-CDHA MRI Team
        </p>
      </div>
    </div>
  );
}

export default App;
