import express, { Router } from 'express';
import { pdfDownload } from '../controllers/pdfControl.ts';
import { protectRoute } from '../middleware/authMiddle.ts';

const router: Router = express.Router();

router.get('/download/:noteId', protectRoute, pdfDownload);

export default router;
