import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  notes: mongoose.Types.ObjectId[];
  // Dashboard & Stats fields
  totalNotesGenerated: number;
  studyStreak: number;
  lastActiveAt: Date;
  longestStreak: number;
  completedTopics: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    notes: {
      type: [Schema.Types.ObjectId],
      ref: 'Notes',
      default: [],
    },
    // Dashboard & Stats fields
    totalNotesGenerated: {
      type: Number,
      default: 0,
    },
    studyStreak: {
      type: Number,
      default: 0,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    completedTopics: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model<IUser>('User', userSchema);

export default User;
