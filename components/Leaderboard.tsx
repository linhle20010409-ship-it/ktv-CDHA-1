
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LeaderboardEntry } from '../types';
import { Trophy, Medal, Crown, User, Star } from 'lucide-react';
import { MOCK_LEADERBOARD_WEEK } from '../data/mockData';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
}

const Leaderboard: React.FC<LeaderboardProps> = ({ entries }) => {
  const [activeTab, setActiveTab] = useState<'today' | 'week'>('today');

  const data = activeTab === 'today' ? entries : MOCK_LEADERBOARD_WEEK;

  return (
    <div className="w-full max-w-lg mx-auto bg-slate-900/40 backdrop-blur-lg border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-slate-800">
        <div className="flex bg-slate-800/50 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('today')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-black transition-all ${
              activeTab === 'today' ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20' : 'text-slate-500 hover:text-white'
            }`}
          >
            Hôm nay
          </button>
          <button
            onClick={() => setActiveTab('week')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-black transition-all ${
              activeTab === 'week' ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20' : 'text-slate-500 hover:text-white'
            }`}
          >
            Tuần này
          </button>
        </div>
      </div>

      <div className="p-4 min-h-[300px]">
        <AnimatePresence mode="wait">
          {data.length > 0 ? (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              {data.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                    entry.isCurrentUser 
                      ? 'bg-teal-500/20 border-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.3)]' 
                      : index === 0 
                        ? 'bg-yellow-500/10 border-yellow-500/20' 
                        : 'bg-slate-800/30 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-center w-8 h-8 font-black text-lg italic">
                    {index === 0 ? <Crown className="text-yellow-400 w-6 h-6" /> : 
                     index === 1 ? <Medal className="text-slate-300 w-6 h-6" /> :
                     index === 2 ? <Medal className="text-orange-400 w-6 h-6" /> : 
                     <span className="text-slate-500">#{index + 1}</span>}
                  </div>
                  <div className="relative">
                    <img
                      src={entry.avatar}
                      alt={entry.name}
                      className="w-10 h-10 rounded-full border-2 border-slate-700"
                    />
                    {entry.isCurrentUser && (
                      <div className="absolute -top-1 -right-1 bg-teal-500 rounded-full p-0.5 border border-slate-900">
                        <Star className="w-2.5 h-2.5 text-white fill-current" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className={`font-bold ${entry.isCurrentUser ? 'text-teal-400' : 'text-slate-100'}`}>
                      {entry.name} {entry.isCurrentUser && "(Bạn)"}
                    </h4>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Kỹ thuật viên</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-black ${entry.isCurrentUser ? 'text-white' : 'text-teal-400'}`}>{entry.score}</span>
                    <span className="text-[10px] text-slate-600 block uppercase font-black">Pts</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-64 text-slate-600"
            >
              <User className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-bold italic">Chưa có dữ liệu</p>
              <p className="text-xs uppercase tracking-widest mt-1 text-center">Hãy bắt đầu ca trực để lên bảng vàng!</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Leaderboard;
