import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { ExploreSkillsPage } from './pages/ExploreSkillsPage';
import { SkillDetailPage } from './pages/SkillDetailPage';
import { ProviderProfilePage } from './pages/ProviderProfilePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import PreloaderDemo from './components/ui/demo';
import { MeetingRoomPage } from './pages/MeetingRoomPage';

// Learner Pages
import { LearnerDashboard } from './pages/learner/LearnerDashboard';
import { LearnerSessions } from './pages/learner/LearnerSessions';
import { LearnerCredits } from './pages/learner/LearnerCredits';
import { LearnerProfile } from './pages/learner/LearnerProfile';

// Provider Pages
import { ProviderDashboard } from './pages/provider/ProviderDashboard';
import { ProviderListings } from './pages/provider/ProviderListings';
import { ProviderAvailability } from './pages/provider/ProviderAvailability';
import { ProviderSessions } from './pages/provider/ProviderSessions';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminVerifications } from './pages/admin/AdminVerifications';
import { AdminLedger } from './pages/admin/AdminLedger';

const ProtectedRoute: React.FC<{ 
  children: React.ReactNode; 
  allowedRoles?: string[] 
}> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-950 text-stone-100 font-pixel gap-4">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent animate-spin" />
        <p className="text-xs text-amber-300 tracking-wider">LOADING ARCADE DATA...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !user.roles.includes('admin')) {
    const hasRole = user.roles.some((r) => allowedRoles.includes(r));
    if (!hasRole) {
      return <Navigate to="/learner/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

const DashboardRedirect: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.currentRole === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user?.currentRole === 'provider') return <Navigate to="/provider/dashboard" replace />;
  return <Navigate to="/learner/dashboard" replace />;
};

const AppRoutes: React.FC = () => {
  const location = useLocation();
  const isMeetingRoom = location.pathname.startsWith('/meet/');

  return (
    <div className="min-h-screen flex flex-col bg-stone-950 text-stone-100 font-sans">
      {!isMeetingRoom && <Navbar />}
      <main className="flex-1 bg-stone-950">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/explore" element={<ExploreSkillsPage />} />
          <Route path="/skills/:id" element={<SkillDetailPage />} />
          <Route path="/providers/:id" element={<ProviderProfilePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/preloader" element={<PreloaderDemo />} />
          <Route path="/dashboard" element={<DashboardRedirect />} />

          {/* In-App Live Meeting Room */}
          <Route 
            path="/meet/:ref" 
            element={
              <ProtectedRoute>
                <MeetingRoomPage />
              </ProtectedRoute>
            } 
          />

          {/* Learner Dashboard Routes */}
          <Route path="/learner/dashboard" element={<ProtectedRoute><LearnerDashboard /></ProtectedRoute>} />
          <Route path="/learner/sessions" element={<ProtectedRoute><LearnerSessions /></ProtectedRoute>} />
          <Route path="/learner/credits" element={<ProtectedRoute><LearnerCredits /></ProtectedRoute>} />
          <Route path="/learner/profile" element={<ProtectedRoute><LearnerProfile /></ProtectedRoute>} />

          {/* Provider Dashboard Routes */}
          <Route path="/provider/dashboard" element={<ProtectedRoute allowedRoles={['provider']}><ProviderDashboard /></ProtectedRoute>} />
          <Route path="/provider/listings" element={<ProtectedRoute allowedRoles={['provider']}><ProviderListings /></ProtectedRoute>} />
          <Route path="/provider/availability" element={<ProtectedRoute allowedRoles={['provider']}><ProviderAvailability /></ProtectedRoute>} />
          <Route path="/provider/sessions" element={<ProtectedRoute allowedRoles={['provider']}><ProviderSessions /></ProtectedRoute>} />

          {/* Admin Dashboard Routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/verifications" element={<ProtectedRoute allowedRoles={['admin']}><AdminVerifications /></ProtectedRoute>} />
          <Route path="/admin/ledger" element={<ProtectedRoute allowedRoles={['admin']}><AdminLedger /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isMeetingRoom && <Footer />}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};