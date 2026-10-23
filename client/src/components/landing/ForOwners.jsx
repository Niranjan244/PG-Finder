import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const ForOwners = () => {
  return (
    <section id="for-owners" className="py-16 sm:py-20 border-b border-theme-border transition-colors">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-theme-border bg-theme-surface p-8 sm:p-12 shadow-sm transition-colors flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>For Property Owners & Managers</span>
            </div>

            <h2 className="font-serif text-2xl font-bold tracking-tight text-theme-primary sm:text-3xl">
              Own a PG? List your property with zero brokerage.
            </h2>

            <p className="text-xs sm:text-sm text-theme-secondary leading-relaxed">
              Connect directly with verified students and working professionals. Track live room occupancy, approve booking requests, and chat with tenants from your dedicated owner dashboard.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs text-theme-secondary">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-theme-brand shrink-0" />
                <span>Zero commission or broker fees</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-theme-brand shrink-0" />
                <span>Real-time bed inventory control</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-theme-brand shrink-0" />
                <span>Direct in-app tenant messaging</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-theme-brand shrink-0" />
                <span>Verified tenant identities</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            <Link
              to="/register?role=owner"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-theme-brand px-6 py-3 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-theme-brand-hover transition-colors"
            >
              <span>List your PG</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-theme-border bg-theme-surface-hover px-6 py-3 text-xs sm:text-sm font-semibold text-theme-secondary hover:text-theme-primary transition-colors"
            >
              <span>Owner Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForOwners;
