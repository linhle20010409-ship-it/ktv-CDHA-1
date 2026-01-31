import React, { useState, useEffect } from 'react';
import { readDocument, generateQuestionsFromDoc } from './aiService';
import { refreshQuestions, getDailyQuestions, saveGameScore, getLeaderboard } from './firebase';

function App() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [userName, setUserName] = useState('');
  const [isGameOver, setIsGameOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // 1. Tải 10 câu hỏi của ngày hôm nay khi mở App
  useEffect(() => {
    loadDailyQuiz();
    loadLeaderboardData();
  }, []);

  const loadDailyQuiz = async () => {
    setIsLoading(true);
    const dailyData = await getDailyQuestions();
    setQuestions(dailyData);
    setIsLoading(false);
  };

  const loadLeaderboardData = async () => {
    const data = await getLeaderboard();
    setLeaderboard(data);
  };

  // 2. Xử lý Upload tài liệu (Dành cho Admin)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const text = await readDocument(file);
      const aiQuestions = await generateQuestionsFromDoc(text);
      if (aiQuestions.length > 0) {
        await refreshQuestions(aiQuestions);
        alert("Đã cập nhật 50 câu hỏi mới từ AI thành công!");
        loadDailyQuiz(); // Tải lại 10 câu mới nhất
      }
    } catch (error) {
      alert("Lỗi khi xử lý tài liệu!");
    }
    setIsLoading(false);
  };

  // 3. Xử lý trả lời câu hỏi
  const handleAnswer = (selectedIndex: number) => {
    if (selectedIndex === questions[currentQuestionIndex].correctAnswer) {
      setScore(score + 1);
    }

    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < questions.length) {
      setCurrentQuestionIndex(nextIndex);
    } else {
      setIsGameOver(true);
    }
  };

  // 4. Lưu kết quả chơi
  const handleSaveResult = async () => {
    if (!userName) return alert("Vui lòng nhập tên!");
    await saveGameScore(userName, score);
    alert("Đã lưu điểm thành công!");
    loadLeaderboardData();
  };

  if (isLoading) return <div className="p-10 text-center">Đang xử lý dữ liệu AI...</div>;

  return (
    <div className="max-w-2xl mx-auto p-5 font-sans">
      <h1 className="text-2xl font-bold text-center mb-5">AI Quiz Challenge</h1>

      {/* Phần Admin: Chỉ hiện khi cần upload tài liệu */}
      <div className="mb-10 p-4 border-2 border-dashed border-gray-300 rounded">
        <p className="text-sm font-semibold mb-2">Admin: Cập nhật 50 câu hỏi mới từ tài liệu</p>
        <input type="file" accept=".txt,.pdf" onChange={handleFileUpload} />
      </div>

      <hr className="my-10" />

      {/* Giao diện chơi Game */}
      {!isGameOver ? (
        questions.length > 0 ? (
          <div>
            <p className="mb-2">Câu hỏi {currentQuestionIndex + 1}/10</p>
            <h2 className="text-xl mb-4 font-semibold">{questions[currentQuestionIndex].question}</h2>
            <div className="grid gap-3">
              {questions[currentQuestionIndex].options.map((option: string, idx: number) => (
                <button 
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  className="p-3 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-center">Hôm nay chưa có câu hỏi nào được nạp.</p>
        )
      ) : (
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Hoàn thành!</h2>
          <p className="text-xl mb-4">Điểm của bạn: {score}/10</p>
          <input 
            type="text" 
            placeholder="Nhập tên của bạn" 
            className="border p-2 mr-2"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
          <button onClick={handleSaveResult} className="bg-green-500 text-white p-2 rounded">Lưu điểm</button>
        </div>
      )}

      {/* Bảng xếp hạng */}
      <div className="mt-10">
        <h3 className="text-lg font-bold mb-2">Bảng Xếp Hạng Top 10</h3>
        <ul className="border rounded">
          {leaderboard.map((item, index) => (
            <li key={index} className="p-2 border-b last:border-0 flex justify-between">
              <span>{index + 1}. {item.userName}</span>
              <span className="font-bold text-blue-600">{item.score} điểm</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
