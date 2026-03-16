import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { type Application, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import aiRoute from './routes/aiRoute.ts';
import authRoute from './routes/authRoute.ts';
import dashboardRoute from './routes/dashboardRoute.ts';
import generateRoute from './routes/generateRoute.ts';
import pdfRoute from './routes/pdfRoute.ts';
import connectDB from './utils/connectDB.ts';

dotenv.config({ debug: false });

const PORT: number = Number(process.env.PORT) || 5000;

// Rate limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per window
  message: { message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth rate limiter (more lenient for login/register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 auth requests per window
  message: { message: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 AI requests per window
  message: { message: 'Too many AI requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const app: Application = express();
app.use(express.json());
app.use(cookieParser());

// CORS configuration - allow explicit env origins + local dev + Render frontend aliases.
const configuredOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [
  ...configuredOrigins,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
].filter(Boolean);

const isAllowedRenderFrontend = (origin: string): boolean => {
  return /^https:\/\/notes-mern-frontend(?:-[a-z0-9-]+)?\.onrender\.com$/i.test(origin);
};

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || isAllowedRenderFrontend(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  })
);
app.use(generalLimiter);

app.use('/api/auth', authLimiter, authRoute);
app.use('/api/notes', generateRoute);
app.use('/api/pdf', pdfRoute);
app.use('/api/dashboard', dashboardRoute);
app.use('/api/ai', aiLimiter, aiRoute);

app.get('/', (req: Request, res: Response): void => {
  res.send('<h1>Server is up..</h1>');
});

app.listen(PORT, (): void => {
  connectDB();
  console.log(`Server is running on port:${PORT}`);
});
