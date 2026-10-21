import React from 'react';
import { Clock, CheckCircle2, XCircle, Ban } from 'lucide-react';

export const BookingStatusBadge = ({ status }) => {
  switch (status) {
    case 'approved':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 px-2.5 py-0.5 text-xs font-semibold transition-colors">
          <CheckCircle2 className="h-3 w-3" />
          <span>Approved</span>
        </span>
      );
    case 'rejected':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800 px-2.5 py-0.5 text-xs font-semibold transition-colors">
          <XCircle className="h-3 w-3" />
          <span>Rejected</span>
        </span>
      );
    case 'cancelled':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 px-2.5 py-0.5 text-xs font-semibold transition-colors">
          <Ban className="h-3 w-3" />
          <span>Cancelled</span>
        </span>
      );
    case 'pending':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800 px-2.5 py-0.5 text-xs font-semibold transition-colors">
          <Clock className="h-3 w-3" />
          <span>Pending Review</span>
        </span>
      );
  }
};

export default BookingStatusBadge;
