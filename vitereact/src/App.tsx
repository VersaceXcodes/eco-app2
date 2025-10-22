import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppStore } from '@/store/main';

// Import views
import GV_TopNav from '@/components/views/GV_TopNav';
import GV_Footer from '@/components/views/GV_Footer';
import GV_SideNav from '@/components/views/GV_SideNav';
import UV_Landing from '@/components/views/UV_Landing';
import UV_SignUp from '@/components/views/UV_SignUp';
import UV_Dashboard from '@/components/views/UV_Dashboard';
import UV_ActivityLog from '@/components/views/UV_ActivityLog';
import UV_ImpactDashboard from '@/components/views/UV_ImpactDashboard';
import UV_Challenges from '@/components/views/UV_Challenges';
import UV_Community from '@/components/views/UV_Community';
import UV_Education from '@/components/views/UV_Education';
import UV_IssueReport from '@/components/views/UV_IssueReport';
import UV_Profile from '@/components/views/UV_Profile';
import UV_Marketplace from '@/components/views/UV_Marketplace';
import UV_TermsOfService from '@/components/views/UV_TermsOfService';
import UV_PrivacyPolicy from '@/components/views/UV_PrivacyPolicy';
import UV_AuthFlow from '@/components/views/UV_AuthFlow';

// ProtectedRoute component (defined inline for completeness)
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAppStore(state => state.authentication_state.isAuthenticated);
  const isLoading = useAppStore(state => state.authentication_state.isLoading);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/sign-up" replace />;

  return <>{children}</>;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  const isAuthenticated = useAppStore(state => state.authentication_state.isAuthenticated);
  const isLoading = useAppStore(state => state.authentication_state.isLoading);

  useEffect(() => {
    // Initialize auth state (e.g., check for stored token)
    // This would typically call `checkAuth` from the store
  }, []);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;
  }

  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <div className="App min-h-screen flex flex-col">
          <GV_TopNav />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<UV_Landing />} />
              <Route path="/sign-up" element={<UV_SignUp />} />
              <Route path="/challenges" element={<UV_Challenges />} />
              <Route path="/community" element={<UV_Community />} />
              <Route path="/education" element={<UV_Education />} />
              <Route path="/issue-report" element={<UV_IssueReport />} />
              <Route path="/marketplace" element={<UV_Marketplace />} />
              <Route path="/terms" element={<UV_TermsOfService />} />
              <Route path="/privacy" element={<UV_PrivacyPolicy />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={<ProtectedRoute><UV_Dashboard /></ProtectedRoute>}
              />
              <Route
                path="/activity-log"
                element={<ProtectedRoute><UV_ActivityLog /></ProtectedRoute>}
              />
              <Route
                path="/impact-dashboard"
                element={<ProtectedRoute><UV_ImpactDashboard /></ProtectedRoute>}
              />
              <Route
                path="/profile"
                element={<ProtectedRoute><UV_Profile /></ProtectedRoute>}
              />

              {/* Catch-all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <GV_Footer />
        </div>
      </QueryClientProvider>
    </Router>
  );
};

export default App;