import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/authMiddle.ts';
import Notes, { INotes } from '../models/notesModel.ts';
import { generateGeminiResponse } from '../services/gemini.ts';

interface GenerateNotesRequestBody {
  topic: string;
  classLevel?: string;
  examType?: string;
  revisionMode?: boolean;
  includeDiagram?: boolean;
  includeChart?: boolean;
  category?: string;
  tags?: string[];
}

interface ErrorResponse {
  message: string;
}

export const generateNotes = async (
  req: AuthRequest,
  res: Response<object | ErrorResponse>
): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const {
      topic,
      classLevel,
      examType,
      revisionMode = false,
      includeDiagram = false,
      includeChart = false,
      category = '',
      tags = [],
    }: GenerateNotesRequestBody = req.body;

    if (!topic || topic.trim() === '') {
      res.status(400).json({ message: 'Topic is required' });
      return;
    }

    // Generate notes using Gemini
    const generatedNotes = await generateGeminiResponse({
      topic: topic.trim(),
      classLevel,
      examType,
      revisionMode,
      includeDiagram,
      includeChart,
    });

    // Save notes to database
    const newNotes: INotes = new Notes({
      user: user._id,
      topic: topic.trim(),
      classLevel,
      examType,
      revisionMode,
      subTopics: {
        veryImportant: generatedNotes.subTopics['⭐'] || [],
        important: generatedNotes.subTopics['⭐⭐'] || [],
        frequentlyAsked: generatedNotes.subTopics['⭐⭐⭐'] || [],
      },
      importance: generatedNotes.importance,
      notes: generatedNotes.notes,
      revisionPoints: generatedNotes.revisionPoints,
      questions: generatedNotes.questions,
      diagram: generatedNotes.diagram,
      charts: generatedNotes.charts,
      category,
      tags,
    });

    await newNotes.save();

    // Add notes reference to user's notes array
    user.notes.push(newNotes._id as mongoose.Types.ObjectId);

    // Update stats for dashboard
    user.totalNotesGenerated += 1;

    // Update study streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastActive = new Date(user.lastActiveAt);
    lastActive.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Same day activity - keep current streak, only start if streak is 0
      if (user.studyStreak === 0) {
        user.studyStreak = 1;
        if (user.studyStreak > user.longestStreak) {
          user.longestStreak = user.studyStreak;
        }
      }
    } else if (diffDays === 1) {
      // Consecutive day - increment streak
      user.studyStreak += 1;
      if (user.studyStreak > user.longestStreak) {
        user.longestStreak = user.studyStreak;
      }
    } else {
      // Streak broken (more than 1 day gap) - reset to 1
      user.studyStreak = 1;
    }
    user.lastActiveAt = new Date();

    await user.save();

    res.status(201).json({
      message: 'Notes generated successfully',
      data: newNotes,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.log('Error in generateNotes controller:', error.message);

      // Handle specific error types
      if (error.message.includes('API_QUOTA_EXHAUSTED')) {
        res
          .status(503)
          .json({ message: 'AI service temporarily unavailable. Please try again later.' });
        return;
      }

      if (error.message.includes('Rate limit exceeded')) {
        res.status(429).json({ message: 'Too many requests. Please wait a moment and try again.' });
        return;
      }

      if (error.message.includes('Failed to parse')) {
        res
          .status(500)
          .json({ message: 'Failed to generate notes. Please try with a different topic.' });
        return;
      }
    } else {
      console.log('Error in generateNotes controller:', error);
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};
