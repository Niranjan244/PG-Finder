import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getOwnerReceivedPaymentsApi } from '../../services/paymentClient.js';
import {
  CreditCard,
  Building2,
  Calendar,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
  Receipt,
  User,
  ArrowRight,
} from 'lucide-react';

export const OwnerPaymentsPage = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['ownerReceivedPayments'],
    queryFn: getOwnerReceivedPaymentsApi,
  });

  const payments = data?.data || [];

  const totalReceived = payments
    .filter((p) => p.status === 'paid')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-theme-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-theme-primary">
            Received Booking Tokens
          </h1>
          <p className="mt-1 text-xs text-theme-secondary">
            Track token payments deposited online by confirmed tenants for your PG listings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-theme-border bg-theme-surface px-4 py-2 text-right">
            <span className="text-[10px] font-semibold text-theme-muted uppercase tracking-wider block">
              Total Tokens Collected
            </span>
            <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
              ₹{totalReceived.toLocaleString('en-IN')}
            </span>
          </div>

          <Link
            to="/owner/bookings"
            className="inline-flex items-center gap-1.5 rounded-lg bg-theme-brand px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-theme-brand-hover transition-colors"
          >
            <span>Manage Bookings</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="flex items-center gap-2 text-xs text-theme-muted">
            <Loader2 className="h-5 w-5 animate-spin text-theme-brand" />
            <span>Loading received payments...</span>
          </div>
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-xs text-rose-800 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-300">
          <p className="font-semibold">Unable to load received payments.</p>
          <p className="mt-1">{error?.message || 'Server error'}</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-theme-border bg-theme-surface p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-theme-surface-hover text-theme-muted">
            <Receipt className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-theme-primary">No Token Payments Yet</h3>
          <p className="mt-1.5 text-xs text-theme-secondary max-w-sm mx-auto">
            When tenants pay their booking token online for an approved request, the transaction will appear here with full receipt details.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-theme-border bg-theme-surface shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-theme-border bg-theme-surface-hover text-theme-muted font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Property</th>
                  <th className="px-5 py-3.5">Tenant</th>
                  <th className="px-5 py-3.5">Token Amount</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Payment ID</th>
                  <th className="px-5 py-3.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border text-theme-secondary">
                {payments.map((p) => {
                  const pg = p.pg || {};
                  const tenant = p.tenant || {};
                  const isPaid = p.status === 'paid';
                  const isRefunded = p.status === 'refunded';

                  return (
                    <tr key={p._id} className="hover:bg-theme-surface-hover/50 transition-colors">
                      <td className="px-5 py-4 font-bold text-theme-primary">
                        <div>{pg.title || 'Accommodation'}</div>
                        <div className="text-[11px] font-normal text-theme-muted">{pg.area}, {pg.city}</div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-semibold text-theme-primary">{tenant.name || 'Tenant'}</div>
                        <div className="text-[11px] text-theme-muted">{tenant.phone || tenant.email || 'N/A'}</div>
                      </td>

                      <td className="px-5 py-4 font-extrabold text-theme-primary">
                        ₹{p.amount?.toLocaleString('en-IN')}
                      </td>

                      <td className="px-5 py-4">
                        {isPaid && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 px-2 py-0.5 text-[11px] font-semibold">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Paid</span>
                          </span>
                        )}
                        {isRefunded && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800 px-2 py-0.5 text-[11px] font-semibold">
                            <RefreshCw className="h-3 w-3" />
                            <span>Refunded</span>
                          </span>
                        )}
                        {p.status === 'failed' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800 px-2 py-0.5 text-[11px] font-semibold">
                            <XCircle className="h-3 w-3" />
                            <span>Failed</span>
                          </span>
                        )}
                        {p.status === 'created' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800 px-2 py-0.5 text-[11px] font-semibold">
                            <span>Pending</span>
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 font-mono text-[11px] text-theme-muted">
                        {p.razorpayPaymentId || p.razorpayOrderId}
                      </td>

                      <td className="px-5 py-4 text-theme-muted text-[11px]">
                        {new Date(p.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerPaymentsPage;
