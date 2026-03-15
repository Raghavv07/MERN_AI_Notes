import express, { Router } from 'express';
import { getCurrentUser, logout, signin, signup } from '../controllers/authControl.ts';
import { protectRoute } from '../middleware/authMiddle.ts';

const router: Router = express.Router();

router.post('/signup', signup);
router.post('/signin', signin);
router.post('/logout', logout);
router.get('/me', protectRoute, getCurrentUser);

export default router;
