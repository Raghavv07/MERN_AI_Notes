import mongoose, { Document, Schema } from 'mongoose';

interface IChartData {
  name: string;
  value: number;
}

interface IChart {
  type: 'bar' | 'line' | 'pie';
  title: string;
  data: IChartData[];
}

interface ISubTopics {
  veryImportant: string[];
  important: string[];
  frequentlyAsked: string[];
}

interface IQuestions {
  short: string[];
  long: string[];
  diagram: string;
}

interface IDiagram {
  type: 'flowchart' | 'graph' | 'process';
  data: string;
}

export interface INotes extends Document {
  user: mongoose.Types.ObjectId;
  topic: string;
  classLevel?: string;
  examType?: string;
  revisionMode: boolean;
  subTopics: ISubTopics;
  importance: string;
  notes: string;
  revisionPoints: string[];
  questions: IQuestions;
  diagram: IDiagram;
  charts: IChart[];
  // New fields for enhanced features
  isBookmarked: boolean;
  category?: string;
  tags: string[];
  version: number;
  parentNote?: mongoose.Types.ObjectId;
  isLatestVersion: boolean;
  // Activity tracking fields
  lastAccessedAt: Date;
  accessCount: number;
  isCompleted: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const chartDataSchema = new Schema<IChartData>(
  {
    name: { type: String, required: true },
    value: { type: Number, required: true },
  },
  { _id: false }
);

const chartSchema = new Schema<IChart>(
  {
    type: { type: String, enum: ['bar', 'line', 'pie'], required: true },
    title: { type: String, required: true },
    data: { type: [chartDataSchema], default: [] },
  },
  { _id: false }
);

const notesSchema: Schema<INotes> = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    classLevel: {
      type: String,
      trim: true,
    },
    examType: {
      type: String,
      trim: true,
    },
    revisionMode: {
      type: Boolean,
      default: false,
    },
    subTopics: {
      veryImportant: { type: [String], default: [] },
      important: { type: [String], default: [] },
      frequentlyAsked: { type: [String], default: [] },
    },
    importance: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      required: true,
    },
    revisionPoints: {
      type: [String],
      default: [],
    },
    questions: {
      short: { type: [String], default: [] },
      long: { type: [String], default: [] },
      diagram: { type: String, default: '' },
    },
    diagram: {
      type: { type: String, enum: ['flowchart', 'graph', 'process'], default: 'flowchart' },
      data: { type: String, default: '' },
    },
    charts: {
      type: [chartSchema],
      default: [],
    },
    // New fields for enhanced features
    isBookmarked: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      trim: true,
      default: '',
    },
    tags: {
      type: [String],
      default: [],
    },
    version: {
      type: Number,
      default: 1,
    },
    parentNote: {
      type: Schema.Types.ObjectId,
      ref: 'Notes',
      default: null,
    },
    isLatestVersion: {
      type: Boolean,
      default: true,
    },
    // Activity tracking fields
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
    accessCount: {
      type: Number,
      default: 0,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster search
notesSchema.index({ topic: 'text', notes: 'text', tags: 1 });
notesSchema.index({ user: 1, category: 1 });
notesSchema.index({ user: 1, isBookmarked: 1 });

const Notes = mongoose.model<INotes>('Notes', notesSchema);

export default Notes;
