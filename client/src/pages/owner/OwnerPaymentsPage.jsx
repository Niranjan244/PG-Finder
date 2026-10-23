import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getOwnerReceivedPaymentsApi } from '../../services/paymentClient.js';
import { PageHeader } from '../../components/dashboard/PageHeader.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
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
  Coins,
} from 'lucide-react';

export const OwnerPaymentsPage = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['ownerReceivedPayments'],
    queryFn: getOwnerReceivedPaymentsApi,
  });

  const payments = data?.data?.payments || data?.data || [];

  const totalReceived = payments
    .filter((p) => p.status === 'paid')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Standardized Page Header */}
      <PageHeader
        title="Received Booking Tokens"
        description="Audit advance token payments deposited online by confirmed tenants for your accommodations."
        badge={`${payments.length} Transactions`}
        actions={
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-theme-border bg-theme-surface px-4 py-2 text-right shadow-2xs">
              <span className="text-[10px] font-semibold text-theme-muted uppercase tracking-wider block">
                Total Deposited
              </span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                ₹{totalReceived.toLocaleString('en-IN')}
              </span>
            </div>

            <Link
              to="/owner/bookings"
              className="inline-flex items-center gap-1.5 rounded-lg bg-theme-brand px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-theme-brand-hover transition-colors"
            >
              <span>Manage Bookings</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="flex items-center gap-2 text-xs text-theme-muted">
            <Loader2 className="h-5 w-5 animate-spin text-theme-brand" />
            <span>Loading received payments...</span>
          </div>
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-500/10 p-6 text-center text-xs text-rose-700 dark:text-rose-300">
          <p className="font-semibold">Unable to load received payments.</p>
          <p className="mt-1 opacity-90">{error?.message || 'Server error'}</p>
        </div>
      ) : payments.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No Token Payments Received Yet"
          description="When tenants pay their advance booking token online for an approved request, the verified transaction will appear here."
          actionLabel="View Booking Requests"
          actionTo="/owner/bookings"
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-theme-border bg-theme-surface shadow-2xs transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-theme-border bg-theme-surface-subtle text-theme-muted font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Property</th>
                  <th className="px-5 py-3.5">Tenant</th>
                  <th className="px-5 py-3.5">Token Deposit</th>
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
                    <tr key={p._id} className="hover:bg-theme-surface-hover transition-colors">
                      <td className="px-5 py-4 font-bold text-theme-primary">
                        <div>{pg.title || 'Accommodation'}</div>
                        <div className="text-[11px] font-normal text-theme-muted">{pg.area}, {pg.city}</div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-semibold text-theme-primary">{tenant.name || 'Tenant'}</div>
                        <div className="text-[11px] text-theme-muted">{tenant.phone || tenant.email || 'N/A'}</div>
                      </td>

                      <td className="px-5 py-4 font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{p.amount?.toLocaleString('en-IN')}
                      </td>

                      <td className="px-5 py-4">
                        {isPaid && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Paid</span>
                          </span>
                        )}
                        {isRefunded && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 px-2.5 py-0.5 text-[11px] font-semibold">
                            <RefreshCw className="h-3 w-3" />
                            <span>Refunded</span>
                          </span>
                        )}
                        {p.status === 'failed' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 px-2.5 py-0.5 text-[11px] font-semibold">
                            <XCircle className="h-3 w-3" />
                            <span>Failed</span>
                          </span>
                        )}
                        {p.status === 'created' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 px-2.5 py-0.5 text-[11px] font-semibold">
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
