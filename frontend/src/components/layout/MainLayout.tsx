import { Navigate, Outlet } from 'react-router-dom';
import { LoadingScreen } from '../../components/ui';
import { useAuthStore } from '../../stores/authStore';
import Sidebar from './Sidebar';

export default function MainLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:pl-72 pt-16 lg:pt-0 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
