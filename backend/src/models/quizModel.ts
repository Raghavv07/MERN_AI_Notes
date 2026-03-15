import mongoose, { Document, Schema } from 'mongoose';

interface IOption {
  text: string;
  isCorrect: boolean;
}

interface IQuestion {
  question: string;
  options: IOption[];
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface IQuiz extends Document {
  user: mongoose.Types.ObjectId;
  note: mongoose.Types.ObjectId;
  topic: string;
  questions: IQuestion[];
  totalQuestions: number;
  attemptedCount: number;
  bestScore: number;
  lastAttemptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const optionSchema = new Schema<IOption>(
  {
    text: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
  },
  { _id: false }
);

const questionSchema = new Schema<IQuestion>(
  {
    question: { type: String, required: true },
    options: { type: [optionSchema], required: true },
    explanation: { type: String, default: '' },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  },
  { _id: true }
);

const quizSchema: Schema<IQuiz> = new Schema(
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
    questions: {
      type: [questionSchema],
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    attemptedCount: {
      type: Number,
      default: 0,
    },
    bestScore: {
      type: Number,
      default: 0,
    },
    lastAttemptedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

quizSchema.index({ user: 1, note: 1 });

const Quiz = mongoose.model<IQuiz>('Quiz', quizSchema);

export default Quiz;
