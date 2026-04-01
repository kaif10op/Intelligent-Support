import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore.js';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ToastProvider } from './contexts/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import ToastContainer from './components/ToastContainer';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import KBDetails from './pages/KBDetails';
import Chat from './pages/Chat';
import Admin from './pages/Admin';
import RecentChats from './pages/RecentChats';
import KnowledgeBases from './pages/KnowledgeBases';
import Settings from './pages/Settings';
import Help from './pages/Help';
import Tickets from './pages/Tickets';
import Layout from './components/Layout';



const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) => {
  const { user, loading } = useAuthStore();

  if (loading) return <div className="loading-container">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/" />;

  return <>{children}</>;
};




function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <ErrorBoundary>
      <ToastProvider>
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
          <BrowserRouter>
            <ToastContainer />
            <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={
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
                <Layout><Chat /></Layout>
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

            <Route path="/help" element={
              <ProtectedRoute>
                <Layout><Help /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/tickets" element={
              <ProtectedRoute>
                <Layout><Tickets /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/admin" element={

              <ProtectedRoute adminOnly>
                <Layout><Admin /></Layout>
              </ProtectedRoute>
            } />

          </Routes>
        </BrowserRouter>
      </GoogleOAuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}


export default App;
