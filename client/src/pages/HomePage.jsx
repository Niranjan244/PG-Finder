import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Loader2 } from 'lucide-react';
import { Navbar } from '../components/landing/Navbar.jsx';
import { Hero } from '../components/landing/Hero.jsx';
import { HowItWorks } from '../components/landing/HowItWorks.jsx';
import { ForOwners } from '../components/landing/ForOwners.jsx';
import { Footer } from '../components/landing/Footer.jsx';

export const HomePage = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Show a neutral loading state while session verification completes
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-theme-bg">
        <div className="flex items-center gap-2 text-xs text-theme-muted">
          <Loader2 className="h-5 w-5 animate-spin text-theme-brand" />
          <span>Loading platform...</span>
        </div>
      </div>
    );
  }

  // If already logged in, redirect directly to dashboard by role
  if (isAuthenticated && user) {
    if (user.role === 'admin') {
      return <Navigate to="/dashboard/admin" replace />;
    }
    if (user.role === 'owner') {
      return <Navigate to="/dashboard/owner" replace />;
    }
    return <Navigate to="/dashboard/tenant" replace />;
  }

  // Public Landing Page with Ambient Aura Glow Canvas (Matches Reference UI)
  return (
    <div className="min-h-screen flex flex-col bg-theme-bg text-theme-primary transition-colors relative overflow-hidden">
      {/* 
        Smooth Luminous Aurora Aura Glow
        - Warm amber-gold radial glow in center
        - Soft violet-indigo ambient glow on upper quadrant
      */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft upper violet glow */}
        <div className="absolute -top-24 right-1/4 w-[700px] h-[450px] bg-purple-500/12 dark:bg-purple-600/18 blur-[150px] rounded-full" />
        {/* Central warm amber light glow */}
        <div className="absolute top-56 left-1/2 -translate-x-1/2 w-[750px] h-[420px] bg-amber-400/18 dark:bg-amber-500/12 blur-[160px] rounded-full" />
        {/* Lower subtle glow */}
        <div className="absolute top-[900px] left-10 w-[500px] h-[350px] bg-indigo-500/8 dark:bg-indigo-500/12 blur-[140px] rounded-full" />
      </div>

      <Navbar />
      <main className="flex-1 relative z-10">
        <Hero />
        <HowItWorks />
        <ForOwners />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
