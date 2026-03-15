import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/authMiddle.ts';
import FlashcardSet from '../models/flashcardModel.ts';
import Notes from '../models/notesModel.ts';
import Quiz from '../models/quizModel.ts';
import { generateFlashcards, generateQuiz, generateSummary } from '../services/gemini.ts';

// ==================== GENERATE QUIZ ====================
export const createQuiz = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { noteId, questionCount = 10 } = req.body as { noteId: string; questionCount?: number };

    if (!noteId || !mongoose.Types.ObjectId.isValid(noteId)) {
      res.status(400).json({ message: 'Invalid note ID' });
      return;
    }

    // Get the note
    const note = await Notes.findOne({ _id: noteId, user: user._id });

    if (!note) {
      res.status(404).json({ message: 'Note not found' });
      return;
    }

    // Check if quiz already exists for this note
    const existingQuiz = await Quiz.findOne({ note: noteId, user: user._id });
    if (existingQuiz) {
      res.status(200).json({
        message: 'Quiz already exists for this note',
        quiz: existingQuiz,
        isExisting: true,
      });
      return;
    }

    // Generate quiz using Gemini
    const quizData = await generateQuiz(note.notes, note.topic, Math.min(questionCount, 20));

    // Save quiz to database
    const newQuiz = new Quiz({
      user: user._id,
      note: noteId,
      topic: note.topic,
      questions: quizData.questions,
      totalQuestions: quizData.questions.length,
    });

    await newQuiz.save();

    res.status(201).json({
      message: 'Quiz generated successfully',
      quiz: newQuiz,
    });
  } catch (error) {
    console.error('Create Quiz Error:', error);
    res.status(500).json({ message: 'Failed to generate quiz' });
  }
};

// ==================== GET QUIZ ====================
export const getQuiz = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { noteId } = req.params as { noteId: string };

    if (!noteId || !mongoose.Types.ObjectId.isValid(noteId)) {
      res.status(400).json({ message: 'Invalid note ID' });
      return;
    }

    const quiz = await Quiz.findOne({ note: noteId, user: user._id });

    if (!quiz) {
      res.status(404).json({ message: 'Quiz not found. Generate one first.' });
      return;
    }

    res.status(200).json({ quiz });
  } catch (error) {
    console.error('Get Quiz Error:', error);
    res.status(500).json({ message: 'Failed to fetch quiz' });
  }
};

// ==================== SUBMIT QUIZ ATTEMPT ====================
export const submitQuizAttempt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { quizId } = req.params as { quizId: string };
    const { answers } = req.body as { answers: { questionId: string; selectedOption: number }[] };

    if (!quizId || !mongoose.Types.ObjectId.isValid(quizId)) {
      res.status(400).json({ message: 'Invalid quiz ID' });
      return;
    }

    const quiz = await Quiz.findOne({ _id: quizId, user: user._id });

    if (!quiz) {
      res.status(404).json({ message: 'Quiz not found' });
      return;
    }

    // Calculate score
    let correctAnswers = 0;
    const results = quiz.questions.map((question, index) => {
      const userAnswer = answers.find((a) => a.questionId === (question as any)._id.toString());
      const correctOptionIndex = question.options.findIndex((opt) => opt.isCorrect);
      const isCorrect = userAnswer?.selectedOption === correctOptionIndex;

      if (isCorrect) correctAnswers++;

      return {
        questionId: (question as any)._id,
        question: question.question,
        userAnswer: userAnswer?.selectedOption ?? -1,
        correctAnswer: correctOptionIndex,
        isCorrect,
        explanation: question.explanation,
      };
    });

    const score = Math.round((correctAnswers / quiz.totalQuestions) * 100);

    // Update quiz stats
    quiz.attemptedCount += 1;
    quiz.lastAttemptedAt = new Date();
    if (score > quiz.bestScore) {
      quiz.bestScore = score;
    }
    await quiz.save();

    res.status(200).json({
      score,
      correctAnswers,
      totalQuestions: quiz.totalQuestions,
      percentage: score,
      bestScore: quiz.bestScore,
      attemptCount: quiz.attemptedCount,
      results,
    });
  } catch (error) {
    console.error('Submit Quiz Attempt Error:', error);
    res.status(500).json({ message: 'Failed to submit quiz' });
  }
};

// ==================== GET ALL USER QUIZZES ====================
export const getAllQuizzes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const quizzes = await Quiz.find({ user: user._id })
      .select('topic totalQuestions attemptedCount bestScore lastAttemptedAt createdAt note')
      .sort({ createdAt: -1 });

    res.status(200).json({ quizzes });
  } catch (error) {
    console.error('Get All Quizzes Error:', error);
    res.status(500).json({ message: 'Failed to fetch quizzes' });
  }
};

// ==================== GENERATE FLASHCARDS ====================
export const createFlashcards = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { noteId, cardCount = 15 } = req.body as { noteId: string; cardCount?: number };

    if (!noteId || !mongoose.Types.ObjectId.isValid(noteId)) {
      res.status(400).json({ message: 'Invalid note ID' });
      return;
    }

    // Get the note
    const note = await Notes.findOne({ _id: noteId, user: user._id });

    if (!note) {
      res.status(404).json({ message: 'Note not found' });
      return;
    }

    // Check if flashcards already exist for this note
    const existingFlashcards = await FlashcardSet.findOne({ note: noteId, user: user._id });
    if (existingFlashcards) {
      res.status(200).json({
        message: 'Flashcards already exist for this note',
        flashcardSet: existingFlashcards,
        isExisting: true,
      });
      return;
    }

    // Generate flashcards using Gemini
    const flashcardData = await generateFlashcards(note.notes, note.topic, Math.min(cardCount, 30));

    // Save flashcards to database
    const newFlashcardSet = new FlashcardSet({
      user: user._id,
      note: noteId,
      topic: note.topic,
      cards: flashcardData.cards.map((card) => ({
        ...card,
        reviewCount: 0,
        isLearned: false,
      })),
      totalCards: flashcardData.cards.length,
    });

    await newFlashcardSet.save();

    res.status(201).json({
      message: 'Flashcards generated successfully',
      flashcardSet: newFlashcardSet,
    });
  } catch (error) {
    console.error('Create Flashcards Error:', error);
    res.status(500).json({ message: 'Failed to generate flashcards' });
  }
};

// ==================== GET FLASHCARDS ====================
export const getFlashcards = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { noteId } = req.params as { noteId: string };

    if (!noteId || !mongoose.Types.ObjectId.isValid(noteId)) {
      res.status(400).json({ message: 'Invalid note ID' });
      return;
    }

    const flashcardSet = await FlashcardSet.findOne({ note: noteId, user: user._id });

    if (!flashcardSet) {
      res.status(404).json({ message: 'Flashcards not found. Generate them first.' });
      return;
    }

    res.status(200).json({ flashcardSet });
  } catch (error) {
    console.error('Get Flashcards Error:', error);
    res.status(500).json({ message: 'Failed to fetch flashcards' });
  }
};

// ==================== UPDATE FLASHCARD PROGRESS ====================
export const updateFlashcardProgress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { flashcardSetId, cardId } = req.params as { flashcardSetId: string; cardId: string };
    const { isLearned, difficulty } = req.body as {
      isLearned?: boolean;
      difficulty?: 'easy' | 'medium' | 'hard';
    };

    if (!flashcardSetId || !mongoose.Types.ObjectId.isValid(flashcardSetId)) {
      res.status(400).json({ message: 'Invalid flashcard set ID' });
      return;
    }

    const flashcardSet = await FlashcardSet.findOne({ _id: flashcardSetId, user: user._id });

    if (!flashcardSet) {
      res.status(404).json({ message: 'Flashcard set not found' });
      return;
    }

    // Find and update the specific card
    const cardIndex = flashcardSet.cards.findIndex((c: any) => c._id.toString() === cardId);

    if (cardIndex === -1) {
      res.status(404).json({ message: 'Card not found' });
      return;
    }

    const card = flashcardSet.cards[cardIndex];
    const wasLearned = card.isLearned;

    card.reviewCount += 1;
    card.lastReviewed = new Date();

    if (isLearned !== undefined) {
      card.isLearned = isLearned;
    }
    if (difficulty !== undefined) {
      card.difficulty = difficulty;
    }

    // Update learned cards count
    if (isLearned && !wasLearned) {
      flashcardSet.learnedCards += 1;
    } else if (!isLearned && wasLearned) {
      flashcardSet.learnedCards = Math.max(0, flashcardSet.learnedCards - 1);
    }

    flashcardSet.lastStudiedAt = new Date();
    await flashcardSet.save();

    res.status(200).json({
      message: 'Card progress updated',
      card,
      progress: {
        learnedCards: flashcardSet.learnedCards,
        totalCards: flashcardSet.totalCards,
        percentage: Math.round((flashcardSet.learnedCards / flashcardSet.totalCards) * 100),
      },
    });
  } catch (error) {
    console.error('Update Flashcard Progress Error:', error);
    res.status(500).json({ message: 'Failed to update card progress' });
  }
};

// ==================== GET ALL USER FLASHCARD SETS ====================
export const getAllFlashcardSets = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const flashcardSets = await FlashcardSet.find({ user: user._id })
      .select('topic totalCards learnedCards lastStudiedAt createdAt note')
      .sort({ createdAt: -1 });

    res.status(200).json({ flashcardSets });
  } catch (error) {
    console.error('Get All Flashcard Sets Error:', error);
    res.status(500).json({ message: 'Failed to fetch flashcard sets' });
  }
};

// ==================== GENERATE SUMMARY ====================
export const createSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { noteId, maxWords = 200 } = req.body as { noteId: string; maxWords?: number };

    if (!noteId || !mongoose.Types.ObjectId.isValid(noteId)) {
      res.status(400).json({ message: 'Invalid note ID' });
      return;
    }

    // Get the note
    const note = await Notes.findOne({ _id: noteId, user: user._id });

    if (!note) {
      res.status(404).json({ message: 'Note not found' });
      return;
    }

    // Generate summary using Gemini
    const summaryData = await generateSummary(note.notes, note.topic, Math.min(maxWords, 500));

    res.status(200).json({
      message: 'Summary generated successfully',
      topic: note.topic,
      summary: summaryData.summary,
      keyPoints: summaryData.keyPoints,
      quickFacts: summaryData.quickFacts,
    });
  } catch (error) {
    console.error('Create Summary Error:', error);
    res.status(500).json({ message: 'Failed to generate summary' });
  }
};

// ==================== DELETE QUIZ ====================
export const deleteQuiz = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { quizId } = req.params as { quizId: string };

    if (!quizId || !mongoose.Types.ObjectId.isValid(quizId)) {
      res.status(400).json({ message: 'Invalid quiz ID' });
      return;
    }

    const quiz = await Quiz.findOneAndDelete({ _id: quizId, user: user._id });

    if (!quiz) {
      res.status(404).json({ message: 'Quiz not found' });
      return;
    }

    res.status(200).json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Delete Quiz Error:', error);
    res.status(500).json({ message: 'Failed to delete quiz' });
  }
};

// ==================== DELETE FLASHCARD SET ====================
export const deleteFlashcardSet = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { flashcardSetId } = req.params as { flashcardSetId: string };

    if (!flashcardSetId || !mongoose.Types.ObjectId.isValid(flashcardSetId)) {
      res.status(400).json({ message: 'Invalid flashcard set ID' });
      return;
    }

    const flashcardSet = await FlashcardSet.findOneAndDelete({
      _id: flashcardSetId,
      user: user._id,
    });

    if (!flashcardSet) {
      res.status(404).json({ message: 'Flashcard set not found' });
      return;
    }

    res.status(200).json({ message: 'Flashcard set deleted successfully' });
  } catch (error) {
    console.error('Delete Flashcard Set Error:', error);
    res.status(500).json({ message: 'Failed to delete flashcard set' });
  }
};
