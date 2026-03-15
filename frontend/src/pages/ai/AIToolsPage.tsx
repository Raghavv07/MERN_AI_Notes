import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Brain,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Layers,
  ListChecks,
  RotateCcw,
  Target,
  Trophy,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { aiApi, notesApi } from '../../api';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  LoadingScreen,
  Progress,
  Select,
} from '../../components/ui';
import type { FlashcardSet, Quiz } from '../../types';

type Tab = 'quiz' | 'flashcards' | 'summary';

export default function AIToolsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('quiz');

  const { data: noteData, isLoading: noteLoading } = useQuery({
    queryKey: ['note', id],
    queryFn: () => notesApi.getNoteById(id!),
    enabled: !!id,
  });

  if (noteLoading) {
    return <LoadingScreen />;
  }

  const note = noteData?.note;

  if (!note) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold mb-4">Note not found</h2>
        <Button onClick={() => navigate('/notes')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Notes
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: 'quiz' as Tab, label: 'Quiz', icon: ListChecks },
    { id: 'flashcards' as Tab, label: 'Flashcards', icon: Layers },
    { id: 'summary' as Tab, label: 'Summary', icon: FileText },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => navigate(`/notes/${id}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Note
        </Button>
      </div>

      {/* Note Title */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="w-8 h-8 text-purple-500" />
          <h1 className="text-2xl font-bold">AI Study Tools</h1>
        </div>
        <p className="text-muted-foreground">{note.topic}</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 p-1 bg-muted rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md transition-all ${
              activeTab === tab.id ? 'bg-background shadow-sm' : 'hover:bg-background/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'quiz' && <QuizTab noteId={id!} />}
        {activeTab === 'flashcards' && <FlashcardsTab noteId={id!} />}
        {activeTab === 'summary' && <SummaryTab noteId={id!} />}
      </AnimatePresence>
    </div>
  );
}

// ==================== QUIZ TAB ====================
function QuizTab({ noteId }: { noteId: string }) {
  const queryClient = useQueryClient();
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [quizResults, setQuizResults] = useState<{
    score: number;
    percentage: number;
    results: { isCorrect: boolean; explanation: string }[];
  } | null>(null);

  const { data: quizzesData } = useQuery({
    queryKey: ['quizzes', noteId],
    queryFn: () => aiApi.getQuizzesByNote(noteId),
  });

  const createQuizMutation = useMutation({
    mutationFn: () => aiApi.createQuiz(noteId, difficulty),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quizzes', noteId] });
      setCurrentQuiz(data.quiz);
      setCurrentQuestion(0);
      setSelectedAnswers([]);
      setShowResults(false);
      setQuizResults(null);
      toast.success('Quiz generated!');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to generate quiz');
    },
  });

  const submitQuizMutation = useMutation({
    mutationFn: () =>
      aiApi.submitQuizAttempt(currentQuiz!._id, {
        answers: selectedAnswers,
        timeSpent: 0,
      }),
    onSuccess: (data) => {
      setQuizResults({
        score: data.score,
        percentage: data.percentage,
        results: data.results,
      });
      setShowResults(true);
      toast.success(`Quiz completed! Score: ${data.percentage}%`);
    },
  });

  const handleSelectAnswer = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  if (showResults && quizResults && currentQuiz) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Trophy className="w-10 h-10 text-yellow-500" />
            </div>
            <CardTitle className="text-3xl">
              {quizResults.percentage >= 70 ? 'Great Job! 🎉' : 'Keep Practicing! 💪'}
            </CardTitle>
            <CardDescription>
              You scored {quizResults.score} out of {currentQuiz.totalQuestions}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <p className="text-5xl font-bold text-primary">{quizResults.percentage}%</p>
            </div>

            <div className="space-y-4 mb-6">
              {currentQuiz.questions.map((q, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    quizResults.results[index]?.isCorrect ? 'bg-green-500/10' : 'bg-red-500/10'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {quizResults.results[index]?.isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{q.question}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {quizResults.results[index]?.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              className="w-full"
              onClick={() => {
                setCurrentQuiz(null);
                setShowResults(false);
                setQuizResults(null);
              }}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Another Quiz
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (currentQuiz) {
    const question = currentQuiz.questions[currentQuestion];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="outline">
                Question {currentQuestion + 1} of {currentQuiz.totalQuestions}
              </Badge>
              <Badge>{currentQuiz.difficulty}</Badge>
            </div>
            <Progress
              value={((currentQuestion + 1) / currentQuiz.totalQuestions) * 100}
              className="mt-4"
            />
          </CardHeader>
          <CardContent>
            <h3 className="text-xl font-semibold mb-6">{question.question}</h3>

            <div className="space-y-3 mb-6">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectAnswer(index)}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                    selectedAnswers[currentQuestion] === index
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                  {option}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestion === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              {currentQuestion === currentQuiz.totalQuestions - 1 ? (
                <Button
                  className="flex-1"
                  onClick={() => submitQuizMutation.mutate()}
                  disabled={selectedAnswers.length !== currentQuiz.totalQuestions}
                  isLoading={submitQuizMutation.isPending}
                >
                  <Target className="w-4 h-4 mr-2" />
                  Submit Quiz
                </Button>
              ) : (
                <Button
                  className="flex-1"
                  onClick={() => setCurrentQuestion((prev) => prev + 1)}
                  disabled={selectedAnswers[currentQuestion] === undefined}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="w-5 h-5" />
            Generate Quiz
          </CardTitle>
          <CardDescription>Test your knowledge with AI-generated questions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Difficulty Level</label>
            <Select
              options={[
                { value: 'easy', label: 'Easy' },
                { value: 'medium', label: 'Medium' },
                { value: 'hard', label: 'Hard' },
              ]}
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
            />
          </div>

          <Button
            className="w-full"
            onClick={() => createQuizMutation.mutate()}
            isLoading={createQuizMutation.isPending}
          >
            <ListChecks className="w-4 h-4 mr-2" />
            Generate Quiz
          </Button>

          {quizzesData?.quizzes && quizzesData.quizzes.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">Previous Quizzes</h4>
              <div className="space-y-2">
                {quizzesData.quizzes.slice(0, 3).map((quiz) => (
                  <button
                    key={quiz._id}
                    onClick={() => {
                      setCurrentQuiz(quiz);
                      setCurrentQuestion(0);
                      setSelectedAnswers([]);
                    }}
                    className="w-full p-3 text-left rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {quiz.difficulty} Quiz • {quiz.totalQuestions} questions
                      </span>
                      {quiz.score !== undefined && (
                        <Badge variant="secondary">
                          Score: {Math.round((quiz.score / quiz.totalQuestions) * 100)}%
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ==================== FLASHCARDS TAB ====================
function FlashcardsTab({ noteId }: { noteId: string }) {
  const queryClient = useQueryClient();
  const [currentSet, setCurrentSet] = useState<FlashcardSet | null>(null);
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const { data: flashcardsData } = useQuery({
    queryKey: ['flashcards', noteId],
    queryFn: () => aiApi.getFlashcardsByNote(noteId),
  });

  const createFlashcardsMutation = useMutation({
    mutationFn: () => aiApi.createFlashcards(noteId, 10),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['flashcards', noteId] });
      setCurrentSet(data.flashcardSet);
      setCurrentCard(0);
      setIsFlipped(false);
      toast.success('Flashcards generated!');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to generate flashcards');
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: (isLearned: boolean) =>
      aiApi.updateFlashcardProgress(currentSet!._id, currentSet!.cards[currentCard]._id, isLearned),
    onSuccess: (data) => {
      setCurrentSet(data.flashcardSet);
    },
  });

  if (currentSet) {
    const card = currentSet.cards[currentCard];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="outline">
                Card {currentCard + 1} of {currentSet.totalCards}
              </Badge>
              <Badge variant="success">{currentSet.learnedCards} learned</Badge>
            </div>
            <Progress
              value={(currentSet.learnedCards / currentSet.totalCards) * 100}
              className="mt-4"
            />
          </CardHeader>
          <CardContent>
            <div
              className="relative h-64 cursor-pointer perspective-1000"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <motion.div
                className="absolute inset-0 w-full h-full"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6 }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Front */}
                <div
                  className="absolute inset-0 w-full h-full bg-linear-to-br from-primary/10 to-purple-500/10 rounded-xl flex items-center justify-center p-6 backface-hidden"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <p className="text-xl font-medium text-center">{card.front}</p>
                </div>
                {/* Back */}
                <div
                  className="absolute inset-0 w-full h-full bg-linear-to-br from-green-500/10 to-blue-500/10 rounded-xl flex items-center justify-center p-6"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                >
                  <p className="text-xl font-medium text-center">{card.back}</p>
                </div>
              </motion.div>
            </div>

            <p className="text-center text-sm text-muted-foreground my-4">Click card to flip</p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  updateProgressMutation.mutate(false);
                  if (currentCard < currentSet.totalCards - 1) {
                    setCurrentCard((prev) => prev + 1);
                    setIsFlipped(false);
                  }
                }}
              >
                <XCircle className="w-4 h-4 mr-2 text-red-500" />
                Still Learning
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  updateProgressMutation.mutate(true);
                  if (currentCard < currentSet.totalCards - 1) {
                    setCurrentCard((prev) => prev + 1);
                    setIsFlipped(false);
                  }
                }}
              >
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                Got It!
              </Button>
            </div>

            <div className="flex justify-between mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCurrentCard((prev) => Math.max(0, prev - 1));
                  setIsFlipped(false);
                }}
                disabled={currentCard === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCurrentSet(null);
                  setCurrentCard(0);
                }}
              >
                Exit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCurrentCard((prev) => Math.min(currentSet.totalCards - 1, prev + 1));
                  setIsFlipped(false);
                }}
                disabled={currentCard === currentSet.totalCards - 1}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Generate Flashcards
          </CardTitle>
          <CardDescription>Create interactive flashcards for efficient revision</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button
            className="w-full"
            onClick={() => createFlashcardsMutation.mutate()}
            isLoading={createFlashcardsMutation.isPending}
          >
            <Layers className="w-4 h-4 mr-2" />
            Generate Flashcards
          </Button>

          {flashcardsData?.flashcardSets && flashcardsData.flashcardSets.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">Previous Flashcard Sets</h4>
              <div className="space-y-2">
                {flashcardsData.flashcardSets.map((set) => (
                  <button
                    key={set._id}
                    onClick={() => {
                      setCurrentSet(set);
                      setCurrentCard(0);
                      setIsFlipped(false);
                    }}
                    className="w-full p-3 text-left rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{set.totalCards} Cards</span>
                      <Badge variant="secondary">
                        {set.learnedCards}/{set.totalCards} learned
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ==================== SUMMARY TAB ====================
function SummaryTab({ noteId }: { noteId: string }) {
  const [length, setLength] = useState<'short' | 'medium' | 'detailed'>('medium');
  const [summary, setSummary] = useState<string | null>(null);

  const createSummaryMutation = useMutation({
    mutationFn: () => aiApi.createSummary(noteId, length),
    onSuccess: (data) => {
      setSummary(data.summary);
      toast.success('Summary generated!');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to generate summary');
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Generate Summary
          </CardTitle>
          <CardDescription>Get a concise summary of your notes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!summary ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Summary Length</label>
                <Select
                  options={[
                    { value: 'short', label: 'Short (Key points only)' },
                    { value: 'medium', label: 'Medium (Balanced)' },
                    { value: 'detailed', label: 'Detailed (Comprehensive)' },
                  ]}
                  value={length}
                  onChange={(e) => setLength(e.target.value as 'short' | 'medium' | 'detailed')}
                />
              </div>

              <Button
                className="w-full"
                onClick={() => createSummaryMutation.mutate()}
                isLoading={createSummaryMutation.isPending}
              >
                <FileText className="w-4 h-4 mr-2" />
                Generate Summary
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="whitespace-pre-wrap">{summary}</p>
              </div>
              <Button variant="outline" className="w-full" onClick={() => setSummary(null)}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Generate Another
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
