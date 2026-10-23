import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getMyPaymentsApi } from '../../services/paymentClient.js';
import { PageHeader } from '../../components/dashboard/PageHeader.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
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

  const payments = data?.data?.payments || data?.data || [];

  return (
    <div className="space-y-6">
      {/* Standardized Page Header */}
      <PageHeader
        title="Payment History & Receipts"
        description="Review verified online token transactions, Razorpay order references, and automated refund statuses."
        badge={`${payments.length} Records`}
        actions={
          <Link
            to="/tenant/bookings"
            className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-surface px-3.5 py-2 text-xs font-semibold text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary transition-colors shadow-2xs"
          >
            <span>View My Bookings</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="flex items-center gap-2 text-xs text-theme-muted">
            <Loader2 className="h-5 w-5 animate-spin text-theme-brand" />
            <span>Loading payment records...</span>
          </div>
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-500/10 p-6 text-center text-xs text-rose-700 dark:text-rose-300">
          <p className="font-semibold">Unable to load payment history.</p>
          <p className="mt-1 opacity-90">{error?.message || 'Server error'}</p>
        </div>
      ) : payments.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No Payment Records Found"
          description="You haven't made any booking token payments yet. When an owner approves your room inquiry, you can pay your advance token deposit online."
          actionLabel="Check My Bookings"
          actionTo="/tenant/bookings"
        />
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
                className="overflow-hidden rounded-xl border border-theme-border bg-theme-surface p-5 shadow-2xs transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-theme-primary">
                      {pg.title || 'PG Booking Token'}
                    </span>
                    {isPaid && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Paid &bull; Verified</span>
                      </span>
                    )}
                    {isRefunded && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 px-2.5 py-0.5 text-[11px] font-semibold">
                        <RefreshCw className="h-3 w-3" />
                        <span>Refunded</span>
                      </span>
                    )}
                    {isFailed && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 px-2.5 py-0.5 text-[11px] font-semibold">
                        <XCircle className="h-3 w-3" />
                        <span>Failed</span>
                      </span>
                    )}
                    {p.status === 'created' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 px-2.5 py-0.5 text-[11px] font-semibold">
                        <Clock className="h-3 w-3" />
                        <span>Initiated</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-theme-muted">
                    {pg.area ? `${pg.area}, ${pg.city}` : 'Accommodation Token Deposit'}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-theme-muted font-mono pt-1">
                    {p.razorpayPaymentId && <span>Payment ID: {p.razorpayPaymentId}</span>}
                    {p.razorpayOrderId && <span>Order: {p.razorpayOrderId}</span>}
                  </div>
                </div>

                <div className="flex sm:flex-col sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-theme-border">
                  <div className="text-left sm:text-right">
                    <span className="text-base font-bold text-theme-primary">
                      ₹{p.amount?.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] text-theme-muted block mt-0.5">
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
