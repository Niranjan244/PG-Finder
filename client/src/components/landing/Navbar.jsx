import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, ArrowRight, Menu, X } from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle.jsx';

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleScrollTo = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-theme-border bg-theme-surface/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-brand rounded-lg"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-theme-brand text-white shadow-xs">
            <Building2 className="h-5 w-5" />
          </div>
          <span className="text-base font-bold tracking-tight">PG Finder</span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-theme-secondary">
          <button
            type="button"
            onClick={() => handleScrollTo('how-it-works')}
            className="hover:text-theme-primary transition-colors focus:outline-none focus:ring-1 focus:ring-theme-brand rounded"
          >
            How it works
          </button>
          <button
            type="button"
            onClick={() => handleScrollTo('for-owners')}
            className="hover:text-theme-primary transition-colors focus:outline-none focus:ring-1 focus:ring-theme-brand rounded"
          >
            For owners
          </button>
          <button
            type="button"
            onClick={() => handleScrollTo('contact')}
            className="hover:text-theme-primary transition-colors focus:outline-none focus:ring-1 focus:ring-theme-brand rounded"
          >
            Contact
          </button>
        </nav>

        {/* Desktop Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />

          <Link
            to="/register"
            className="rounded-lg px-3 py-2 text-xs font-semibold text-theme-secondary hover:text-theme-primary transition-colors focus:outline-none focus:ring-2 focus:ring-theme-brand"
          >
            Register
          </Link>

          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 rounded-lg bg-theme-brand px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-theme-brand-hover transition-colors focus:outline-none focus:ring-2 focus:ring-theme-brand focus:ring-offset-2"
          >
            <span>Sign in</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Mobile Hamburger & Theme Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-theme-border bg-theme-surface text-theme-secondary hover:text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-brand"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Collapsible Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-theme-border bg-theme-surface px-4 py-4 space-y-3">
          <nav className="flex flex-col gap-2.5 text-xs font-medium text-theme-secondary">
            <button
              type="button"
              onClick={() => handleScrollTo('how-it-works')}
              className="text-left py-1.5 hover:text-theme-primary"
            >
              How it works
            </button>
            <button
              type="button"
              onClick={() => handleScrollTo('for-owners')}
              className="text-left py-1.5 hover:text-theme-primary"
            >
              For owners
            </button>
            <button
              type="button"
              onClick={() => handleScrollTo('contact')}
              className="text-left py-1.5 hover:text-theme-primary"
            >
              Contact
            </button>
          </nav>

          <div className="pt-3 border-t border-theme-border flex flex-col gap-2">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex items-center justify-center gap-1.5 w-full rounded-lg bg-theme-brand py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-theme-brand-hover"
            >
              <span>Sign in</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              to="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex items-center justify-center w-full rounded-lg border border-theme-border bg-theme-surface-hover py-2.5 text-xs font-semibold text-theme-primary"
            >
              Register
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
