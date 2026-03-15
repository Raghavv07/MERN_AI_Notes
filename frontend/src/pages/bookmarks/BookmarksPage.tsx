import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bookmark,
  BookmarkX,
  BookOpen,
  Calendar,
  Eye,
  FolderOpen,
  GraduationCap,
  Search,
  Star,
  Tag,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { notesApi } from '../../api';
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
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, x: -100 },
};

export default function BookmarksPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['bookmarked-notes'],
    queryFn: notesApi.getBookmarkedNotes,
  });

  const removeBookmarkMutation = useMutation({
    mutationFn: (noteId: string) => notesApi.toggleBookmark(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarked-notes'] });
      toast.success('Bookmark removed');
    },
  });

  if (isLoading) {
    return <LoadingScreen />;
  }

  const notes = data?.notes || [];
  const filteredNotes = notes.filter(
    (note) =>
      note.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.examType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-yellow-500/5 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-linear-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/25">
              <Bookmark className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-linear-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                Bookmarks
              </h1>
              <p className="text-muted-foreground mt-1">
                Your saved notes for quick access • {notes.length} bookmarked
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search bookmarks..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </motion.div>

        {/* Empty State */}
        {notes.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookmarkX className="w-12 h-12 text-yellow-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No bookmarks yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Start bookmarking your important notes to access them quickly from here.
            </p>
            <Link to="/notes">
              <Button>
                <BookOpen className="w-4 h-4 mr-2" />
                Browse Notes
              </Button>
            </Link>
          </motion.div>
        )}

        {/* Bookmarks Grid */}
        {filteredNotes.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredNotes.map((note, index) => (
                <motion.div
                  key={note._id}
                  variants={itemVariants}
                  exit="exit"
                  layout
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="group hover:shadow-xl hover:shadow-yellow-500/10 transition-all duration-300 border-yellow-500/20 overflow-hidden h-full">
                    {/* Gradient top bar */}
                    <div className="h-1 bg-linear-to-r from-yellow-400 to-orange-500" />

                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                              {note.examType}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {note.classLevel}
                            </Badge>
                          </div>
                          <CardTitle className="group-hover:text-yellow-500 transition-colors line-clamp-2">
                            {note.topic}
                          </CardTitle>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0 text-yellow-500 hover:text-red-500 hover:bg-red-500/10"
                          onClick={() => removeBookmarkMutation.mutate(note._id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Meta Info */}
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatRelativeTime(note.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          {note.accessCount} views
                        </span>
                        {note.category && (
                          <span className="flex items-center gap-1">
                            <FolderOpen className="w-3.5 h-3.5" />
                            {note.category}
                          </span>
                        )}
                      </div>

                      {/* Tags */}
                      {note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {note.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs bg-muted/50">
                              <Tag className="w-2.5 h-2.5 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                          {note.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{note.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Quick Stats */}
                      {note.isCompleted && (
                        <div className="flex items-center gap-2 text-green-500 text-sm">
                          <Star className="w-4 h-4 fill-current" />
                          <span>Completed</span>
                        </div>
                      )}

                      {/* View Button */}
                      <Link to={`/notes/${note._id}`} className="block">
                        <Button className="w-full mt-2 bg-linear-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">
                          <GraduationCap className="w-4 h-4 mr-2" />
                          Study Now
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* No search results */}
        {notes.length > 0 && filteredNotes.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">No bookmarks found for "{searchQuery}"</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
