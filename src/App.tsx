import { Routes, Route, Navigate } from 'react-router-dom';
import { ResolutionApp } from './pages/ResolutionApp';
import { HubApp } from './pages/HubApp';
import { HubLogin } from './pages/HubLogin';
import { useAuthStore } from './stores/authStore';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-navy border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/hub/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* Customer-facing Resolution App */}
      <Route path="/" element={<ResolutionApp />} />

      {/* Admin Hub */}
      <Route path="/hub/login" element={<HubLogin />} />
      <Route
        path="/hub/*"
        element={
          <ProtectedRoute>
            <HubApp />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
