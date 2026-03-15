import express, { Router } from 'express';
import {
  createFlashcards,
  createQuiz,
  createSummary,
  deleteFlashcardSet,
  deleteQuiz,
  getAllFlashcardSets,
  getAllQuizzes,
  getFlashcards,
  getQuiz,
  submitQuizAttempt,
  updateFlashcardProgress,
} from '../controllers/aiControl.ts';
import { protectRoute } from '../middleware/authMiddle.ts';

const router: Router = express.Router();

// ==================== QUIZ ROUTES ====================
// Generate quiz from notes
router.post('/quiz/generate', protectRoute, createQuiz);

// Get all user's quizzes
router.get('/quiz', protectRoute, getAllQuizzes);

// Get quiz by note ID
router.get('/quiz/note/:noteId', protectRoute, getQuiz);

// Submit quiz attempt
router.post('/quiz/:quizId/submit', protectRoute, submitQuizAttempt);

// Delete quiz
router.delete('/quiz/:quizId', protectRoute, deleteQuiz);

// ==================== FLASHCARD ROUTES ====================
// Generate flashcards from notes
router.post('/flashcards/generate', protectRoute, createFlashcards);

// Get all user's flashcard sets
router.get('/flashcards', protectRoute, getAllFlashcardSets);

// Get flashcards by note ID
router.get('/flashcards/note/:noteId', protectRoute, getFlashcards);

// Update flashcard progress (mark as learned, update difficulty)
router.patch('/flashcards/:flashcardSetId/card/:cardId', protectRoute, updateFlashcardProgress);

// Delete flashcard set
router.delete('/flashcards/:flashcardSetId', protectRoute, deleteFlashcardSet);

// ==================== SUMMARY ROUTES ====================
// Generate summary from notes
router.post('/summary/generate', protectRoute, createSummary);

export default router;
