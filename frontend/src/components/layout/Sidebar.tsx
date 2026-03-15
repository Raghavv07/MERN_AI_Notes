import { motion } from 'framer-motion';
import {
  Bookmark,
  BookOpen,
  Brain,
  ChevronLeft,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Plus,
  Sun,
  Trophy,
  User,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/notes', label: 'My Notes', icon: BookOpen },
  { path: '/notes/create', label: 'Generate Notes', icon: Plus },
  { path: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { path: '/quizzes', label: 'My Quizzes', icon: Brain },
  { path: '/flashcards', label: 'Flashcards', icon: Layers },
  { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { theme, setTheme } = useThemeStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-4 border-b">
        <Link
          to="/dashboard"
          className="flex items-center gap-3"
          onClick={() => setIsMobileOpen(false)}
        >
          <div className="w-10 h-10 bg-linear-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-bold text-xl"
            >
              NotesAI
            </motion.span>
          )}
        </Link>
      </div>

      {/* User Info */}
      {!isCollapsed && (
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user?.fullName}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t space-y-2">
        <button
          onClick={toggleTheme}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg w-full hover:bg-muted transition-colors',
            isCollapsed && 'justify-center'
          )}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          {!isCollapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg w-full hover:bg-destructive/10 text-destructive transition-colors',
            isCollapsed && 'justify-center'
          )}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Collapse Button (Desktop) */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-background border rounded-full items-center justify-center hover:bg-muted transition-colors"
      >
        <ChevronLeft className={cn('w-4 h-4 transition-transform', isCollapsed && 'rotate-180')} />
      </button>
    </>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background border-b z-40 flex items-center justify-between px-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-linear-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold">NotesAI</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 hover:bg-muted rounded-lg"
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: isMobileOpen ? 0 : '-100%' }}
        className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-background border-r z-50 flex flex-col"
      >
        {sidebarContent}
      </motion.aside>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex fixed left-0 top-0 bottom-0 bg-background border-r flex-col z-30 transition-all duration-300',
          isCollapsed ? 'w-20' : 'w-72'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
