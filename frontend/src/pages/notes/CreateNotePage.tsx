import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Globe, GraduationCap, Sparkles } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { notesApi } from '../../api';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
} from '../../components/ui';

const createNoteSchema = z.object({
  topic: z.string().min(3, 'Topic must be at least 3 characters'),
  examType: z.string().min(1, 'Please select an exam type'),
  classLevel: z.string().min(1, 'Please select a class level'),
  language: z.string().min(1, 'Please select a language'),
});

type CreateNoteFormData = z.infer<typeof createNoteSchema>;

const examTypes = [
  { value: 'JEE', label: 'JEE (Main & Advanced)' },
  { value: 'NEET', label: 'NEET' },
  { value: 'GATE', label: 'GATE' },
  { value: 'UPSC', label: 'UPSC' },
  { value: 'Board', label: 'Board Exams' },
  { value: 'SSC', label: 'SSC' },
  { value: 'Banking', label: 'Banking' },
  { value: 'Other', label: 'Other' },
];

const classLevels = [
  { value: 'Class 10', label: 'Class 10' },
  { value: 'Class 11', label: 'Class 11' },
  { value: 'Class 12', label: 'Class 12' },
  { value: 'Undergraduate', label: 'Undergraduate' },
  { value: 'Postgraduate', label: 'Postgraduate' },
  { value: 'Professional', label: 'Professional' },
];

const languages = [
  { value: 'English', label: 'English' },
  { value: 'Hindi', label: 'Hindi (हिंदी)' },
  { value: 'Hinglish', label: 'Hinglish (Mix)' },
];

export default function CreateNotePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateNoteFormData>({
    resolver: zodResolver(createNoteSchema),
    defaultValues: {
      language: 'English',
    },
  });

  const generateMutation = useMutation({
    mutationFn: notesApi.generateNotes,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success('Notes generated successfully!');
      navigate(`/notes/${data.notes._id}`);
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to generate notes');
    },
  });

  const onSubmit = (data: CreateNoteFormData) => {
    generateMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <Button variant="ghost" className="mb-6" onClick={() => navigate('/notes')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Notes
        </Button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-0 shadow-2xl">
            <CardHeader className="text-center pb-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="mx-auto w-16 h-16 bg-linear-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center mb-4"
              >
                <Sparkles className="w-8 h-8 text-white" />
              </motion.div>
              <CardTitle className="text-2xl font-bold">Generate AI Notes</CardTitle>
              <CardDescription className="mt-2">
                Create comprehensive exam notes powered by AI
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Topic Input */}
                <div className="space-y-2">
                  <Label htmlFor="topic" className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Topic
                  </Label>
                  <Input
                    id="topic"
                    placeholder="e.g., Electromagnetic Induction, Chemical Bonding, Indian Constitution"
                    error={errors.topic?.message}
                    {...register('topic')}
                  />
                  <p className="text-xs text-muted-foreground">Be specific for better results</p>
                </div>

                {/* Exam Type */}
                <div className="space-y-2">
                  <Label htmlFor="examType" className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    Exam Type
                  </Label>
                  <Select
                    id="examType"
                    options={examTypes}
                    placeholder="Select exam type"
                    error={errors.examType?.message}
                    {...register('examType')}
                  />
                </div>

                {/* Class Level */}
                <div className="space-y-2">
                  <Label htmlFor="classLevel" className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    Class Level
                  </Label>
                  <Select
                    id="classLevel"
                    options={classLevels}
                    placeholder="Select class level"
                    error={errors.classLevel?.message}
                    {...register('classLevel')}
                  />
                </div>

                {/* Language */}
                <div className="space-y-2">
                  <Label htmlFor="language" className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Language
                  </Label>
                  <Select
                    id="language"
                    options={languages}
                    placeholder="Select language"
                    error={errors.language?.message}
                    {...register('language')}
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-12 text-lg"
                  isLoading={generateMutation.isPending}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  {generateMutation.isPending ? 'Generating Notes...' : 'Generate Notes'}
                </Button>
              </form>

              {/* Features List */}
              <div className="mt-8 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-3">What you'll get:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Comprehensive topic coverage
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Exam-focused key points
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Important formulas & concepts
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    PDF export available
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    AI Quiz & Flashcards generation
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
