
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, QuizResults, Question, QuizMode, LeaderboardEntry } from './types';
import { MOCK_QUESTIONS, MOCK_LEADERBOARD_TODAY } from './data/mockData';
import QuizCard from './components/QuizCard';
import Timer from './components/Timer';
import Leaderboard from './components/Leaderboard';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Trophy, RotateCcw, LayoutDashboard, Target, Star, 
  FileText, Loader2, Send, Upload, X, Stethoscope, 
  Activity, Microscope, Dna, ShieldCheck, Heart, Zap, Settings, Monitor, Scan, Clock, BookOpen, GraduationCap, User, ChevronRight, Info, AlertTriangle
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.10.38/build/pdf.worker.mjs`;

const BASE_POINTS = 50;
const MAX_TIME_BONUS = 50;
const CHALLENGE_TIME = 20; 
const TRAINING_TIME = 60; 
const LOCAL_STORAGE_KEY = 'radrush_leaderboard_v1';
const HISTORY_STORAGE_KEY = 'radrush_challenge_history_v1';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.DASHBOARD);
  const [quizMode, setQuizMode] = useState<QuizMode>(QuizMode.CHALLENGE);
  const [playerName, setPlayerName] = useState("");
  const [pendingQuestions, setPendingQuestions] = useState<Question[] | undefined>(undefined);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [questions, setQuestions] = useState<Question[]>(MOCK_QUESTIONS);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [results, setResults] = useState<QuizResults>({ totalScore: 0, correctCount: 0, totalQuestions: questions.length });
  const [showExplanation, setShowExplanation] = useState(false);
  const [isTimerActive, setIsTimerActive] = useState(false);
  
  const totalTimeLimit = quizMode === QuizMode.CHALLENGE ? CHALLENGE_TIME : TRAINING_TIME;
  const [timeLeft, setTimeLeft] = useState(totalTimeLimit);
  
  // AI Generation state
  const [documentContent, setDocumentContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load leaderboard from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        setLeaderboard(JSON.parse(saved));
      } catch (e) {
        setLeaderboard(MOCK_LEADERBOARD_TODAY);
      }
    } else {
      setLeaderboard(MOCK_LEADERBOARD_TODAY);
    }
  }, []);

  // Timer logic
  useEffect(() => {
    let interval: number;
    if (isTimerActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 0.05) {
            clearInterval(interval);
            handleTimeUp();
            return 0;
          }
          return prev - 0.05;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timeLeft]);

  const handleTimeUp = useCallback(() => {
    if (selectedOption === null) {
      handleAnswerSelect(-1); 
    }
  }, [selectedOption]);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const initiateQuiz = (mode: QuizMode, customQuestions?: Question[]) => {
    setQuizMode(mode);
    setPendingQuestions(customQuestions);
    setErrorMsg(null);
    setGameState(GameState.NAME_INPUT);
  };

  const startQuiz = () => {
    const name = playerName.trim();
    if (!name) return;

    // Check Daily Limit for Challenge Mode
    if (quizMode === QuizMode.CHALLENGE) {
      const historyStr = localStorage.getItem(HISTORY_STORAGE_KEY);
      const history = historyStr ? JSON.parse(historyStr) : {};
      const today = new Date().toISOString().split('T')[0];
      
      const lastPlayDate = history[name.toLowerCase()];
      if (lastPlayDate === today) {
        setErrorMsg("Bạn đã hoàn thành thử thách hôm nay. Vui lòng quay lại vào ngày mai hoặc chọn chế độ Tập luyện!");
        return;
      }
    }

    setErrorMsg(null);
    // Shuffling to ensure no repeating questions
    const pool = pendingQuestions || MOCK_QUESTIONS;
    const quizQuestions = shuffleArray(pool).slice(0, 10);
    
    setQuestions(quizQuestions);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setResults({ totalScore: 0, correctCount: 0, totalQuestions: quizQuestions.length });
    setShowExplanation(false);
    setGameState(GameState.PLAYING);
    
    const initialTime = quizMode === QuizMode.CHALLENGE ? CHALLENGE_TIME : TRAINING_TIME;
    setTimeLeft(initialTime);
    setIsTimerActive(true);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert("Vui lòng tải lên file định dạng PDF.");
      return;
    }

    setIsParsingPdf(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => (item as any).str).join(" ");
        fullText += pageText + "\n";
      }

      setDocumentContent(fullText);
    } catch (error) {
      console.error("PDF Parsing Error:", error);
      alert("Không thể đọc file PDF này. Vui lòng thử lại.");
    } finally {
      setIsParsingPdf(false);
    }
  };

  const generateAIQuestions = async () => {
    if (!documentContent.trim()) return;
    
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Bạn là chuyên gia đào tạo Kỹ thuật viên Chẩn đoán hình ảnh. Tạo ra ít nhất 15 câu hỏi trắc nghiệm đa dạng về định vị, kV/mAs, an toàn tia X. Các câu hỏi cần súc tích để người thi có thể đọc và trả lời trong vòng 20 giây. Trả lời bằng ngôn ngữ Tiếng Việt chuyên ngành. Đảm bảo cấu trúc JSON. Tài liệu: ${documentContent}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                question: { type: Type.STRING },
                options: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  description: "Mảng chứa chính xác 4 đáp án."
                },
                correctAnswer: { 
                  type: Type.INTEGER,
                  description: "Index của đáp án đúng (0-3)."
                },
                explanation: { type: Type.STRING }
              },
              required: ["id", "question", "options", "correctAnswer", "explanation"]
            }
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from AI");
      
      const generatedData = JSON.parse(text);
      if (Array.isArray(generatedData) && generatedData.length > 0) {
        initiateQuiz(QuizMode.CHALLENGE, generatedData);
      }
    } catch (error) {
      console.error("AI Generation Error:", error);
      alert("Lỗi kết nối AI lâm sàng. Vui lòng thử lại.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswerSelect = (index: number) => {
    if (selectedOption !== null) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = index === currentQuestion.correctAnswer;
    
    const finalTimeLeft = timeLeft;
    setSelectedOption(index);
    setIsTimerActive(false);
    setShowExplanation(true);

    if (isCorrect) {
      const timeRatio = Math.max(0, finalTimeLeft / totalTimeLimit);
      const scoreGain = Math.round(BASE_POINTS + (MAX_TIME_BONUS * timeRatio));
      
      setResults(prev => ({
        ...prev,
        totalScore: prev.totalScore + scoreGain,
        correctCount: prev.correctCount + 1
      }));
    }

    const nextDelay = quizMode === QuizMode.CHALLENGE ? 2500 : 4000;
    setTimeout(() => {
      goToNextQuestion();
    }, nextDelay);
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
      setTimeLeft(totalTimeLimit);
      setIsTimerActive(true);
    } else {
      // End of quiz: Update leaderboard and history
      if (quizMode === QuizMode.CHALLENGE) {
        const normalizedName = playerName.trim().toLowerCase();
        const today = new Date().toISOString().split('T')[0];

        // Save play history
        const historyStr = localStorage.getItem(HISTORY_STORAGE_KEY);
        const history = historyStr ? JSON.parse(historyStr) : {};
        history[normalizedName] = today;
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));

        setLeaderboard(prev => {
          const existingEntryIndex = prev.findIndex(e => e.name.trim().toLowerCase() === normalizedName);
          
          let updated;
          if (existingEntryIndex !== -1) {
            // Player exists: Accumulate points
            updated = [...prev];
            updated[existingEntryIndex] = {
              ...updated[existingEntryIndex],
              score: updated[existingEntryIndex].score + results.totalScore,
              isCurrentUser: true
            };
            // Clear other isCurrentUser flags
            updated = updated.map((e, idx) => idx === existingEntryIndex ? e : {...e, isCurrentUser: false});
          } else {
            // New player: Create entry
            const newEntry: LeaderboardEntry = {
              id: Date.now().toString(),
              name: playerName.trim(),
              score: results.totalScore,
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${playerName.trim()}`,
              isCurrentUser: true
            };
            updated = [...prev.map(e => ({...e, isCurrentUser: false})), newEntry];
          }
          
          // Sort by score desc
          const sorted = updated.sort((a, b) => b.score - a.score);
          // Persistent storage
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sorted));
          return sorted;
        });
      }
      setGameState(GameState.RESULT);
    }
  };

  const renderDashboard = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center text-center max-w-5xl mx-auto py-12 px-6"
    >
      <div className="relative mb-8">
        <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500 rounded-full blur opacity-40 animate-pulse"></div>
        <div className="relative bg-slate-900 p-6 rounded-full">
          <Scan className="w-16 h-16 text-teal-400" />
        </div>
      </div>
      
      <h1 className="text-5xl md:text-7xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-br from-white via-teal-100 to-teal-500 tracking-tight">
        RadRush Tech
      </h1>
      <p className="text-slate-400 text-lg md:text-xl mb-12 max-w-2xl leading-relaxed">
        Phần mềm luyện tập chẩn đoán kỹ thuật dành cho Kỹ thuật viên. <br/> Làm chủ quy trình với thời gian thực tế.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full items-stretch">
        <div className="bg-slate-900/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-red-500/20 flex flex-col shadow-[0_20px_50px_rgba(239,68,68,0.1)] hover:border-red-500/40 transition-all">
          <div className="flex items-center gap-3 mb-6 justify-center">
            <Zap className="text-red-500 w-8 h-8" />
            <h3 className="text-2xl font-bold">Thử thách 20s</h3>
          </div>
          <p className="text-slate-400 text-sm mb-8">Chế độ xếp hạng. 10 câu hỏi, 20 giây cho mỗi ca bệnh. <b>Giới hạn 1 lượt/ngày.</b></p>
          <button 
            onClick={() => initiateQuiz(QuizMode.CHALLENGE)}
            className="mt-auto group relative flex items-center justify-center gap-3 w-full py-5 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold text-xl transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)]"
          >
            Bắt đầu trực
            <Play className="w-6 h-6 fill-current" />
          </button>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-cyan-500/20 flex flex-col shadow-[0_20px_50px_rgba(6,182,212,0.1)] hover:border-cyan-500/40 transition-all">
          <div className="flex items-center gap-3 mb-6 justify-center">
            <BookOpen className="text-cyan-400 w-8 h-8" />
            <h3 className="text-2xl font-bold">Tập luyện</h3>
          </div>
          <p className="text-slate-400 text-sm mb-8">Học tập chuyên sâu. 60 giây mỗi câu. Không giới hạn lượt chơi. Xem giải thích kỹ thuật chi tiết.</p>
          <button 
            onClick={() => initiateQuiz(QuizMode.TRAINING)}
            className="mt-auto group relative flex items-center justify-center gap-3 w-full py-5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl font-bold text-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]"
          >
            Học kỹ thuật
            <GraduationCap className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-800 flex flex-col transition-all hover:border-teal-500/40">
           <div className="flex items-center gap-3 mb-6 justify-center">
            <Settings className="text-teal-400 w-8 h-8" />
            <h3 className="text-2xl font-bold">Protocol AI</h3>
          </div>
          <p className="text-slate-400 text-sm mb-8 text-center">Tạo đề thi tùy chỉnh từ tài liệu <b>PDF</b> kỹ thuật của bệnh viện.</p>
          <button 
            onClick={() => setGameState(GameState.GENERATING)}
            className="mt-auto w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold transition-all border border-slate-700 hover:border-teal-500/50"
          >
            Cấu hình Protocol
          </button>
        </div>
      </div>

      <div className="w-full mt-12 max-w-xl">
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="text-yellow-500 w-5 h-5" /> Top Kỹ Thuật Viên
          </h3>
          <button onClick={() => setGameState(GameState.LEADERBOARD)} className="text-teal-400 text-sm font-bold hover:underline">Xem tất cả</button>
        </div>
        <Leaderboard entries={leaderboard} />
      </div>
    </motion.div>
  );

  const renderNameInput = () => (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[70vh] max-w-md mx-auto px-6"
    >
      <div className="w-full bg-slate-900/80 backdrop-blur-2xl p-8 md:p-10 rounded-[3rem] border border-teal-500/20 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-teal-500/10 flex items-center justify-center mb-4 border border-teal-500/20">
            <User className="w-10 h-10 text-teal-400" />
          </div>
          <h2 className="text-3xl font-black tracking-tight">Kíp trưởng trực</h2>
          <p className="text-slate-400 text-sm mt-1">Vui lòng nhập định danh của bạn</p>
        </div>

        <div className="space-y-6">
          <div className="relative">
            <input 
              type="text"
              autoFocus
              value={playerName}
              onChange={(e) => {
                setPlayerName(e.target.value);
                if(errorMsg) setErrorMsg(null);
              }}
              placeholder="Ví dụ: KTV. Minh Anh"
              className={`w-full bg-slate-800/50 border-2 rounded-2xl px-6 py-5 text-lg font-bold text-white placeholder:text-slate-600 focus:outline-none transition-all ${
                errorMsg ? 'border-red-500 focus:ring-4 focus:ring-red-500/10' : 'border-slate-700 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10'
              }`}
              onKeyDown={(e) => e.key === 'Enter' && startQuiz()}
            />
          </div>

          <AnimatePresence>
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-3"
              >
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                <p className="text-xs text-red-200 leading-relaxed font-bold">
                  {errorMsg}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-teal-500/5 border border-teal-500/10 rounded-xl p-4 flex gap-3">
            <Info className="w-5 h-5 text-teal-400 shrink-0" />
            <p className="text-xs text-slate-400 leading-relaxed">
              Dùng <b>đúng tên cũ</b> để tiếp tục cộng dồn điểm tích lũy. Thử thách xếp hạng chỉ có thể thực hiện 1 lần mỗi ngày.
            </p>
          </div>

          <button 
            onClick={startQuiz}
            disabled={!playerName.trim()}
            className={`flex items-center justify-center gap-2 w-full py-5 rounded-2xl font-black text-xl transition-all ${
              playerName.trim() 
                ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-500/20' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            Tiếp nhận ca trực
            <ChevronRight className="w-6 h-6" />
          </button>

          <button 
            onClick={() => setGameState(GameState.DASHBOARD)}
            className="w-full py-2 text-slate-500 hover:text-slate-300 font-bold text-sm transition-colors"
          >
            Quay lại Dashboard
          </button>
        </div>
      </div>
    </motion.div>
  );

  const renderGenerating = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto py-12 px-6"
    >
      <div className="bg-slate-900/80 backdrop-blur-xl p-8 rounded-[3rem] border border-teal-500/20 shadow-2xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-teal-500/20 rounded-2xl">
            <Monitor className="w-8 h-8 text-teal-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black">AI Protocol Builder</h2>
            <p className="text-slate-400">Trích xuất câu hỏi từ tài liệu kỹ thuật</p>
          </div>
        </div>

        <div className="grid gap-6 mb-8">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`group relative flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-10 transition-all cursor-pointer ${
              isParsingPdf ? 'border-teal-500 bg-teal-500/5' : 'border-slate-700 hover:border-teal-500 hover:bg-teal-500/5'
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="application/pdf" 
              className="hidden" 
            />
            {isParsingPdf ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-12 h-12 text-teal-400 animate-spin mb-4" />
                <p className="text-teal-300 font-bold">Đang phân tích kỹ thuật PDF...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-slate-400 group-hover:text-teal-400" />
                </div>
                <h4 className="text-lg font-bold mb-1">Tải quy trình (PDF)</h4>
                <p className="text-sm text-slate-500 italic">Hỗ trợ tối ưu hóa cho bài thi 20 giây</p>
              </div>
            )}
          </div>

          <div className="relative">
            <textarea 
              value={documentContent}
              onChange={(e) => setDocumentContent(e.target.value)}
              placeholder="Hoặc dán nội dung kỹ thuật tại đây..."
              className="w-full h-48 bg-slate-800/30 border border-slate-700 rounded-2xl p-6 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={() => setGameState(GameState.DASHBOARD)}
            className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold transition-all"
          >
            Hủy bỏ
          </button>
          <button 
            disabled={isGenerating || !documentContent.trim() || isParsingPdf}
            onClick={generateAIQuestions}
            className={`flex-[2] py-4 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
              (isGenerating || !documentContent.trim() || isParsingPdf) ? 'opacity-50 cursor-not-allowed' : 'shadow-lg shadow-teal-500/30'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                AI đang xử lý kịch bản...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Khởi tạo bài kiểm tra
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );

  const renderPlaying = () => {
    const isChallenge = quizMode === QuizMode.CHALLENGE;
    const accentColor = isChallenge ? 'red' : 'cyan';
    
    return (
      <div className="max-w-4xl mx-auto pt-8 pb-20 px-4">
        <div className={`flex items-center justify-between mb-8 bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-${accentColor}-500/20 shadow-xl sticky top-4 z-50`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-${accentColor}-500/10 border border-${accentColor}-500/20`}>
              <User className={`w-5 h-5 text-${accentColor}-400`} />
            </div>
            <div className="flex flex-col">
              <span className={`text-[10px] uppercase tracking-widest text-${accentColor}-500 font-black`}>
                {playerName}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-white">{currentQuestionIndex + 1 < 10 ? `0${currentQuestionIndex + 1}` : currentQuestionIndex + 1}</span>
                <div className="flex gap-1">
                  {questions.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1.5 w-4 rounded-full transition-all duration-500 ${
                        i < currentQuestionIndex ? `bg-${accentColor}-500` : 
                        i === currentQuestionIndex ? `bg-${accentColor}-400 shadow-[0_0_12px_rgba(248,113,113,0.8)] w-6` : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Chỉ số chẩn đoán</span>
            <div className={`text-2xl font-black tabular-nums text-${accentColor}-400`}>
              {results.totalScore}
            </div>
          </div>
        </div>

        <Timer 
          totalTime={totalTimeLimit} 
          timeLeft={timeLeft}
          isActive={isTimerActive} 
          mode={quizMode}
        />

        <AnimatePresence mode="wait">
          <QuizCard 
            key={currentQuestionIndex}
            question={questions[currentQuestionIndex]}
            onSelectOption={handleAnswerSelect}
            selectedOption={selectedOption}
            isCorrect={selectedOption !== null ? selectedOption === questions[currentQuestionIndex].correctAnswer : null}
            showExplanation={showExplanation}
          />
        </AnimatePresence>
      </div>
    );
  };

  const renderResult = () => (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center text-center max-w-lg mx-auto py-16 px-6"
    >
      <div className={`mb-8 p-10 bg-slate-900/60 backdrop-blur-2xl rounded-[3.5rem] border ${quizMode === QuizMode.CHALLENGE ? 'border-red-500/30' : 'border-cyan-500/30'} shadow-2xl w-full`}>
        <div className="mb-6 flex justify-center">
          <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${quizMode === QuizMode.CHALLENGE ? 'from-red-400 to-rose-600' : 'from-cyan-400 to-blue-600'} flex items-center justify-center shadow-lg shadow-teal-500/20`}>
            {quizMode === QuizMode.CHALLENGE ? <Zap className="w-12 h-12 text-white" /> : <GraduationCap className="w-12 h-12 text-white" />}
          </div>
        </div>
        
        <h2 className="text-4xl font-black mb-2 tracking-tight">Ca Trực Hoàn Tất</h2>
        <p className="text-slate-400 mb-8 font-bold text-teal-400">{playerName}</p>
        <p className="text-slate-400 mb-8 -mt-6">Bạn đã xử lý thành công {results.correctCount}/{results.totalQuestions} ca kỹ thuật.</p>
        
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-800/40 p-6 rounded-3xl border border-slate-700">
            <span className={`text-4xl font-black ${quizMode === QuizMode.CHALLENGE ? 'text-red-400' : 'text-cyan-400'} block mb-1`}>{results.totalScore}</span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Điểm kỹ năng mới</span>
          </div>
          <div className="bg-slate-800/40 p-6 rounded-3xl border border-slate-700">
            <span className={`text-4xl font-black text-emerald-400 block mb-1`}>{Math.round((results.correctCount/results.totalQuestions)*100)}%</span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Chính xác</span>
          </div>
        </div>

        <div className="space-y-3">
          <button 
            onClick={() => setGameState(GameState.LEADERBOARD)}
            className="flex items-center justify-center gap-2 w-full py-4 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl font-bold transition-all shadow-xl shadow-teal-500/20"
          >
            <Trophy className="w-5 h-5" /> Xem bảng xếp hạng
          </button>
          <button 
            onClick={() => initiateQuiz(quizMode)}
            className={`flex items-center justify-center gap-2 w-full py-4 ${quizMode === QuizMode.CHALLENGE ? 'bg-red-600 hover:bg-red-500' : 'bg-cyan-600 hover:bg-cyan-500'} text-white rounded-2xl font-bold transition-all`}
          >
            <RotateCcw className="w-5 h-5" /> {quizMode === QuizMode.CHALLENGE ? 'Chơi lại (Chỉ tập luyện)' : 'Trực ca mới'}
          </button>
          <button 
            onClick={() => setGameState(GameState.DASHBOARD)}
            className="flex items-center justify-center gap-2 w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold transition-all border border-slate-700"
          >
            <LayoutDashboard className="w-5 h-5" /> Về Dashboard
          </button>
        </div>
      </div>
    </motion.div>
  );

  const renderLeaderboardScreen = () => (
    <div className="max-w-xl mx-auto py-12 px-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-black flex items-center gap-3">
          <Trophy className="text-yellow-500 w-8 h-8" /> 
          Top Kỹ Thuật Viên
        </h2>
        <button 
          onClick={() => setGameState(GameState.DASHBOARD)}
          className="p-3 bg-slate-800 rounded-2xl hover:bg-slate-700 transition-colors"
        >
          <LayoutDashboard className="w-6 h-6" />
        </button>
      </div>

      <Leaderboard entries={leaderboard} />

      <div className="mt-8 text-center">
        <button 
          onClick={() => setGameState(GameState.DASHBOARD)}
          className="px-8 py-4 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl font-bold transition-all shadow-xl shadow-teal-500/20"
        >
          Trở lại Dashboard
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-teal-500/30">
      <main className="container mx-auto px-4">
        {gameState === GameState.DASHBOARD && renderDashboard()}
        {gameState === GameState.NAME_INPUT && renderNameInput()}
        {gameState === GameState.GENERATING && renderGenerating()}
        {gameState === GameState.PLAYING && renderPlaying()}
        {gameState === GameState.RESULT && renderResult()}
        {gameState === GameState.LEADERBOARD && renderLeaderboardScreen()}
      </main>

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-600/5 blur-[120px] rounded-full"></div>
        <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] ${quizMode === QuizMode.CHALLENGE ? 'bg-red-600/5' : 'bg-cyan-600/5'} blur-[120px] rounded-full opacity-30`}></div>
      </div>
    </div>
  );
};

export default App;
