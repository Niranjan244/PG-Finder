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

  // Public Landing Page with Ambient Background Canvas
  return (
    <div className="min-h-screen flex flex-col bg-theme-bg text-theme-primary transition-colors relative overflow-hidden selection:bg-brand-500 selection:text-white">
      {/* Global Architectural Grid Layer */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.45] dark:opacity-[0.25]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(148, 163, 184, 0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(148, 163, 184, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 90% 85% at 50% 15%, black 40%, transparent 95%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 85% at 50% 15%, black 40%, transparent 95%)',
        }}
      />

      {/* Layered Multi-Point Ambient Light Glows */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-brand-500/18 via-sky-500/10 to-transparent dark:from-brand-400/22 dark:via-sky-400/12 dark:to-transparent blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute top-[650px] left-10 w-[450px] h-[350px] bg-indigo-500/7 dark:bg-indigo-500/12 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-[1200px] right-10 w-[500px] h-[380px] bg-emerald-500/6 dark:bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />

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
