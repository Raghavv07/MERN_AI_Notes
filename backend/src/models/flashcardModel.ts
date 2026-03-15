import mongoose, { Document, Schema } from 'mongoose';

interface ICard {
  front: string;
  back: string;
  difficulty: 'easy' | 'medium' | 'hard';
  lastReviewed?: Date;
  reviewCount: number;
  isLearned: boolean;
}

export interface IFlashcardSet extends Document {
  user: mongoose.Types.ObjectId;
  note: mongoose.Types.ObjectId;
  topic: string;
  cards: ICard[];
  totalCards: number;
  learnedCards: number;
  lastStudiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const cardSchema = new Schema<ICard>(
  {
    front: { type: String, required: true },
    back: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    lastReviewed: { type: Date, default: null },
    reviewCount: { type: Number, default: 0 },
    isLearned: { type: Boolean, default: false },
  },
  { _id: true }
);

const flashcardSetSchema: Schema<IFlashcardSet> = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    note: {
      type: Schema.Types.ObjectId,
      ref: 'Notes',
      required: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    cards: {
      type: [cardSchema],
      required: true,
    },
    totalCards: {
      type: Number,
      required: true,
    },
    learnedCards: {
      type: Number,
      default: 0,
    },
    lastStudiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

flashcardSetSchema.index({ user: 1, note: 1 });

const FlashcardSet = mongoose.model<IFlashcardSet>('FlashcardSet', flashcardSetSchema);

export default FlashcardSet;
