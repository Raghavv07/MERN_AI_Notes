import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Brain,
  CheckCircle,
  Circle,
  Clock,
  Download,
  Eye,
  FolderOpen,
  GitBranch,
  History,
  Plus,
  RotateCcw,
  Save,
  Share2,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { dashboardApi, notesApi, pdfApi } from '../../api';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  LoadingScreen,
  Select,
} from '../../components/ui';
import { formatDate, formatRelativeTime } from '../../lib/utils';

const categoryOptions = [
  { value: '', label: 'No Category' },
  { value: 'Physics', label: 'Physics' },
  { value: 'Chemistry', label: 'Chemistry' },
  { value: 'Mathematics', label: 'Mathematics' },
  { value: 'Biology', label: 'Biology' },
  { value: 'History', label: 'History' },
  { value: 'Geography', label: 'Geography' },
  { value: 'Economics', label: 'Economics' },
  { value: 'Computer Science', label: 'Computer Science' },
  { value: 'English', label: 'English' },
  { value: 'Other', label: 'Other' },
];

export default function NoteViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [showVersionsModal, setShowVersionsModal] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['note', id],
    queryFn: () => notesApi.getNoteById(id!),
    enabled: !!id,
  });

  const { data: versionsData } = useQuery({
    queryKey: ['note-versions', id],
    queryFn: () => notesApi.getNoteVersions(id!),
    enabled: !!id && showVersionsModal,
  });

  // Mutations
  const toggleBookmarkMutation = useMutation({
    mutationFn: () => notesApi.toggleBookmark(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note', id] });
      toast.success('Bookmark updated!');
    },
  });

  const toggleCompleteMutation = useMutation({
    mutationFn: () => dashboardApi.markTopicCompleted(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note', id] });
      toast.success('Status updated!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => notesApi.deleteNote(id!),
    onSuccess: () => {
      toast.success('Note deleted!');
      navigate('/notes');
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: (category: string) => notesApi.updateCategory(id!, category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note', id] });
      setShowCategoryModal(false);
      toast.success('Category updated!');
    },
    onError: () => {
      toast.error('Failed to update category');
    },
  });

  const addTagsMutation = useMutation({
    mutationFn: (tags: string[]) => notesApi.addTags(id!, tags),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note', id] });
      setNewTag('');
      toast.success('Tag added!');
    },
    onError: () => {
      toast.error('Failed to add tag');
    },
  });

  const removeTagMutation = useMutation({
    mutationFn: (tag: string) => notesApi.removeTag(id!, tag),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note', id] });
      toast.success('Tag removed!');
    },
    onError: () => {
      toast.error('Failed to remove tag');
    },
  });

  const createVersionMutation = useMutation({
    mutationFn: () => notesApi.createNoteVersion(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note', id] });
      queryClient.invalidateQueries({ queryKey: ['note-versions', id] });
      toast.success('New version created!');
    },
    onError: () => {
      toast.error('Failed to create version');
    },
  });

  const restoreVersionMutation = useMutation({
    mutationFn: (versionId: string) => notesApi.revertToVersion(id!, versionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note', id] });
      queryClient.invalidateQueries({ queryKey: ['note-versions', id] });
      setShowVersionsModal(false);
      toast.success('Version restored!');
    },
    onError: () => {
      toast.error('Failed to restore version');
    },
  });

  const handleDownloadPdf = async () => {
    try {
      const blob = await pdfApi.downloadPdf(id!);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${note?.topic || 'notes'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('PDF downloaded!');
    } catch {
      toast.error('Failed to download PDF');
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !note?.tags.includes(newTag.trim())) {
      addTagsMutation.mutate([newTag.trim()]);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error || !data?.note) {
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

  const note = data.note;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => navigate('/notes')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Notes
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => toggleBookmarkMutation.mutate()}>
            {note.isBookmarked ? (
              <BookmarkCheck className="w-4 h-4 mr-2 text-yellow-500" />
            ) : (
              <Bookmark className="w-4 h-4 mr-2" />
            )}
            {note.isBookmarked ? 'Saved' : 'Save'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Link to={`/notes/${id}/ai`}>
            <Button variant="outline" size="sm">
              <Brain className="w-4 h-4 mr-2 text-purple-500" />
              AI Tools
            </Button>
          </Link>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header Card */}
        <Card className="mb-6 overflow-hidden">
          <div className="h-1 bg-linear-to-r from-primary to-purple-600" />
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge>{note.examType}</Badge>
                  <Badge variant="secondary">{note.classLevel}</Badge>
                  <Badge variant="outline">{note.language}</Badge>
                  {note.isCompleted && (
                    <Badge variant="success">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Completed
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl font-bold">{note.topic}</h1>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Meta Info */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Created {formatDate(note.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {note.accessCount} views
              </span>
              <button
                className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedCategory(note.category || '');
                  setShowCategoryModal(true);
                }}
              >
                <FolderOpen className="w-4 h-4" />
                {note.category || 'Add Category'}
                <Plus className="w-3 h-3 ml-1" />
              </button>
              <button
                className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
                onClick={() => setShowVersionsModal(true)}
              >
                <History className="w-4 h-4" />
                Version {note.version}
                <GitBranch className="w-3 h-3 ml-1" />
              </button>
            </div>

            {/* Tags Section */}
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <Tag className="w-4 h-4 text-muted-foreground" />
              {note.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="group cursor-pointer hover:bg-destructive/10"
                  onClick={() => {
                    if (confirm(`Remove tag "${tag}"?`)) {
                      removeTagMutation.mutate(tag);
                    }
                  }}
                >
                  {tag}
                  <X className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setShowTagsModal(true)}
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Tag
              </Button>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t">
              <Button variant="outline" onClick={() => toggleCompleteMutation.mutate()}>
                {note.isCompleted ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    Completed
                  </>
                ) : (
                  <>
                    <Circle className="w-4 h-4 mr-2" />
                    Mark Complete
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => createVersionMutation.mutate()}>
                <Save className="w-4 h-4 mr-2" />
                Save Version
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success('Link copied!');
                }}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this note?')) {
                    deleteMutation.mutate();
                  }
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Content Card */}
        <Card>
          <CardContent className="p-8">
            <article className="prose prose-slate dark:prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const inline = !match;
                    return !inline ? (
                      <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div">
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                  h1: ({ children }) => (
                    <h1 className="text-3xl font-bold mt-8 mb-4 text-foreground">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-2xl font-bold mt-6 mb-3 text-foreground border-b pb-2">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-xl font-semibold mt-4 mb-2 text-foreground">{children}</h3>
                  ),
                  p: ({ children }) => <p className="my-3 text-foreground leading-7">{children}</p>,
                  ul: ({ children }) => (
                    <ul className="my-3 list-disc list-inside space-y-1">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="my-3 list-decimal list-inside space-y-1">{children}</ol>
                  ),
                  li: ({ children }) => <li className="text-foreground">{children}</li>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-primary pl-4 my-4 italic text-muted-foreground">
                      {children}
                    </blockquote>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-bold text-foreground">{children}</strong>
                  ),
                }}
              >
                {note.content}
              </ReactMarkdown>
            </article>
          </CardContent>
        </Card>
      </motion.div>

      {/* Category Modal */}
      <AnimatePresence>
        {showCategoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCategoryModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-background rounded-xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-primary" />
                    Update Category
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select
                    options={categoryOptions}
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    placeholder="Select a category"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowCategoryModal(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => updateCategoryMutation.mutate(selectedCategory)}
                      isLoading={updateCategoryMutation.isPending}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tags Modal */}
      <AnimatePresence>
        {showTagsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowTagsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-background rounded-xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-primary" />
                    Manage Tags
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Current Tags */}
                  <div className="flex flex-wrap gap-2">
                    {note.tags.length === 0 && (
                      <p className="text-sm text-muted-foreground">No tags yet</p>
                    )}
                    {note.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="group cursor-pointer hover:bg-destructive/10"
                      >
                        {tag}
                        <button className="ml-1" onClick={() => removeTagMutation.mutate(tag)}>
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>

                  {/* Add New Tag */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter new tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddTag();
                        }
                      }}
                    />
                    <Button
                      onClick={handleAddTag}
                      disabled={!newTag.trim()}
                      isLoading={addTagsMutation.isPending}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowTagsModal(false)}
                  >
                    Done
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Versions Modal */}
      <AnimatePresence>
        {showVersionsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowVersionsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-background rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="border-0">
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5 text-primary" />
                    Version History
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 max-h-[60vh] overflow-y-auto">
                  {versionsData?.versions && versionsData.versions.length > 0 ? (
                    <div className="divide-y">
                      {versionsData.versions.map((version) => (
                        <div key={version._id} className="p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <GitBranch className="w-4 h-4 text-primary" />
                              <span className="font-medium">Version {version.version}</span>
                              {version.isLatestVersion && (
                                <Badge variant="success" className="text-xs">
                                  Current
                                </Badge>
                              )}
                            </div>
                            {!version.isLatestVersion && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => restoreVersionMutation.mutate(version._id)}
                                isLoading={restoreVersionMutation.isPending}
                              >
                                <RotateCcw className="w-3 h-3 mr-1" />
                                Restore
                              </Button>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <span>{formatRelativeTime(version.createdAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No previous versions</p>
                    </div>
                  )}
                </CardContent>
                <div className="p-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowVersionsModal(false)}
                  >
                    Close
                  </Button>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
