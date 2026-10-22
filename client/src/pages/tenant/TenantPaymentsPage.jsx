import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getMyPaymentsApi } from '../../services/paymentClient.js';
import {
  CreditCard,
  Building2,
  Calendar,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  ArrowRight,
  Loader2,
  Receipt,
} from 'lucide-react';

export const TenantPaymentsPage = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['myPayments'],
    queryFn: getMyPaymentsApi,
  });

  const payments = data?.data || [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-theme-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-theme-primary">
            Payment History
          </h1>
          <p className="mt-1 text-xs text-theme-secondary">
            Review your booking token transactions, transaction receipts, and refund statuses.
          </p>
        </div>

        <Link
          to="/tenant/bookings"
          className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-surface px-3 py-2 text-xs font-semibold text-theme-secondary hover:text-theme-primary transition-colors w-fit"
        >
          <span>View My Bookings</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="flex items-center gap-2 text-xs text-theme-muted">
            <Loader2 className="h-5 w-5 animate-spin text-theme-brand" />
            <span>Loading payment records...</span>
          </div>
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-xs text-rose-800 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-300">
          <p className="font-semibold">Unable to load payment history.</p>
          <p className="mt-1">{error?.message || 'Server error'}</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-theme-border bg-theme-surface p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-theme-surface-hover text-theme-muted">
            <Receipt className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-theme-primary">No Payment Records</h3>
          <p className="mt-1.5 text-xs text-theme-secondary max-w-sm mx-auto">
            You haven't made any booking token payments yet. When an owner approves your booking, you can pay your token here.
          </p>
          <div className="mt-6">
            <Link
              to="/tenant/bookings"
              className="inline-flex items-center gap-2 rounded-lg bg-theme-brand px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-theme-brand-hover transition-colors"
            >
              <span>Check My Bookings</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => {
            const pg = p.pg || {};
            const isPaid = p.status === 'paid';
            const isRefunded = p.status === 'refunded';
            const isFailed = p.status === 'failed';

            return (
              <div
                key={p._id}
                className="overflow-hidden rounded-2xl border border-theme-border bg-theme-surface p-5 shadow-xs transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-theme-primary">
                      {pg.title || 'PG Stay'}
                    </span>
                    {isPaid && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 px-2 py-0.5 text-[11px] font-semibold">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Paid &bull; Verified</span>
                      </span>
                    )}
                    {isRefunded && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800 px-2 py-0.5 text-[11px] font-semibold">
                        <RefreshCw className="h-3 w-3" />
                        <span>Refunded</span>
                      </span>
                    )}
                    {isFailed && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800 px-2 py-0.5 text-[11px] font-semibold">
                        <XCircle className="h-3 w-3" />
                        <span>Failed</span>
                      </span>
                    )}
                    {p.status === 'created' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800 px-2 py-0.5 text-[11px] font-semibold">
                        <Clock className="h-3 w-3" />
                        <span>Initiated</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-theme-secondary">
                    {pg.area}, {pg.city}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-theme-muted font-mono pt-1">
                    {p.razorpayPaymentId && <span>Payment ID: {p.razorpayPaymentId}</span>}
                    {p.razorpayOrderId && <span>Order: {p.razorpayOrderId}</span>}
                  </div>
                </div>

                <div className="flex sm:flex-col sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-theme-border">
                  <div className="text-left sm:text-right">
                    <span className="text-base font-extrabold text-theme-primary">
                      ₹{p.amount?.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] text-theme-muted block">
                      {new Date(p.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {isRefunded && (
                    <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold block pt-1">
                      Refund ID: {p.refundId || 'Processed'}
                    </span>
                  )}
                  {isFailed && p.failureReason && (
                    <span className="text-[11px] text-rose-600 dark:text-rose-400 block pt-1 max-w-xs">
                      {p.failureReason}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TenantPaymentsPage;
