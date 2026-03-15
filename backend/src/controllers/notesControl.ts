import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/authMiddle.ts';
import Notes from '../models/notesModel.ts';

export const getMyNotes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const notes = await Notes.find({ user: user._id, isLatestVersion: true })
      .sort({ createdAt: -1 })
      .select(
        'topic classLevel examType revisionMode diagram isBookmarked category tags version createdAt updatedAt'
      );

    res.status(200).json({ notes });
  } catch (error) {
    console.error('Get My Notes Error:', error);
    res.status(500).json({ message: 'Failed to fetch notes' });
  }
};

export const getSingleNotes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { noteId } = req.params as { noteId: string };

    if (!noteId) {
      res.status(400).json({ message: 'Note ID is required' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(noteId)) {
      res.status(400).json({ message: 'Invalid note ID format' });
      return;
    }

    const note = await Notes.findOne({ _id: noteId, user: user._id });

    if (!note) {
      res.status(404).json({ message: 'Note not found' });
      return;
    }

    // Track note access for activity tracking
    note.lastAccessedAt = new Date();
    note.accessCount += 1;
    await note.save();

    // Update user's last active
    user.lastActiveAt = new Date();
    await user.save();

    res.status(200).json({ note });
  } catch (error) {
    console.error('Get Single Note Error:', error);
    res.status(500).json({ message: 'Failed to fetch note' });
  }
};

// ==================== DELETE NOTE ====================
export const deleteNote = async (req: AuthRequest, res: Response): Promise<void> => {
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

    // Delete all versions of this note (if it has versions)
    const parentId = note.parentNote || note._id;
    await Notes.deleteMany({
      $or: [{ _id: parentId }, { parentNote: parentId }],
      user: user._id,
    });

    // Remove note reference from user's notes array
    user.notes = user.notes.filter((id) => id.toString() !== noteId);
    await user.save();

    res.status(200).json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Delete Note Error:', error);
    res.status(500).json({ message: 'Failed to delete note' });
  }
};

// ==================== UPDATE/EDIT NOTE ====================
export const updateNote = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const { notes, topic, classLevel, examType, category, tags } = req.body;

    const existingNote = await Notes.findOne({ _id: noteId, user: user._id });

    if (!existingNote) {
      res.status(404).json({ message: 'Note not found' });
      return;
    }

    // Update allowed fields
    if (notes !== undefined) existingNote.notes = notes;
    if (topic !== undefined) existingNote.topic = topic;
    if (classLevel !== undefined) existingNote.classLevel = classLevel;
    if (examType !== undefined) existingNote.examType = examType;
    if (category !== undefined) existingNote.category = category;
    if (tags !== undefined) existingNote.tags = tags;

    await existingNote.save();

    res.status(200).json({ message: 'Note updated successfully', note: existingNote });
  } catch (error) {
    console.error('Update Note Error:', error);
    res.status(500).json({ message: 'Failed to update note' });
  }
};

// ==================== TOGGLE BOOKMARK ====================
export const toggleBookmark = async (req: AuthRequest, res: Response): Promise<void> => {
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

    note.isBookmarked = !note.isBookmarked;
    await note.save();

    res.status(200).json({
      message: note.isBookmarked ? 'Note bookmarked' : 'Bookmark removed',
      isBookmarked: note.isBookmarked,
    });
  } catch (error) {
    console.error('Toggle Bookmark Error:', error);
    res.status(500).json({ message: 'Failed to toggle bookmark' });
  }
};

// ==================== GET BOOKMARKED NOTES ====================
export const getBookmarkedNotes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const notes = await Notes.find({ user: user._id, isBookmarked: true, isLatestVersion: true })
      .sort({ updatedAt: -1 })
      .select('topic classLevel examType category tags createdAt updatedAt');

    res.status(200).json({ notes });
  } catch (error) {
    console.error('Get Bookmarked Notes Error:', error);
    res.status(500).json({ message: 'Failed to fetch bookmarked notes' });
  }
};

// ==================== SEARCH NOTES ====================
export const searchNotes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { query, category, tags } = req.query as {
      query?: string;
      category?: string;
      tags?: string;
    };

    // Build search filter
    const filter: Record<string, unknown> = { user: user._id, isLatestVersion: true };

    // Text search on topic and notes
    if (query && query.trim() !== '') {
      filter.$or = [
        { topic: { $regex: query, $options: 'i' } },
        { notes: { $regex: query, $options: 'i' } },
      ];
    }

    // Filter by category
    if (category && category.trim() !== '') {
      filter.category = category;
    }

    // Filter by tags (comma-separated)
    if (tags && tags.trim() !== '') {
      const tagArray = tags.split(',').map((t) => t.trim());
      filter.tags = { $in: tagArray };
    }

    const notes = await Notes.find(filter)
      .sort({ updatedAt: -1 })
      .select('topic classLevel examType isBookmarked category tags createdAt updatedAt');

    res.status(200).json({ notes, count: notes.length });
  } catch (error) {
    console.error('Search Notes Error:', error);
    res.status(500).json({ message: 'Failed to search notes' });
  }
};

// ==================== GET NOTES BY CATEGORY ====================
export const getNotesByCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { category } = req.params as { category: string };

    if (!category) {
      res.status(400).json({ message: 'Category is required' });
      return;
    }

    const notes = await Notes.find({ user: user._id, category, isLatestVersion: true })
      .sort({ updatedAt: -1 })
      .select('topic classLevel examType isBookmarked tags createdAt updatedAt');

    res.status(200).json({ notes, category });
  } catch (error) {
    console.error('Get Notes By Category Error:', error);
    res.status(500).json({ message: 'Failed to fetch notes by category' });
  }
};

// ==================== GET ALL CATEGORIES ====================
export const getAllCategories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const categories = await Notes.distinct('category', {
      user: user._id,
      category: { $ne: '' },
      isLatestVersion: true,
    });

    // Get count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const count = await Notes.countDocuments({
          user: user._id,
          category,
          isLatestVersion: true,
        });
        return { category, count };
      })
    );

    res.status(200).json({ categories: categoriesWithCount });
  } catch (error) {
    console.error('Get All Categories Error:', error);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
};

// ==================== UPDATE CATEGORY ====================
export const updateCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { noteId } = req.params as { noteId: string };
    const { category } = req.body as { category: string };

    if (!noteId || !mongoose.Types.ObjectId.isValid(noteId)) {
      res.status(400).json({ message: 'Invalid note ID' });
      return;
    }

    const note = await Notes.findOneAndUpdate(
      { _id: noteId, user: user._id },
      { category: category || '' },
      { new: true }
    );

    if (!note) {
      res.status(404).json({ message: 'Note not found' });
      return;
    }

    res.status(200).json({ message: 'Category updated', note });
  } catch (error) {
    console.error('Update Category Error:', error);
    res.status(500).json({ message: 'Failed to update category' });
  }
};

// ==================== ADD TAGS ====================
export const addTags = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { noteId } = req.params as { noteId: string };
    const { tags } = req.body as { tags: string[] };

    if (!noteId || !mongoose.Types.ObjectId.isValid(noteId)) {
      res.status(400).json({ message: 'Invalid note ID' });
      return;
    }

    if (!tags || !Array.isArray(tags)) {
      res.status(400).json({ message: 'Tags must be an array' });
      return;
    }

    const note = await Notes.findOne({ _id: noteId, user: user._id });

    if (!note) {
      res.status(404).json({ message: 'Note not found' });
      return;
    }

    // Add unique tags only
    const newTags = tags.filter((tag) => !note.tags.includes(tag));
    note.tags.push(...newTags);
    await note.save();

    res.status(200).json({ message: 'Tags added', tags: note.tags });
  } catch (error) {
    console.error('Add Tags Error:', error);
    res.status(500).json({ message: 'Failed to add tags' });
  }
};

// ==================== REMOVE TAG ====================
export const removeTag = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { noteId } = req.params as { noteId: string };
    const { tag } = req.body as { tag: string };

    if (!noteId || !mongoose.Types.ObjectId.isValid(noteId)) {
      res.status(400).json({ message: 'Invalid note ID' });
      return;
    }

    if (!tag) {
      res.status(400).json({ message: 'Tag is required' });
      return;
    }

    const note = await Notes.findOne({ _id: noteId, user: user._id });

    if (!note) {
      res.status(404).json({ message: 'Note not found' });
      return;
    }

    note.tags = note.tags.filter((t) => t !== tag);
    await note.save();

    res.status(200).json({ message: 'Tag removed', tags: note.tags });
  } catch (error) {
    console.error('Remove Tag Error:', error);
    res.status(500).json({ message: 'Failed to remove tag' });
  }
};

// ==================== GET ALL TAGS ====================
export const getAllTags = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const notes = await Notes.find({ user: user._id, isLatestVersion: true }).select('tags');

    // Flatten and get unique tags with count
    const tagCount: Record<string, number> = {};
    notes.forEach((note) => {
      note.tags.forEach((tag) => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });

    const tags = Object.entries(tagCount).map(([tag, count]) => ({ tag, count }));

    res.status(200).json({ tags });
  } catch (error) {
    console.error('Get All Tags Error:', error);
    res.status(500).json({ message: 'Failed to fetch tags' });
  }
};

// ==================== GET NOTES BY TAG ====================
export const getNotesByTag = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { tag } = req.params as { tag: string };

    if (!tag) {
      res.status(400).json({ message: 'Tag is required' });
      return;
    }

    const notes = await Notes.find({ user: user._id, tags: tag, isLatestVersion: true })
      .sort({ updatedAt: -1 })
      .select('topic classLevel examType isBookmarked category tags createdAt updatedAt');

    res.status(200).json({ notes, tag });
  } catch (error) {
    console.error('Get Notes By Tag Error:', error);
    res.status(500).json({ message: 'Failed to fetch notes by tag' });
  }
};

// ==================== CREATE NOTE VERSION ====================
export const createNoteVersion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { noteId } = req.params as { noteId: string };
    const { notes: newNotesContent } = req.body as { notes: string };

    if (!noteId || !mongoose.Types.ObjectId.isValid(noteId)) {
      res.status(400).json({ message: 'Invalid note ID' });
      return;
    }

    if (!newNotesContent) {
      res.status(400).json({ message: 'Notes content is required' });
      return;
    }

    const originalNote = await Notes.findOne({ _id: noteId, user: user._id });

    if (!originalNote) {
      res.status(404).json({ message: 'Note not found' });
      return;
    }

    // Mark current note as not latest
    originalNote.isLatestVersion = false;
    await originalNote.save();

    // Create new version
    const parentId = originalNote.parentNote || originalNote._id;
    const newVersion = new Notes({
      user: user._id,
      topic: originalNote.topic,
      classLevel: originalNote.classLevel,
      examType: originalNote.examType,
      revisionMode: originalNote.revisionMode,
      subTopics: originalNote.subTopics,
      importance: originalNote.importance,
      notes: newNotesContent,
      revisionPoints: originalNote.revisionPoints,
      questions: originalNote.questions,
      diagram: originalNote.diagram,
      charts: originalNote.charts,
      isBookmarked: originalNote.isBookmarked,
      category: originalNote.category,
      tags: originalNote.tags,
      version: originalNote.version + 1,
      parentNote: parentId,
      isLatestVersion: true,
    });

    await newVersion.save();

    res.status(201).json({
      message: 'New version created',
      note: newVersion,
      version: newVersion.version,
    });
  } catch (error) {
    console.error('Create Note Version Error:', error);
    res.status(500).json({ message: 'Failed to create note version' });
  }
};

// ==================== GET NOTE VERSIONS ====================
export const getNoteVersions = async (req: AuthRequest, res: Response): Promise<void> => {
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

    // Find parent note ID
    const parentId = note.parentNote || note._id;

    // Get all versions
    const versions = await Notes.find({
      user: user._id,
      $or: [{ _id: parentId }, { parentNote: parentId }],
    })
      .sort({ version: -1 })
      .select('topic version isLatestVersion notes createdAt updatedAt');

    res.status(200).json({ versions, currentVersion: note.version });
  } catch (error) {
    console.error('Get Note Versions Error:', error);
    res.status(500).json({ message: 'Failed to fetch note versions' });
  }
};

// ==================== RESTORE NOTE VERSION ====================
export const restoreNoteVersion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { noteId, versionId } = req.params as { noteId: string; versionId: string };

    if (!noteId || !mongoose.Types.ObjectId.isValid(noteId)) {
      res.status(400).json({ message: 'Invalid note ID' });
      return;
    }

    if (!versionId || !mongoose.Types.ObjectId.isValid(versionId)) {
      res.status(400).json({ message: 'Invalid version ID' });
      return;
    }

    const currentNote = await Notes.findOne({ _id: noteId, user: user._id });
    const versionToRestore = await Notes.findOne({ _id: versionId, user: user._id });

    if (!currentNote || !versionToRestore) {
      res.status(404).json({ message: 'Note or version not found' });
      return;
    }

    // Mark all versions as not latest
    const parentId = currentNote.parentNote || currentNote._id;
    await Notes.updateMany(
      { $or: [{ _id: parentId }, { parentNote: parentId }], user: user._id },
      { isLatestVersion: false }
    );

    // Create a new version with restored content
    const restoredNote = new Notes({
      user: user._id,
      topic: versionToRestore.topic,
      classLevel: versionToRestore.classLevel,
      examType: versionToRestore.examType,
      revisionMode: versionToRestore.revisionMode,
      subTopics: versionToRestore.subTopics,
      importance: versionToRestore.importance,
      notes: versionToRestore.notes,
      revisionPoints: versionToRestore.revisionPoints,
      questions: versionToRestore.questions,
      diagram: versionToRestore.diagram,
      charts: versionToRestore.charts,
      isBookmarked: currentNote.isBookmarked,
      category: currentNote.category,
      tags: currentNote.tags,
      version: currentNote.version + 1,
      parentNote: parentId as mongoose.Types.ObjectId,
      isLatestVersion: true,
    });

    await restoredNote.save();

    res.status(200).json({
      message: `Version ${versionToRestore.version} restored as new version ${restoredNote.version}`,
      note: restoredNote,
    });
  } catch (error) {
    console.error('Restore Note Version Error:', error);
    res.status(500).json({ message: 'Failed to restore note version' });
  }
};
