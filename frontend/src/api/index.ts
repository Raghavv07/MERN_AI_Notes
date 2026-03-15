import type {
  AuthResponse,
  CreateNotePayload,
  FlashcardSet,
  Leaderboard,
  Note,
  Quiz,
  QuizAttemptPayload,
  RecentActivity,
  StudyProgress,
  UpdateNotePayload,
  User,
  UserStats,
} from '../types';
import api from './axios';

type BackendNote = Partial<Note> & {
  notes?: string;
};

const normalizeNote = (note: BackendNote): Note => ({
  ...(note as Note),
  content: note.content ?? note.notes ?? '',
  tags: Array.isArray(note.tags) ? note.tags : [],
  accessCount: typeof note.accessCount === 'number' ? note.accessCount : 0,
  isCompleted: typeof note.isCompleted === 'boolean' ? note.isCompleted : false,
  examType: note.examType ?? '',
  classLevel: note.classLevel ?? '',
  language: note.language ?? 'English',
});

const normalizeNotes = (notes: BackendNote[] = []): Note[] => notes.map(normalizeNote);

// ==================== AUTH API ====================
export const authApi = {
  register: async (data: { fullName: string; email: string; password: string }) => {
    const response = await api.post<AuthResponse>('/auth/signup', data);
    return response.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await api.post<AuthResponse>('/auth/signin', data);
    return response.data;
  },

  logout: async () => {
    const response = await api.post<{ message: string }>('/auth/logout');
    return response.data;
  },

  getMe: async () => {
    const response = await api.get<{ user: User }>('/auth/me');
    return response.data;
  },
};

// ==================== NOTES API ====================
export const notesApi = {
  getMyNotes: async () => {
    const response = await api.get<{ notes: BackendNote[] }>('/notes/getnotes');
    return { ...response.data, notes: normalizeNotes(response.data.notes) };
  },

  getNoteById: async (id: string) => {
    const response = await api.get<{ note: BackendNote }>(`/notes/${id}`);
    return { ...response.data, note: normalizeNote(response.data.note) };
  },

  generateNotes: async (data: CreateNotePayload) => {
    const response = await api.post<{ message: string; notes?: BackendNote; data?: BackendNote }>(
      '/notes/generatenotes',
      data
    );
    const note = response.data.notes ?? response.data.data;
    return {
      message: response.data.message,
      notes: note ? normalizeNote(note) : undefined,
    };
  },

  deleteNote: async (id: string) => {
    const response = await api.delete<{ message: string }>(`/notes/${id}`);
    return response.data;
  },

  updateNote: async (id: string, data: UpdateNotePayload) => {
    const response = await api.put<{ message: string; note: Note }>(`/notes/${id}`, data);
    return response.data;
  },

  toggleBookmark: async (id: string) => {
    const response = await api.patch<{ message: string; isBookmarked: boolean }>(
      `/notes/${id}/bookmark`
    );
    return response.data;
  },

  searchNotes: async (query: string) => {
    const response = await api.get<{ notes: BackendNote[] }>(
      `/notes/search?query=${encodeURIComponent(query)}`
    );
    return { ...response.data, notes: normalizeNotes(response.data.notes) };
  },

  getNotesByCategory: async (category: string) => {
    const response = await api.get<{ notes: BackendNote[]; category: string }>(
      `/notes/category/${encodeURIComponent(category)}`
    );
    return { ...response.data, notes: normalizeNotes(response.data.notes) };
  },

  getAllCategories: async () => {
    const response = await api.get<{ categories: string[] | { category: string; count: number }[] }>(
      '/notes/categories'
    );
    const categories = Array.isArray(response.data.categories)
      ? response.data.categories.map((item) =>
          typeof item === 'string' ? item : item.category
        )
      : [];
    return { categories };
  },

  getNotesByTag: async (tag: string) => {
    const response = await api.get<{ notes: BackendNote[]; tag: string }>(
      `/notes/tag/${encodeURIComponent(tag)}`
    );
    return { ...response.data, notes: normalizeNotes(response.data.notes) };
  },

  getAllTags: async () => {
    const response = await api.get<{ tags: { tag: string; count: number }[] }>('/notes/tags');
    return response.data;
  },

  getNoteVersions: async (id: string) => {
    const response = await api.get<{ versions: Note[]; currentVersion: number }>(
      `/notes/${id}/versions`
    );
    return response.data;
  },

  revertToVersion: async (id: string, versionId: string) => {
    const response = await api.post<{ message: string; note: Note }>(
      `/notes/${id}/versions/${versionId}/restore`
    );
    return response.data;
  },

  // Bookmarked notes
  getBookmarkedNotes: async () => {
    const response = await api.get<{ notes: BackendNote[] }>('/notes/bookmarked');
    return { ...response.data, notes: normalizeNotes(response.data.notes) };
  },

  // Category update
  updateCategory: async (id: string, category: string) => {
    const response = await api.patch<{ message: string; note: Note }>(`/notes/${id}/category`, {
      category,
    });
    return response.data;
  },

  // Tags management
  addTags: async (id: string, tags: string[]) => {
    const response = await api.post<{ message: string; note: Note }>(`/notes/${id}/tags`, {
      tags,
    });
    return response.data;
  },

  removeTag: async (id: string, tag: string) => {
    const response = await api.delete<{ message: string; note: Note }>(`/notes/${id}/tags`, {
      data: { tag },
    });
    return response.data;
  },

  // Create new version
  createNoteVersion: async (id: string) => {
    const response = await api.post<{ message: string; note: Note }>(`/notes/${id}/versions`);
    return response.data;
  },
};

// ==================== PDF API ====================
export const pdfApi = {
  downloadPdf: async (noteId: string) => {
    const response = await api.get(`/pdf/download/${noteId}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

// ==================== AI API ====================
export const aiApi = {
  createQuiz: async (noteId: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium') => {
    const response = await api.post<{ message: string; quiz: Quiz }>('/ai/quiz/generate', {
      noteId,
      difficulty,
    });
    return response.data;
  },

  getQuizzesByNote: async (noteId: string) => {
    const response = await api.get<{ quizzes: Quiz[] }>(`/ai/quiz/note/${noteId}`);
    return response.data;
  },

  submitQuizAttempt: async (quizId: string, data: QuizAttemptPayload) => {
    const response = await api.post<{
      message: string;
      score: number;
      totalQuestions: number;
      percentage: number;
      results: {
        question: string;
        userAnswer: number;
        correctAnswer: number;
        isCorrect: boolean;
        explanation: string;
      }[];
    }>(`/ai/quiz/${quizId}/submit`, data);
    return response.data;
  },

  createFlashcards: async (noteId: string, cardCount: number = 10) => {
    const response = await api.post<{ message: string; flashcardSet: FlashcardSet }>(
      '/ai/flashcards/generate',
      { noteId, cardCount }
    );
    return response.data;
  },

  getFlashcardsByNote: async (noteId: string) => {
    const response = await api.get<{ flashcardSets: FlashcardSet[] }>(
      `/ai/flashcards/note/${noteId}`
    );
    return response.data;
  },

  updateFlashcardProgress: async (setId: string, cardId: string, isLearned: boolean) => {
    const response = await api.patch<{ message: string; flashcardSet: FlashcardSet }>(
      `/ai/flashcards/${setId}/card/${cardId}`,
      { isLearned }
    );
    return response.data;
  },

  createSummary: async (noteId: string, length: 'short' | 'medium' | 'detailed' = 'medium') => {
    const response = await api.post<{
      message: string;
      summary: string;
      originalLength: number;
      summaryLength: number;
    }>('/ai/summary/generate', { noteId, length });
    return response.data;
  },

  // Get all user's quizzes
  getAllQuizzes: async () => {
    const response = await api.get<{ quizzes: Quiz[] }>('/ai/quiz');
    return response.data;
  },

  // Delete quiz
  deleteQuiz: async (quizId: string) => {
    const response = await api.delete<{ message: string }>(`/ai/quiz/${quizId}`);
    return response.data;
  },

  // Get all user's flashcard sets
  getAllFlashcardSets: async () => {
    const response = await api.get<{ flashcardSets: FlashcardSet[] }>('/ai/flashcards');
    return response.data;
  },

  // Delete flashcard set
  deleteFlashcardSet: async (flashcardSetId: string) => {
    const response = await api.delete<{ message: string }>(`/ai/flashcards/${flashcardSetId}`);
    return response.data;
  },
};

// ==================== DASHBOARD API ====================
export const dashboardApi = {
  getStats: async () => {
    const response = await api.get<UserStats>('/dashboard/stats');
    return response.data;
  },

  getStudyProgress: async () => {
    const response = await api.get<StudyProgress>('/dashboard/progress');
    return response.data;
  },

  getRecentActivity: async (limit: number = 10) => {
    const response = await api.get<RecentActivity>(`/dashboard/activity?limit=${limit}`);
    return response.data;
  },

  markTopicCompleted: async (noteId: string) => {
    const response = await api.patch<{
      message: string;
      isCompleted: boolean;
      completedAt?: string;
    }>(`/dashboard/complete/${noteId}`);
    return response.data;
  },

  getLeaderboard: async () => {
    const response = await api.get<Leaderboard>('/dashboard/leaderboard');
    return response.data;
  },
};
