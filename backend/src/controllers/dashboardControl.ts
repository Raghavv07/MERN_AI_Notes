import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/authMiddle.ts';
import Notes from '../models/notesModel.ts';
import User from '../models/userModel.ts';

// ==================== GET USER STATISTICS ====================
export const getUserStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    // Get notes statistics
    const totalNotes = await Notes.countDocuments({ user: user._id, isLatestVersion: true });
    const bookmarkedNotes = await Notes.countDocuments({
      user: user._id,
      isBookmarked: true,
      isLatestVersion: true,
    });
    const completedNotes = await Notes.countDocuments({
      user: user._id,
      isCompleted: true,
      isLatestVersion: true,
    });

    // Get unique topics count
    const uniqueTopics = await Notes.distinct('topic', { user: user._id, isLatestVersion: true });

    // Get unique categories count
    const uniqueCategories = await Notes.distinct('category', {
      user: user._id,
      category: { $ne: '' },
      isLatestVersion: true,
    });

    // Get notes by exam type
    const notesByExamType = await Notes.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(user._id.toString()),
          isLatestVersion: true,
          examType: { $ne: null },
        },
      },
      { $group: { _id: '$examType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Get notes by class level
    const notesByClassLevel = await Notes.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(user._id.toString()),
          isLatestVersion: true,
          classLevel: { $ne: null },
        },
      },
      { $group: { _id: '$classLevel', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Get this week's activity
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const notesThisWeek = await Notes.countDocuments({
      user: user._id,
      isLatestVersion: true,
      createdAt: { $gte: oneWeekAgo },
    });

    // Get this month's activity
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const notesThisMonth = await Notes.countDocuments({
      user: user._id,
      isLatestVersion: true,
      createdAt: { $gte: oneMonthAgo },
    });

    res.status(200).json({
      stats: {
        totalNotes,
        bookmarkedNotes,
        completedNotes,
        topicsCovered: uniqueTopics.length,
        categoriesUsed: uniqueCategories.length,
        totalNotesGenerated: user.totalNotesGenerated,
        studyStreak: user.studyStreak,
        longestStreak: user.longestStreak,
        notesThisWeek,
        notesThisMonth,
        completionRate: totalNotes > 0 ? Math.round((completedNotes / totalNotes) * 100) : 0,
      },
      breakdown: {
        byExamType: notesByExamType,
        byClassLevel: notesByClassLevel,
      },
    });
  } catch (error) {
    console.error('Get User Stats Error:', error);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
};

// ==================== GET STUDY PROGRESS ====================
export const getStudyProgress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    // Get all notes with completion status
    const allNotes = await Notes.find({ user: user._id, isLatestVersion: true })
      .select('topic category isCompleted completedAt createdAt')
      .sort({ createdAt: -1 });

    const completedNotes = allNotes.filter((note) => note.isCompleted);
    const pendingNotes = allNotes.filter((note) => !note.isCompleted);

    // Get progress by category
    const progressByCategory = await Notes.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(user._id.toString()),
          isLatestVersion: true,
          category: { $ne: '' },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: 1 },
          completed: { $sum: { $cond: ['$isCompleted', 1, 0] } },
        },
      },
      {
        $project: {
          category: '$_id',
          total: 1,
          completed: 1,
          progress: {
            $multiply: [{ $divide: ['$completed', '$total'] }, 100],
          },
        },
      },
      { $sort: { progress: -1 } },
    ]);

    // Get daily activity for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyActivity = await Notes.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(user._id.toString()),
          isLatestVersion: true,
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Calculate streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    res.status(200).json({
      overview: {
        totalTopics: allNotes.length,
        completedTopics: completedNotes.length,
        pendingTopics: pendingNotes.length,
        overallProgress:
          allNotes.length > 0 ? Math.round((completedNotes.length / allNotes.length) * 100) : 0,
      },
      studyStreak: {
        current: user.studyStreak,
        longest: user.longestStreak,
      },
      progressByCategory,
      dailyActivity,
      recentlyCompleted: completedNotes.slice(0, 5),
      pendingToComplete: pendingNotes.slice(0, 5),
    });
  } catch (error) {
    console.error('Get Study Progress Error:', error);
    res.status(500).json({ message: 'Failed to fetch study progress' });
  }
};

// ==================== GET RECENT ACTIVITY ====================
export const getRecentActivity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { limit = '10' } = req.query as { limit?: string };
    const limitNum = Math.min(parseInt(limit) || 10, 50);

    // Get recently accessed notes
    const recentlyAccessed = await Notes.find({ user: user._id, isLatestVersion: true })
      .sort({ lastAccessedAt: -1 })
      .limit(limitNum)
      .select('topic category tags lastAccessedAt accessCount isCompleted createdAt');

    // Get recently created notes
    const recentlyCreated = await Notes.find({ user: user._id, isLatestVersion: true })
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .select('topic category tags createdAt');

    // Get recently completed notes
    const recentlyCompleted = await Notes.find({
      user: user._id,
      isLatestVersion: true,
      isCompleted: true,
    })
      .sort({ completedAt: -1 })
      .limit(limitNum)
      .select('topic category completedAt');

    // Get most accessed notes
    const mostAccessed = await Notes.find({ user: user._id, isLatestVersion: true })
      .sort({ accessCount: -1 })
      .limit(5)
      .select('topic category accessCount');

    res.status(200).json({
      recentlyAccessed,
      recentlyCreated,
      recentlyCompleted,
      mostAccessed,
      lastActiveAt: user.lastActiveAt,
    });
  } catch (error) {
    console.error('Get Recent Activity Error:', error);
    res.status(500).json({ message: 'Failed to fetch recent activity' });
  }
};

// ==================== MARK TOPIC AS COMPLETED ====================
export const markTopicCompleted = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const note = await Notes.findOne({ _id: noteId, user: user._id });

    if (!note) {
      res.status(404).json({ message: 'Note not found' });
      return;
    }

    const wasCompleted = note.isCompleted;
    note.isCompleted = !note.isCompleted;

    if (note.isCompleted) {
      note.completedAt = new Date();
      user.completedTopics += 1;
    } else {
      note.completedAt = undefined;
      user.completedTopics = Math.max(0, user.completedTopics - 1);
    }

    await note.save();
    await user.save();

    res.status(200).json({
      message: note.isCompleted ? 'Topic marked as completed' : 'Topic marked as incomplete',
      isCompleted: note.isCompleted,
      completedAt: note.completedAt,
    });
  } catch (error) {
    console.error('Mark Topic Completed Error:', error);
    res.status(500).json({ message: 'Failed to update completion status' });
  }
};

// ==================== UPDATE STUDY STREAK (Helper function) ====================
export const updateStudyStreak = async (userId: mongoose.Types.ObjectId): Promise<void> => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActive = new Date(user.lastActiveAt);
    lastActive.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Same day, no update needed
      return;
    } else if (diffDays === 1) {
      // Consecutive day - increase streak
      user.studyStreak += 1;
      if (user.studyStreak > user.longestStreak) {
        user.longestStreak = user.studyStreak;
      }
    } else {
      // Streak broken - reset to 1
      user.studyStreak = 1;
    }

    user.lastActiveAt = new Date();
    await user.save();
  } catch (error) {
    console.error('Update Study Streak Error:', error);
  }
};

// ==================== TRACK NOTE ACCESS (Helper function) ====================
export const trackNoteAccess = async (
  noteId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId
): Promise<void> => {
  try {
    await Notes.findByIdAndUpdate(noteId, {
      lastAccessedAt: new Date(),
      $inc: { accessCount: 1 },
    });

    // Update user's last active
    await User.findByIdAndUpdate(userId, {
      lastActiveAt: new Date(),
    });
  } catch (error) {
    console.error('Track Note Access Error:', error);
  }
};
