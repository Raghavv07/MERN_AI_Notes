import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Award,
  Brain,
  Calendar,
  CheckCircle,
  ChevronRight,
  ListChecks,
  Play,
  Search,
  Target,
  Trash2,
  Trophy,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { aiApi } from '../../api';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  LoadingScreen,
  Progress,
} from '../../components/ui';
import { formatRelativeTime } from '../../lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};

export default function QuizzesPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['all-quizzes'],
    queryFn: aiApi.getAllQuizzes,
  });

  const deleteQuizMutation = useMutation({
    mutationFn: (quizId: string) => aiApi.deleteQuiz(quizId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-quizzes'] });
      toast.success('Quiz deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete quiz');
    },
  });

  if (isLoading) {
    return <LoadingScreen />;
  }

  const quizzes = data?.quizzes || [];
  const filteredQuizzes = quizzes.filter((quiz) =>
    quiz.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate stats
  const totalQuizzes = quizzes.length;
  const completedQuizzes = quizzes.filter((q) => q.attemptedAt).length;
  const avgScore =
    quizzes.length > 0
      ? Math.round(
          quizzes.reduce((sum, q) => sum + (q.score || 0), 0) /
            quizzes.filter((q) => q.score !== undefined).length || 0
        )
      : 0;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-500/10 text-green-600 border-green-500/30';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30';
      case 'hard':
        return 'bg-red-500/10 text-red-600 border-red-500/30';
      default:
        return 'bg-blue-500/10 text-blue-600';
    }
  };

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return 'text-green-500';
    if (percentage >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-purple-500/5 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-linear-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-linear-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                My Quizzes
              </h1>
              <p className="text-muted-foreground mt-1">
                Test your knowledge and track your progress
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-linear-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <ListChecks className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalQuizzes}</p>
                    <p className="text-sm text-muted-foreground">Total Quizzes</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-linear-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{completedQuizzes}</p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-linear-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{avgScore}%</p>
                    <p className="text-sm text-muted-foreground">Avg. Score</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search quizzes by topic..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </motion.div>

        {/* Empty State */}
        {quizzes.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Brain className="w-12 h-12 text-purple-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No quizzes yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Generate quizzes from your notes to test your knowledge and track your progress.
            </p>
            <Link to="/notes">
              <Button className="bg-linear-to-r from-purple-500 to-pink-500">
                <Target className="w-4 h-4 mr-2" />
                Go to Notes
              </Button>
            </Link>
          </motion.div>
        )}

        {/* Quizzes Grid */}
        {filteredQuizzes.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredQuizzes.map((quiz, index) => (
                <motion.div
                  key={quiz._id}
                  variants={itemVariants}
                  exit="exit"
                  layout
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="group hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 h-full overflow-hidden">
                    {/* Gradient top bar */}
                    <div className="h-1.5 bg-linear-to-r from-purple-500 to-pink-500" />

                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getDifficultyColor(quiz.difficulty)}>
                              {quiz.difficulty}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {quiz.totalQuestions} Q
                            </Badge>
                          </div>
                          <CardTitle className="group-hover:text-purple-500 transition-colors line-clamp-2 text-lg">
                            {quiz.topic}
                          </CardTitle>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                          onClick={() => {
                            if (confirm('Delete this quiz?')) {
                              deleteQuizMutation.mutate(quiz._id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Score Display */}
                      {quiz.score !== undefined ? (
                        <div className="bg-muted/50 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Your Score</span>
                            <span
                              className={`text-2xl font-bold ${getScoreColor(quiz.score, quiz.totalQuestions)}`}
                            >
                              {Math.round((quiz.score / quiz.totalQuestions) * 100)}%
                            </span>
                          </div>
                          <Progress
                            value={(quiz.score / quiz.totalQuestions) * 100}
                            className="h-2"
                          />
                          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                            <span>
                              {quiz.score}/{quiz.totalQuestions} correct
                            </span>
                            {quiz.attemptedAt && (
                              <span>{formatRelativeTime(quiz.attemptedAt)}</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4 text-center">
                          <Award className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Not attempted yet</p>
                        </div>
                      )}

                      {/* Meta Info */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Created {formatRelativeTime(quiz.createdAt)}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Link to={`/notes/${quiz.note}/ai`} className="flex-1">
                          <Button className="w-full bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                            <Play className="w-4 h-4 mr-2" />
                            {quiz.score !== undefined ? 'Retake' : 'Start'}
                          </Button>
                        </Link>
                        <Link to={`/notes/${quiz.note}`}>
                          <Button variant="outline">
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* No search results */}
        {quizzes.length > 0 && filteredQuizzes.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <XCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">No quizzes found for "{searchQuery}"</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
