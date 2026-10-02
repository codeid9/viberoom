import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-neutral-400 gap-3">
        <span className="w-6 h-6 border-2 border-neutral-700 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-xs">Verifying authorization...</span>
      </div>
    );
  }

  // If not logged in, go to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If logged in but not an admin, redirect away
  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};