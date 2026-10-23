import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  ArrowRight,
  Menu,
  X,
  Compass,
  Sparkles,
  MapPin,
  Calendar,
} from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle.jsx';

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const navigate = useNavigate();

  const handleScrollTo = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const POPULAR_CITIES = [
    'Bengaluru',
    'Delhi NCR',
    'Pune',
    'Mumbai',
    'Hyderabad',
    'Chennai',
    'Jaipur',
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-theme-border/60 bg-theme-surface/85 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Logo & Location Button */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2.5 focus:outline-hidden group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 via-indigo-600 to-violet-500 text-white shadow-xs group-hover:scale-105 transition-transform">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-lg font-black tracking-tight text-theme-primary leading-none">
                PG FINDER
              </span>
              <span className="text-[10px] text-theme-muted tracking-wide mt-0.5 font-medium">
                Verified Stays & Zero Brokerage
              </span>
            </div>
          </Link>

          {/* Quick Location Pin Picker Button */}
          <div className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setCityPickerOpen(!cityPickerOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-theme-border bg-theme-surface hover:bg-theme-surface-hover text-theme-secondary hover:text-theme-primary transition-all shadow-2xs"
              title="Select City"
            >
              <MapPin className="h-4 w-4 text-amber-500" />
            </button>

            {cityPickerOpen && (
              <div className="absolute top-11 left-0 z-50 w-48 rounded-xl border border-theme-border bg-theme-surface p-2 shadow-xl animate-in fade-in">
                <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-theme-muted block">
                  Top Cities
                </span>
                <div className="space-y-0.5 mt-1">
                  {POPULAR_CITIES.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => {
                        setCityPickerOpen(false);
                        navigate(`/search?city=${encodeURIComponent(city)}`);
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs font-semibold rounded-lg text-theme-secondary hover:bg-theme-brand-subtle hover:text-theme-brand transition-colors"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-theme-secondary">
          <Link
            to="/login"
            className="flex items-center gap-1.5 hover:text-theme-brand transition-colors"
          >
            <Calendar className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            <span>Explore PGs</span>
          </Link>
          <button
            type="button"
            onClick={() => handleScrollTo('for-owners')}
            className="flex items-center gap-1.5 hover:text-theme-brand transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>For PG Owners</span>
          </button>
        </nav>

        {/* Right: Actions (Theme Toggle, Sign In, Get Started) */}
        <div className="hidden sm:flex items-center gap-3">
          <ThemeToggle />

          <Link
            to="/login"
            className="text-xs font-semibold text-theme-secondary hover:text-theme-primary px-2 py-1.5 transition-colors"
          >
            Sign In
          </Link>

          <Link
            to="/register"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 px-4 py-2 text-xs font-bold text-white shadow-sm hover:shadow-md transition-all active:scale-98"
          >
            <span>Get Started</span>
          </Link>
        </div>

        {/* Mobile Hamburger & Theme Toggle */}
        <div className="flex sm:hidden items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-theme-border bg-theme-surface text-theme-secondary hover:text-theme-primary"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Collapsible Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-theme-border bg-theme-surface px-4 py-4 space-y-3">
          <nav className="flex flex-col gap-2.5 text-xs font-medium text-theme-secondary">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 py-1.5 hover:text-theme-primary"
            >
              <Calendar className="h-3.5 w-3.5 text-purple-600" />
              <span>Explore PGs</span>
            </Link>
            <button
              type="button"
              onClick={() => handleScrollTo('for-owners')}
              className="flex items-center gap-2 text-left py-1.5 hover:text-theme-primary"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>For PG Owners</span>
            </button>
          </nav>

          <div className="pt-3 border-t border-theme-border flex flex-col gap-2">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex items-center justify-center w-full rounded-xl border border-theme-border bg-theme-surface py-2 text-xs font-semibold text-theme-primary shadow-2xs"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex items-center justify-center w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-2.5 text-xs font-bold text-white shadow-xs"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
