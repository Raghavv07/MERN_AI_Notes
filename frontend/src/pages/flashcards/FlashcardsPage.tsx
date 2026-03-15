import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  Calendar,
  ChevronRight,
  GraduationCap,
  Layers,
  Play,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
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

export default function FlashcardsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['all-flashcards'],
    queryFn: aiApi.getAllFlashcardSets,
  });

  const deleteFlashcardsMutation = useMutation({
    mutationFn: (flashcardSetId: string) => aiApi.deleteFlashcardSet(flashcardSetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-flashcards'] });
      toast.success('Flashcard set deleted');
    },
    onError: () => {
      toast.error('Failed to delete flashcard set');
    },
  });

  if (isLoading) {
    return <LoadingScreen />;
  }

  const flashcardSets = data?.flashcardSets || [];
  const filteredSets = flashcardSets.filter((set) =>
    set.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate stats
  const totalSets = flashcardSets.length;
  const totalCards = flashcardSets.reduce((sum, set) => sum + set.totalCards, 0);
  const learnedCards = flashcardSets.reduce((sum, set) => sum + set.learnedCards, 0);
  const masteryPercentage = totalCards > 0 ? Math.round((learnedCards / totalCards) * 100) : 0;

  const getProgressColor = (learned: number, total: number) => {
    const percentage = (learned / total) * 100;
    if (percentage >= 80) return 'from-green-500 to-emerald-500';
    if (percentage >= 50) return 'from-yellow-500 to-orange-500';
    return 'from-blue-500 to-cyan-500';
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-blue-500/5 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-linear-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Layers className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-linear-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                My Flashcards
              </h1>
              <p className="text-muted-foreground mt-1">Master concepts with spaced repetition</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-linear-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Layers className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{totalSets}</p>
                    <p className="text-xs text-muted-foreground">Sets</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="bg-linear-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{totalCards}</p>
                    <p className="text-xs text-muted-foreground">Cards</p>
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
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{learnedCards}</p>
                    <p className="text-xs text-muted-foreground">Learned</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="bg-linear-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{masteryPercentage}%</p>
                    <p className="text-xs text-muted-foreground">Mastery</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search flashcard sets..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </motion.div>

        {/* Empty State */}
        {flashcardSets.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Layers className="w-12 h-12 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No flashcards yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create flashcard sets from your notes to learn with spaced repetition.
            </p>
            <Link to="/notes">
              <Button className="bg-linear-to-r from-blue-500 to-cyan-500">
                <GraduationCap className="w-4 h-4 mr-2" />
                Go to Notes
              </Button>
            </Link>
          </motion.div>
        )}

        {/* Flashcards Grid */}
        {filteredSets.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredSets.map((set, index) => (
                <motion.div
                  key={set._id}
                  variants={itemVariants}
                  exit="exit"
                  layout
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="group hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 h-full overflow-hidden">
                    {/* Animated gradient top bar */}
                    <div
                      className={`h-1.5 bg-linear-to-r ${getProgressColor(set.learnedCards, set.totalCards)}`}
                    />

                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                              {set.totalCards} cards
                            </Badge>
                          </div>
                          <CardTitle className="group-hover:text-blue-500 transition-colors line-clamp-2 text-lg">
                            {set.topic}
                          </CardTitle>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                          onClick={() => {
                            if (confirm('Delete this flashcard set?')) {
                              deleteFlashcardsMutation.mutate(set._id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Progress Display */}
                      <div className="bg-muted/50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-muted-foreground">Mastery Progress</span>
                          <span className="text-lg font-bold text-blue-500">
                            {Math.round((set.learnedCards / set.totalCards) * 100)}%
                          </span>
                        </div>
                        <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${(set.learnedCards / set.totalCards) * 100}%`,
                            }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className={`absolute inset-y-0 left-0 bg-linear-to-r ${getProgressColor(set.learnedCards, set.totalCards)} rounded-full`}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-green-500" />
                            {set.learnedCards} learned
                          </span>
                          <span>{set.totalCards - set.learnedCards} remaining</span>
                        </div>
                      </div>

                      {/* Meta Info */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Created {formatRelativeTime(set.createdAt)}
                        </span>
                        {set.lastReviewedAt && (
                          <span>Reviewed {formatRelativeTime(set.lastReviewedAt)}</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Link to={`/notes/${set.note}/ai`} className="flex-1">
                          <Button className="w-full bg-linear-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
                            <Play className="w-4 h-4 mr-2" />
                            {set.learnedCards > 0 ? 'Continue' : 'Start'}
                          </Button>
                        </Link>
                        <Link to={`/notes/${set.note}`}>
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
        {flashcardSets.length > 0 && filteredSets.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <XCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">
              No flashcard sets found for "{searchQuery}"
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
