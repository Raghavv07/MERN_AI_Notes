import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bookmark,
  BookmarkCheck,
  Brain,
  CheckCircle,
  Circle,
  Clock,
  Eye,
  Filter,
  FolderOpen,
  Plus,
  Search,
  Tag,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { dashboardApi, notesApi } from '../../api';
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
import { formatRelativeTime, truncateText } from '../../lib/utils';
import type { Note } from '../../types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.9 },
};

export default function NotesListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const { data: notesData, isLoading } = useQuery({
    queryKey: ['notes'],
    queryFn: notesApi.getMyNotes,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: notesApi.getAllCategories,
  });

  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: notesApi.getAllTags,
  });

  const { data: searchResults } = useQuery({
    queryKey: ['notes-search', searchQuery],
    queryFn: () => notesApi.searchNotes(searchQuery),
    enabled: searchQuery.length > 2,
  });

  const toggleBookmarkMutation = useMutation({
    mutationFn: notesApi.toggleBookmark,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success('Bookmark updated!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: notesApi.deleteNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success('Note deleted!');
    },
  });

  const toggleCompleteMutation = useMutation({
    mutationFn: dashboardApi.markTopicCompleted,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success('Status updated!');
    },
  });

  if (isLoading) {
    return <LoadingScreen />;
  }

  const displayNotes =
    searchQuery.length > 2
      ? searchResults?.notes
      : selectedCategory
        ? notesData?.notes?.filter((n) => n.category === selectedCategory)
        : selectedTag
          ? notesData?.notes?.filter((n) => n.tags.includes(selectedTag))
          : notesData?.notes;

  const getExamTypeColor = (examType: string) => {
    const colors: Record<string, string> = {
      JEE: 'bg-blue-500',
      NEET: 'bg-green-500',
      GATE: 'bg-purple-500',
      UPSC: 'bg-orange-500',
      Board: 'bg-pink-500',
    };
    return colors[examType] || 'bg-gray-500';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Notes</h1>
          <p className="text-muted-foreground mt-1">
            {notesData?.notes?.length || 0} notes generated
          </p>
        </div>
        <Button onClick={() => navigate('/notes/create')}>
          <Plus className="w-4 h-4 mr-2" />
          Generate Notes
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCategory ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            <Filter className="w-4 h-4 mr-2" />
            All
          </Button>
          {categoriesData?.categories?.slice(0, 3).map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setSelectedCategory(cat);
                setSelectedTag(null);
              }}
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Tags */}
      {tagsData?.tags && tagsData.tags.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {tagsData.tags.slice(0, 8).map((tagItem) => (
            <Badge
              key={tagItem.tag}
              variant={selectedTag === tagItem.tag ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-primary/10 transition-colors"
              onClick={() => {
                setSelectedTag(tagItem.tag);
                setSelectedCategory(null);
              }}
            >
              <Tag className="w-3 h-3 mr-1" />
              {tagItem.tag} ({tagItem.count})
            </Badge>
          ))}
          {selectedTag && (
            <Badge
              variant="destructive"
              className="cursor-pointer"
              onClick={() => setSelectedTag(null)}
            >
              Clear
            </Badge>
          )}
        </div>
      )}

      {/* Notes Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <AnimatePresence>
          {displayNotes?.map((note: Note) => (
            <motion.div key={note._id} variants={cardVariants} exit="exit" layout>
              <Card className="h-full hover:shadow-lg transition-all duration-300 group overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`w-2 h-2 rounded-full ${getExamTypeColor(note.examType)}`}
                        />
                        <Badge variant="secondary" className="text-xs">
                          {note.examType}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {note.classLevel}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg line-clamp-2">{note.topic}</CardTitle>
                    </div>
                    <button
                      onClick={() => toggleBookmarkMutation.mutate(note._id)}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                      {note.isBookmarked ? (
                        <BookmarkCheck className="w-5 h-5 text-yellow-500" />
                      ) : (
                        <Bookmark className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {truncateText((note.content ?? '').replace(/[#*`]/g, ''), 150)}
                  </p>

                  {/* Tags */}
                  {note.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap mb-4">
                      {note.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Meta Info */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(note.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {note.accessCount} views
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleCompleteMutation.mutate(note._id)}
                      className="flex-1"
                    >
                      {note.isCompleted ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                          Done
                        </>
                      ) : (
                        <>
                          <Circle className="w-4 h-4 mr-2" />
                          Mark Done
                        </>
                      )}
                    </Button>
                    <Link to={`/notes/${note._id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </Link>
                    <Link to={`/notes/${note._id}/ai`}>
                      <Button variant="ghost" size="sm">
                        <Brain className="w-4 h-4 text-purple-500" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm('Delete this note?')) {
                          deleteMutation.mutate(note._id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty State */}
      {(!displayNotes || displayNotes.length === 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="w-20 h-20 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
            <BookmarkCheck className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No notes found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? 'Try a different search term' : 'Start generating AI-powered notes'}
          </p>
          <Button onClick={() => navigate('/notes/create')}>
            <Plus className="w-4 h-4 mr-2" />
            Generate Your First Note
          </Button>
        </motion.div>
      )}
    </div>
  );
}
