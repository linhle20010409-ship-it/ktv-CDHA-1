
import React from 'react';
import { motion } from 'framer-motion';
import { QuizMode } from '../types';

interface TimerProps {
  totalTime: number;
  timeLeft: number;
  isActive: boolean;
  mode?: QuizMode;
}

const Timer: React.FC<TimerProps> = ({ totalTime, timeLeft, isActive, mode = QuizMode.CHALLENGE }) => {
  const percentage = (timeLeft / totalTime) * 100;
  
  const isChallenge = mode === QuizMode.CHALLENGE;
  const isWarning = isChallenge ? timeLeft < 0.8 : timeLeft < 3;
  
  const accentColor = isChallenge ? 'red' : 'cyan';
  const normalGradient = isChallenge 
    ? 'bg-gradient-to-r from-red-500 to-rose-400' 
    : 'bg-gradient-to-r from-cyan-500 to-blue-400';

  return (
    <div className="w-full mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Thời gian còn lại</span>
        <span className={`text-2xl font-black tabular-nums ${isWarning ? 'text-red-500 animate-pulse' : `text-${accentColor}-400`}`}>
          {timeLeft.toFixed(2)}s
        </span>
      </div>
      <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/50 shadow-inner">
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.05, ease: "linear" }}
          className={`h-full ${isWarning ? 'bg-gradient-to-r from-red-600 to-orange-500' : normalGradient}`}
        />
      </div>
    </div>
  );
};

export default Timer;
