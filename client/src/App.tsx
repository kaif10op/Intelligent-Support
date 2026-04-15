import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from './store/useAuthStore.js';
import { ToastProvider } from './contexts/ToastContext';
import { SocketProvider } from './contexts/SocketContext';
import ErrorBoundary from './components/ErrorBoundary';
import ToastContainer from './components/ToastContainer';
import ConnectionStatus from './components/ConnectionStatus';
import './i18n/i18n'; // Initialize i18n

import Layout from './components/Layout';
import ChatLayout from './components/ChatLayout';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const KBDetails = lazy(() => import('./pages/KBDetails'));
const Chat = lazy(() => import('./pages/Chat'));
const Admin = lazy(() => import('./pages/Admin'));
const AdminPortal = lazy(() => import('./pages/AdminPortal'));
const AnalyticsDashboard = lazy(() => import('./pages/AnalyticsDashboard'));
const RecentChats = lazy(() => import('./pages/RecentChats'));
const KnowledgeBases = lazy(() => import('./pages/KnowledgeBases'));
const Settings = lazy(() => import('./pages/Settings'));
const Help = lazy(() => import('./pages/Help'));
const Tickets = lazy(() => import('./pages/Tickets'));
const TicketDetails = lazy(() => import('./pages/TicketDetails'));
const Search = lazy(() => import('./pages/Search'));
const SupportAgentDashboard = lazy(() => import('./pages/SupportAgentDashboard'));

const isAdminRole = (role?: string) => ['ADMIN', 'SUPER_ADMIN'].includes((role || '').toUpperCase());
const isSupportStaffRole = (role?: string) =>
  isAdminRole(role) || ['SUPPORT_AGENT', 'SUPPORT', 'AGENT'].includes((role || '').toUpperCase());

const LoadingScreen = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background text-muted-foreground">
    <Loader2 className="w-10 h-10 animate-spin text-primary" />
    <div className="text-sm font-medium">Loading workspace...</div>
  </div>
);

const ProtectedRoute = ({ children, adminOnly = false, supportAgentOnly = false }: { children: React.ReactNode, adminOnly?: boolean, supportAgentOnly?: boolean }) => {
  const { user, loading, initialized } = useAuthStore();

  if (loading || !initialized) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && !isAdminRole(user.role)) return <Navigate to="/" />;
  if (supportAgentOnly && !isSupportStaffRole(user.role)) return <Navigate to="/" />;

  return <>{children}</>;
};

// Role-based home redirect
const RoleBasedHome = () => {
  const { user, loading, initialized } = useAuthStore();

  if (loading || !initialized) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" />;

  if (isAdminRole(user.role)) return <Navigate to="/admin/dashboard" />;
  if (isSupportStaffRole(user.role)) return <Navigate to="/support-queue" />;
  return <Navigate to="/dashboard" />;
};




function App() {
  const { checkAuth, initialized, user } = useAuthStore();

  useEffect(() => {
    if (!initialized) {
      checkAuth();
    }
  }, [checkAuth, initialized]);

  return (
    <ErrorBoundary>
      <ToastProvider>
        <SocketProvider>
          <BrowserRouter>
            <ConnectionStatus />
            <ToastContainer />
            <Suspense fallback={<LoadingScreen />}>
            <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={<RoleBasedHome />} />

            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/kb/:id" element={
              <ProtectedRoute>
                <Layout><KBDetails /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/chat/:id" element={
              <ProtectedRoute>
                <ChatLayout><Chat /></ChatLayout>
              </ProtectedRoute>
            } />

            <Route path="/chats" element={
              <ProtectedRoute>
                <Layout><RecentChats /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/knowledge-bases" element={
              <ProtectedRoute>
                <Layout><KnowledgeBases /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/settings" element={
              <ProtectedRoute>
                <Layout><Settings /></Layout>
              </ProtectedRoute>
            } />

            <Route
              path="/help"
              element={user ? <Layout><Help /></Layout> : <Help />}
            />

            <Route path="/tickets" element={
              <ProtectedRoute>
                <Layout><Tickets /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/ticket/:id" element={
              <ProtectedRoute supportAgentOnly>
                <Layout><TicketDetails /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/admin" element={

              <ProtectedRoute adminOnly>
                <AdminPortal />
              </ProtectedRoute>
            } />

            <Route path="/admin/dashboard" element={
              <ProtectedRoute adminOnly>
                <Layout><Admin /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/analytics" element={
              <ProtectedRoute adminOnly>
                <Layout><AnalyticsDashboard /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/support-queue" element={
              <ProtectedRoute supportAgentOnly>
                <Layout><SupportAgentDashboard /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/search" element={
              <ProtectedRoute supportAgentOnly>
                <Layout><Search /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/preferences" element={
              <ProtectedRoute>
                <Navigate to="/settings" replace />
              </ProtectedRoute>
            } />

          </Routes>
            </Suspense>
          </BrowserRouter>
        </SocketProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}


export default App;
