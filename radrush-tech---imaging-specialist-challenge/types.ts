
export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  avatar: string;
  isCurrentUser?: boolean;
}

export enum GameState {
  DASHBOARD = 'DASHBOARD',
  NAME_INPUT = 'NAME_INPUT',
  PLAYING = 'PLAYING',
  RESULT = 'RESULT',
  LEADERBOARD = 'LEADERBOARD',
  GENERATING = 'GENERATING'
}

export enum QuizMode {
  CHALLENGE = 'CHALLENGE',
  TRAINING = 'TRAINING'
}

export interface QuizResults {
  totalScore: number;
  correctCount: number;
  totalQuestions: number;
}
