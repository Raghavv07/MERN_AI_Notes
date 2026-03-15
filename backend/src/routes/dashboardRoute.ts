import express, { Router } from 'express';
import {
  getLeaderboard,
  getRecentActivity,
  getStudyProgress,
  getUserStats,
  markTopicCompleted,
} from '../controllers/dashboardControl.ts';
import { protectRoute } from '../middleware/authMiddle.ts';

const router: Router = express.Router();

// User Statistics
router.get('/stats', protectRoute, getUserStats);

// Study Progress
router.get('/progress', protectRoute, getStudyProgress);

// Recent Activity
router.get('/activity', protectRoute, getRecentActivity);

// Mark topic as completed/incomplete
router.patch('/complete/:noteId', protectRoute, markTopicCompleted);

// Leaderboard (query params: type=notes|streak|completed, limit=10)
router.get('/leaderboard', protectRoute, getLeaderboard);

export default router;
