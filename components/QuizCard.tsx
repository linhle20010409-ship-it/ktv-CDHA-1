
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Question } from '../types';
import { CheckCircle2, XCircle, ClipboardCheck, Settings2 } from 'lucide-react';

interface QuizCardProps {
  question: Question;
  onSelectOption: (index: number) => void;
  selectedOption: number | null;
  isCorrect: boolean | null;
  showExplanation: boolean;
}

const QuizCard: React.FC<QuizCardProps> = ({
  question,
  onSelectOption,
  selectedOption,
  isCorrect,
  showExplanation
}) => {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        key={question.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-slate-900/40 backdrop-blur-xl p-6 md:p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden"
      >
        {/* Subtle glass effect highlight */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-teal-500/50 to-transparent"></div>
        
        <h2 className="text-xl md:text-2xl font-bold mb-10 leading-tight text-white tracking-tight">
          {question.question}
        </h2>

        <div className="grid gap-4">
          {question.options.map((option, index) => {
            const isSelected = selectedOption === index;
            const isAnswerCorrect = question.correctAnswer === index;
            
            let buttonStyle = "bg-slate-800/30 border-slate-800 hover:border-teal-500/30 text-slate-300";
            if (selectedOption !== null) {
              if (isAnswerCorrect) {
                buttonStyle = "bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]";
              } else if (isSelected) {
                buttonStyle = "bg-rose-500/10 border-rose-500 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.1)]";
              } else {
                buttonStyle = "bg-slate-900/20 border-slate-900 opacity-40 text-slate-500";
              }
            }

            return (
              <button
                key={index}
                disabled={selectedOption !== null}
                onClick={() => onSelectOption(index)}
                className={`flex items-center justify-between p-5 md:p-6 rounded-2xl border-2 transition-all duration-300 text-left font-medium ${buttonStyle}`}
              >
                <span className="flex-1">{option}</span>
                {selectedOption !== null && isAnswerCorrect && (
                  <CheckCircle2 className="w-6 h-6 ml-3 text-emerald-500" />
                )}
                {selectedOption !== null && isSelected && !isAnswerCorrect && (
                  <XCircle className="w-6 h-6 ml-3 text-rose-500" />
                )}
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {showExplanation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-10 pt-8 border-t border-slate-800"
            >
              <div className="flex items-start gap-4 p-5 bg-teal-500/5 rounded-2xl border border-teal-500/10">
                <Settings2 className="w-6 h-6 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-teal-300 text-xs uppercase tracking-[0.2em] mb-2">Biện luận kỹ thuật</h4>
                  <p className="text-slate-300 text-sm leading-relaxed italic">
                    {question.explanation}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default QuizCard;
