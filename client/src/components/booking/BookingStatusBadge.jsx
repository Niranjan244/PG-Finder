import React from 'react';
import { Clock, CheckCircle2, XCircle, Ban, ShieldCheck, RefreshCw } from 'lucide-react';

export const BookingStatusBadge = ({ status, paymentStatus }) => {
  if (status === 'confirmed' || paymentStatus === 'paid') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700 px-2.5 py-0.5 text-xs font-semibold transition-colors">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        <span>Confirmed &bull; Token Paid</span>
      </span>
    );
  }

  if (paymentStatus === 'refunded') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800 px-2.5 py-0.5 text-xs font-semibold transition-colors">
        <RefreshCw className="h-3 w-3" />
        <span>Refunded</span>
      </span>
    );
  }

  switch (status) {
    case 'approved':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800 px-2.5 py-0.5 text-xs font-semibold transition-colors">
          <CheckCircle2 className="h-3 w-3" />
          <span>Approved &bull; Token Pending</span>
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
