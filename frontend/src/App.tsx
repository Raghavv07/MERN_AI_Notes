import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MainLayout } from './components/layout';
import { LoadingScreen } from './components/ui';
import { useAuthStore } from './stores/authStore';
import { initializeTheme } from './stores/themeStore';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Main Pages
import AIToolsPage from './pages/ai/AIToolsPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import CreateNotePage from './pages/notes/CreateNotePage';
import NotesListPage from './pages/notes/NotesListPage';
import NoteViewPage from './pages/notes/NoteViewPage';

// Feature Pages
import BookmarksPage from './pages/bookmarks/BookmarksPage';
import FlashcardsPage from './pages/flashcards/FlashcardsPage';
import QuizzesPage from './pages/quizzes/QuizzesPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function AppRoutes() {
  const { checkAuth, isLoading, isAuthenticated } = useAuthStore();

  useEffect(() => {
    initializeTheme();
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
      />

      {/* Protected Routes */}
      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/notes" element={<NotesListPage />} />
        <Route path="/notes/create" element={<CreateNotePage />} />
        <Route path="/notes/:id" element={<NoteViewPage />} />
        <Route path="/notes/:id/ai" element={<AIToolsPage />} />
        <Route path="/bookmarks" element={<BookmarksPage />} />
        <Route path="/quizzes" element={<QuizzesPage />} />
        <Route path="/flashcards" element={<FlashcardsPage />} />
        <Route path="/leaderboard" element={<DashboardPage />} />
      </Route>

      {/* Default Redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'hsl(var(--card))',
              color: 'hsl(var(--card-foreground))',
              border: '1px solid hsl(var(--border))',
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: 'white',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: 'white',
              },
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
