import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  Building2,
  Users,
  BedDouble,
  GraduationCap,
  Briefcase,
} from 'lucide-react';

const CYCLING_WORDS = [
  'Community Stay.',
  'Student PG.',
  'Co-Living Space.',
  'Private Room.',
  'Hostel Bed.',
];

export const Hero = () => {
  const navigate = useNavigate();
  const [wordIndex, setWordIndex] = useState(0);
  const [fadeState, setFadeState] = useState(true);

  // Cycle italic headline words with smooth fade transition
  useEffect(() => {
    const interval = setInterval(() => {
      setFadeState(false);
      setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % CYCLING_WORDS.length);
        setFadeState(true);
      }, 250);
    }, 3200);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
      {/* 
        AURA GLOW BACKGROUND SYSTEM (Matches Uploaded Screenshot)
        - Center-bottom warm amber/golden light glow
        - Upper-right vibrant violet/purple ambient glow
      */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft upper violet glow */}
        <div className="absolute top-10 right-1/4 w-[500px] h-[350px] bg-purple-500/15 dark:bg-purple-600/20 blur-[130px] rounded-full" />
        {/* Central warm amber/golden radiant glow */}
        <div className="absolute top-48 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-amber-400/20 dark:bg-amber-500/12 blur-[140px] rounded-full" />
        {/* Subtle cyan-indigo fill */}
        <div className="absolute -top-10 left-1/4 w-[400px] h-[300px] bg-indigo-500/12 dark:bg-indigo-500/15 blur-[120px] rounded-full" />
      </div>

      <div className="relative mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8 text-center z-10">
        {/* Top Pill Tag */}
        <div className="inline-flex items-center gap-2 rounded-full border border-theme-border/80 bg-theme-surface/80 backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-theme-secondary shadow-2xs mb-8 transition-transform hover:scale-102">
          <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
          <span>Discover Verified PGs, Student Hostels & Co-Living Spaces</span>
        </div>

        {/* Hero Editorial Serif Headline */}
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-theme-primary leading-[1.12] max-w-4xl mx-auto">
          Find Your Next{' '}
          <span
            className={`italic font-serif bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-500 dark:from-purple-400 dark:via-indigo-300 dark:to-violet-400 bg-clip-text text-transparent transition-opacity duration-300 inline-block ${
              fadeState ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {CYCLING_WORDS[wordIndex]}
          </span>
        </h1>

        {/* Overview of PG Finder in exactly two clean lines */}
        <div className="mt-5 text-sm sm:text-base text-theme-secondary max-w-3xl mx-auto font-normal space-y-1">
          <p className="leading-snug">
            Find verified PG accommodations and modern co-living stays with zero broker fees.
          </p>
          <p className="leading-snug">
            Connect directly with owners, inspect live bed availability, and book your room online.
          </p>
        </div>

        {/* Primary Find PGs Action Button -> Direct to /login */}
        <div className="mt-10 flex items-center justify-center">
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-bold text-sm sm:text-base px-8 py-3.5 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 hover:scale-105 transition-all active:scale-98"
          >
            <span>Find PGs</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* 
          BROWSE BY CATEGORY SECTION (Matches Bottom of Screenshot)
        */}
        <div className="mt-16 pt-8 border-t border-theme-border/60">
          <span className="text-[11px] font-bold uppercase tracking-widest text-theme-muted block mb-4">
            Browse By Category
          </span>

          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {[
              {
                label: 'Boys Hostels',
                icon: Users,
                to: '/login',
              },
              {
                label: 'Girls Accommodations',
                icon: Users,
                to: '/login',
              },
              {
                label: 'Co-Living / Unisex',
                icon: Building2,
                to: '/login',
              },
              {
                label: 'Single Private Rooms',
                icon: BedDouble,
                to: '/login',
              },
              {
                label: 'Near Universities',
                icon: GraduationCap,
                to: '/login',
              },
              {
                label: 'Near Tech Parks',
                icon: Briefcase,
                to: '/login',
              },
            ].map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.label}
                  to={cat.to}
                  className="inline-flex items-center gap-2 rounded-full border border-theme-border bg-theme-surface/75 hover:bg-theme-surface hover:border-theme-brand/60 px-4 py-2 text-xs font-semibold text-theme-secondary hover:text-theme-primary transition-all shadow-2xs group"
                >
                  <Icon className="h-3.5 w-3.5 text-theme-muted group-hover:text-purple-600 transition-colors" />
                  <span>{cat.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
