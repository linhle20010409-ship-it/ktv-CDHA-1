import React, { useState, useEffect } from 'react';
import { readPDFDocument, generateQuestionsFromDoc } from './aiService';
import { refreshQuestions, getDailyQuestions, saveGameScore, getLeaderboard } from './firebase';

function App() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    getDailyQuestions().then(setQuestions);
    getLeaderboard().then(setLeaderboard);
  }, []);

  const handleUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsLoading(true);
    const text = await readPDFDocument(file);
    const aiQ = await generateQuestionsFromDoc(text);
    if (aiQ.length > 0) {
      await refreshQuestions(aiQ);
      alert("Đã nạp 50 câu mới!");
      window.location.reload();
    }
    setIsLoading(false);
  };

  const nextQuestion = (idx: number) => {
    if (idx === questions[currentIdx].correctAnswer) setScore(score + 1);
    if (currentIdx + 1 < questions.length) setCurrentIdx(currentIdx + 1);
    else setIsGameOver(true);
  };

  if (isLoading) return <div className="p-10 text-center">AI đang soạn bài...</div>;

  return (
    <div className="max-w-xl mx-auto p-5">
      <div className="border-b pb-4 mb-4">
        <p className="text-xs text-gray-500">Admin: Cập nhật PDF</p>
        <input type="file" accept=".pdf" onChange={handleUpload} />
      </div>

      {!isGameOver && questions.length > 0 ? (
        <div>
          <h2 className="text-xl font-bold mb-4">{questions[currentIdx].question}</h2>
          <div className="grid gap-2">
            {questions[currentIdx].options.map((opt: any, i: number) => (
              <button key={i} onClick={() => nextQuestion(i)} className="p-3 bg-blue-500 text-white rounded">{opt}</button>
            ))}
          </div>
        </div>
      ) : isGameOver && (
        <div className="text-center">
          <p className="text-2xl">Điểm: {score}/10</p>
          <button onClick={() => window.location.reload()} className="mt-4 p-2 bg-green-500 text-white rounded">Chơi lại</button>
        </div>
      )}
    </div>
  );
}
export default App;
