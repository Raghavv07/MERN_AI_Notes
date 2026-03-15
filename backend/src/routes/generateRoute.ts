import express, { Router } from 'express';

import { generateNotes } from '../controllers/generateControl.ts';
import {
  addTags,
  createNoteVersion,
  deleteNote,
  getAllCategories,
  getAllTags,
  getBookmarkedNotes,
  getMyNotes,
  getNotesByCategory,
  getNotesByTag,
  getNoteVersions,
  getSingleNotes,
  removeTag,
  restoreNoteVersion,
  searchNotes,
  toggleBookmark,
  updateCategory,
  updateNote,
} from '../controllers/notesControl.ts';
import { protectRoute } from '../middleware/authMiddle.ts';

const router: Router = express.Router();

// Generate notes
router.post('/generatenotes', protectRoute, generateNotes);

// Basic CRUD
router.get('/getnotes', protectRoute, getMyNotes);
router.get('/search', protectRoute, searchNotes);
router.get('/bookmarked', protectRoute, getBookmarkedNotes);

// Categories
router.get('/categories', protectRoute, getAllCategories);
router.get('/category/:category', protectRoute, getNotesByCategory);

// Tags
router.get('/tags', protectRoute, getAllTags);
router.get('/tag/:tag', protectRoute, getNotesByTag);

// Single note operations (must be after specific routes)
router.get('/:noteId', protectRoute, getSingleNotes);
router.put('/:noteId', protectRoute, updateNote);
router.delete('/:noteId', protectRoute, deleteNote);

// Bookmark
router.patch('/:noteId/bookmark', protectRoute, toggleBookmark);

// Category update
router.patch('/:noteId/category', protectRoute, updateCategory);

// Tags operations
router.post('/:noteId/tags', protectRoute, addTags);
router.delete('/:noteId/tags', protectRoute, removeTag);

// Versioning
router.get('/:noteId/versions', protectRoute, getNoteVersions);
router.post('/:noteId/versions', protectRoute, createNoteVersion);
router.post('/:noteId/versions/:versionId/restore', protectRoute, restoreNoteVersion);

export default router;
