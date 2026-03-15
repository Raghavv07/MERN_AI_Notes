import { buildPrompt } from '../utils/promptBuild.ts';

// Using gemini-2.5-flash model
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

interface PromptParams {
  topic: string;
  classLevel?: string;
  examType?: string;
  revisionMode: boolean;
  includeDiagram: boolean;
  includeChart: boolean;
}

interface ChartData {
  name: string;
  value: number;
}

interface Chart {
  type: 'bar' | 'line' | 'pie';
  title: string;
  data: ChartData[];
}

interface GeminiResponse {
  subTopics: {
    '⭐': string[];
    '⭐⭐': string[];
    '⭐⭐⭐': string[];
  };
  importance: '⭐' | '⭐⭐' | '⭐⭐⭐';
  notes: string;
  revisionPoints: string[];
  questions: {
    short: string[];
    long: string[];
    diagram: string;
  };
  diagram: {
    type: 'flowchart' | 'graph' | 'process';
    data: string;
  };
  charts: Chart[];
}

interface GeminiAPIResponse {
  candidates?: {
    content?: {
      parts?: {
        text?: string;
      }[];
    };
  }[];
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeout = 60000
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const generateGeminiResponse = async (
  params: PromptParams,
  maxRetries = 3
): Promise<GeminiResponse> => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined');
  }

  const prompt = buildPrompt(params);
  console.log('Generating notes for topic:', params.topic);

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt + 1}/${maxRetries} - Calling Gemini API...`);

      const response = await fetchWithTimeout(
        `${GEMINI_URL}?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 16384,
            },
          }),
        },
        60000 // 60 second timeout
      );

      console.log('Gemini API responded with status:', response.status);

      if (response.ok) {
        const data = (await response.json()) as GeminiAPIResponse;

        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textResponse) {
          throw new Error('No response from Gemini API');
        }

        // Clean the response - remove markdown code blocks if present
        const cleanedResponse = textResponse
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();

        try {
          const parsedResponse: GeminiResponse = JSON.parse(cleanedResponse);
          console.log('Successfully parsed Gemini response');
          return parsedResponse;
        } catch (error) {
          console.log('Failed to parse response:', cleanedResponse.substring(0, 200));
          throw new Error(`Failed to parse Gemini response: ${cleanedResponse}`);
        }
      }

      // Handle rate limit error (429)
      if (response.status === 429) {
        const errorData = await response.text();
        console.log('Rate limit error details:', errorData);

        // Check if it's a quota exhausted error (needs API key change)
        if (errorData.includes('RESOURCE_EXHAUSTED') || errorData.includes('quota')) {
          throw new Error(
            'API_QUOTA_EXHAUSTED: Gemini API quota exceeded. Please try again later or contact support.'
          );
        }

        const waitTime = Math.pow(2, attempt) * 5000; // 5s, 10s, 20s (reduced wait times)
        console.log(
          `Rate limited. Retrying in ${waitTime / 1000} seconds... (Attempt ${attempt + 1}/${maxRetries})`
        );
        await delay(waitTime);
        lastError = new Error(`Rate limit exceeded (attempt ${attempt + 1})`);
        continue;
      }

      // For other errors, throw with details
      const errorData = await response.text();
      console.log('Gemini API error response:', errorData);
      throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log(`Request timed out (Attempt ${attempt + 1}/${maxRetries})`);
        lastError = new Error('Request timed out');
        continue;
      }
      throw error;
    }
  }

  throw lastError || new Error('Max retries exceeded for Gemini API');
};

// ==================== QUIZ GENERATION ====================
interface QuizQuestion {
  question: string;
  options: { text: string; isCorrect: boolean }[];
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface QuizResponse {
  questions: QuizQuestion[];
}

export const generateQuiz = async (
  notesContent: string,
  topic: string,
  questionCount: number = 10
): Promise<QuizResponse> => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined');
  }

  const prompt = `You are a STRICT JSON generator for a quiz system.

⚠️ VERY IMPORTANT:
- Output MUST be valid JSON
- Your response will be parsed using JSON.parse()
- Use ONLY double quotes "
- NO comments, NO trailing commas
- Do NOT use emojis inside text values

TASK:
Generate ${questionCount} multiple choice questions (MCQs) based on the following notes.

TOPIC: ${topic}

NOTES CONTENT:
${notesContent}

RULES:
1. Questions should test understanding, not just memorization
2. Each question must have exactly 4 options
3. Only ONE option should be correct
4. Include a brief explanation for the correct answer
5. Mix difficulty levels: 30% easy, 50% medium, 20% hard
6. Questions should cover different aspects of the topic

STRICT JSON FORMAT:
{
  "questions": [
    {
      "question": "string",
      "options": [
        { "text": "option 1", "isCorrect": false },
        { "text": "option 2", "isCorrect": true },
        { "text": "option 3", "isCorrect": false },
        { "text": "option 4", "isCorrect": false }
      ],
      "explanation": "string explaining why the correct answer is right",
      "difficulty": "easy | medium | hard"
    }
  ]
}

RETURN ONLY VALID JSON.`;

  console.log('Generating quiz for topic:', topic);

  const response = await fetchWithTimeout(
    `${GEMINI_URL}?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
      }),
    },
    60000
  );

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
  }

  const data = (await response.json()) as GeminiAPIResponse;
  const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textResponse) {
    throw new Error('No response from Gemini API');
  }

  const cleanedResponse = textResponse
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  try {
    const parsedResponse: QuizResponse = JSON.parse(cleanedResponse);
    console.log('Successfully generated quiz with', parsedResponse.questions.length, 'questions');
    return parsedResponse;
  } catch {
    throw new Error('Failed to parse quiz response');
  }
};

// ==================== FLASHCARD GENERATION ====================
interface Flashcard {
  front: string;
  back: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface FlashcardResponse {
  cards: Flashcard[];
}

export const generateFlashcards = async (
  notesContent: string,
  topic: string,
  cardCount: number = 15
): Promise<FlashcardResponse> => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined');
  }

  const prompt = `You are a STRICT JSON generator for a flashcard system.

⚠️ VERY IMPORTANT:
- Output MUST be valid JSON
- Your response will be parsed using JSON.parse()
- Use ONLY double quotes "
- NO comments, NO trailing commas
- Do NOT use emojis inside text values

TASK:
Generate ${cardCount} flashcards for quick revision based on the following notes.

TOPIC: ${topic}

NOTES CONTENT:
${notesContent}

RULES:
1. Front side: Question or term (keep it short and clear)
2. Back side: Answer or definition (concise but complete)
3. Focus on key concepts, definitions, formulas, and important facts
4. Mix difficulty levels: 30% easy, 50% medium, 20% hard
5. Cards should cover all important aspects of the topic
6. Make cards suitable for spaced repetition learning

STRICT JSON FORMAT:
{
  "cards": [
    {
      "front": "What is...? / Define... / Formula for...",
      "back": "Clear and concise answer",
      "difficulty": "easy | medium | hard"
    }
  ]
}

RETURN ONLY VALID JSON.`;

  console.log('Generating flashcards for topic:', topic);

  const response = await fetchWithTimeout(
    `${GEMINI_URL}?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
      }),
    },
    60000
  );

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
  }

  const data = (await response.json()) as GeminiAPIResponse;
  const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textResponse) {
    throw new Error('No response from Gemini API');
  }

  const cleanedResponse = textResponse
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  try {
    const parsedResponse: FlashcardResponse = JSON.parse(cleanedResponse);
    console.log('Successfully generated', parsedResponse.cards.length, 'flashcards');
    return parsedResponse;
  } catch {
    throw new Error('Failed to parse flashcard response');
  }
};

// ==================== SUMMARY GENERATION ====================
interface SummaryResponse {
  summary: string;
  keyPoints: string[];
  quickFacts: string[];
}

export const generateSummary = async (
  notesContent: string,
  topic: string,
  maxWords: number = 200
): Promise<SummaryResponse> => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined');
  }

  const prompt = `You are a STRICT JSON generator for a summary system.

⚠️ VERY IMPORTANT:
- Output MUST be valid JSON
- Your response will be parsed using JSON.parse()
- Use ONLY double quotes "
- NO comments, NO trailing commas
- Escape line breaks using \\n
- Do NOT use emojis inside text values

TASK:
Generate a concise summary (max ${maxWords} words) of the following notes for quick revision.

TOPIC: ${topic}

NOTES CONTENT:
${notesContent}

RULES:
1. Summary should capture the essence of the topic
2. Use simple, exam-oriented language
3. Key points should be the most important takeaways
4. Quick facts are one-liner memorable points
5. Perfect for last-minute revision

STRICT JSON FORMAT:
{
  "summary": "A concise paragraph summarizing the entire topic in ${maxWords} words or less",
  "keyPoints": [
    "Key point 1",
    "Key point 2",
    "Key point 3",
    "Key point 4",
    "Key point 5"
  ],
  "quickFacts": [
    "One-liner fact 1",
    "One-liner fact 2",
    "One-liner fact 3"
  ]
}

RETURN ONLY VALID JSON.`;

  console.log('Generating summary for topic:', topic);

  const response = await fetchWithTimeout(
    `${GEMINI_URL}?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.5, maxOutputTokens: 4096 },
      }),
    },
    60000
  );

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
  }

  const data = (await response.json()) as GeminiAPIResponse;
  const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textResponse) {
    throw new Error('No response from Gemini API');
  }

  const cleanedResponse = textResponse
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  try {
    const parsedResponse: SummaryResponse = JSON.parse(cleanedResponse);
    console.log('Successfully generated summary');
    return parsedResponse;
  } catch {
    throw new Error('Failed to parse summary response');
  }
};
