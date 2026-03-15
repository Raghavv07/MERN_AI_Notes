// User Types
export interface User {
  _id: string;
  fullName: string;
  email: string;
  notes: string[];
  totalNotesGenerated: number;
  studyStreak: number;
  lastActiveAt: string;
  longestStreak: number;
  completedTopics: number;
  createdAt: string;
  updatedAt: string;
}

// Notes Types
export interface Note {
  _id: string;
  user: string;
  topic: string;
  examType: string;
  classLevel: string;
  language: string;
  content: string;
  isBookmarked: boolean;
  category: string;
  tags: string[];
  version: number;
  parentNote?: string;
  isLatestVersion: boolean;
  lastAccessedAt: string;
  accessCount: number;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotePayload {
  topic: string;
  examType: string;
  classLevel: string;
  language: string;
}

export interface UpdateNotePayload {
  topic?: string;
  content?: string;
  category?: string;
  tags?: string[];
}

// Quiz Types
export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Quiz {
  _id: string;
  user: string;
  note: string;
  topic: string;
  questions: QuizQuestion[];
  difficulty: 'easy' | 'medium' | 'hard';
  totalQuestions: number;
  attemptedAt?: string;
  score?: number;
  timeSpent?: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuizAttemptPayload {
  answers: number[];
  timeSpent: number;
}

// Flashcard Types
export interface Flashcard {
  _id: string;
  front: string;
  back: string;
  isLearned: boolean;
  reviewCount: number;
}

export interface FlashcardSet {
  _id: string;
  user: string;
  note: string;
  topic: string;
  cards: Flashcard[];
  totalCards: number;
  learnedCards: number;
  lastReviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Dashboard Types
export interface UserStats {
  stats: {
    totalNotes: number;
    bookmarkedNotes: number;
    completedNotes: number;
    topicsCovered: number;
    categoriesUsed: number;
    totalNotesGenerated: number;
    studyStreak: number;
    longestStreak: number;
    notesThisWeek: number;
    notesThisMonth: number;
    completionRate: number;
  };
  breakdown: {
    byExamType: { _id: string; count: number }[];
    byClassLevel: { _id: string; count: number }[];
  };
}

export interface StudyProgress {
  overview: {
    totalTopics: number;
    completedTopics: number;
    pendingTopics: number;
    overallProgress: number;
  };
  studyStreak: {
    current: number;
    longest: number;
  };
  progressByCategory: {
    _id: string;
    category: string;
    total: number;
    completed: number;
    progress: number;
  }[];
  dailyActivity: {
    _id: string;
    count: number;
  }[];
  recentlyCompleted: Note[];
  pendingToComplete: Note[];
}

export interface RecentActivity {
  recentlyAccessed: Note[];
  recentlyCreated: Note[];
  recentlyCompleted: Note[];
  mostAccessed: Note[];
  lastActiveAt: string;
}

export interface LeaderboardUser {
  _id: string;
  fullName: string;
  totalNotesGenerated: number;
  studyStreak: number;
  completedTopics: number;
}

export interface Leaderboard {
  leaderboard: LeaderboardUser[];
  userRank: {
    rank: number;
    totalNotesGenerated: number;
    studyStreak: number;
    completedTopics: number;
  };
}

// API Response Types
export interface ApiResponse<T> {
  message?: string;
  data?: T;
}

export interface AuthResponse {
  message: string;
  user: User;
}

export interface NotesResponse {
  notes: Note[];
}

export interface NoteResponse {
  note: Note;
}
