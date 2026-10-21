import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-7xl flex-col items-center justify-center px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500 mb-4">
        <AlertCircle className="h-7 w-7" />
      </div>
      <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Page Not Found</h1>
      <p className="mt-2 text-sm text-slate-600 max-w-sm">
        The requested URL was not found on this server. Check the link or return to the overview page.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Return to Overview
      </Link>
    </div>
  );
};
