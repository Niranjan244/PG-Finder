import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAdminPaymentsApi, getAdminRevenueReportApi } from '../../services/paymentClient.js';
import { PageHeader } from '../../components/dashboard/PageHeader.jsx';
import { StatCard } from '../../components/dashboard/StatCard.jsx';
import {
  CreditCard,
  TrendingUp,
  RotateCcw,
  AlertCircle,
  Calendar,
  Filter,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
  Receipt,
  Download,
  DollarSign,
} from 'lucide-react';

export const AdminPaymentsPage = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  // Revenue analytics report
  const { data: revenueData, isLoading: isRevenueLoading } = useQuery({
    queryKey: ['adminRevenueReport', startDate, endDate],
    queryFn: () =>
      getAdminRevenueReportApi({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
  });

  // Transactions list
  const { data: paymentsData, isLoading: isPaymentsLoading, error } = useQuery({
    queryKey: ['adminPaymentsList', page, statusFilter, startDate, endDate],
    queryFn: () =>
      getAdminPaymentsApi({
        page,
        limit: 15,
        status: statusFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
  });

  const summary = revenueData?.data?.summary || {
    totalTransactions: 0,
    totalPaidTransactions: 0,
    totalRefundedTransactions: 0,
    totalFailedTransactions: 0,
    grossRevenue: 0,
    totalRefundedAmount: 0,
    netRevenue: 0,
  };

  const payments = paymentsData?.data?.payments || [];
  const pagination = paymentsData?.data?.pagination || { page: 1, totalPages: 1, total: 0 };

  const handleResetFilters = () => {
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Standardized Page Header */}
      <PageHeader
        title="Revenue & Transaction Ledger"
        description="Platform-wide financial governance, booking token volume, Razorpay order audits, and automated refund tracking."
        badge="Platform Ledger"
      />

      {/* KPI Revenue Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Gross Token Volume"
          value={`₹${summary.grossRevenue?.toLocaleString('en-IN') || 0}`}
          subtitle={`${summary.totalPaidTransactions} successful token deposits`}
          icon={TrendingUp}
          variant="brand"
        />

        <StatCard
          title="Net Platform Volume"
          value={`₹${summary.netRevenue?.toLocaleString('en-IN') || 0}`}
          subtitle="Gross volume minus refunds"
          icon={DollarSign}
          variant="success"
        />

        <StatCard
          title="Refunds Processed"
          value={`₹${summary.totalRefundedAmount?.toLocaleString('en-IN') || 0}`}
          subtitle={`${summary.totalRefundedTransactions} returned token payments`}
          icon={RotateCcw}
          variant="indigo"
        />

        <StatCard
          title="Total Orders Initiated"
          value={summary.totalTransactions || 0}
          subtitle={`${summary.totalFailedTransactions} failed or expired orders`}
          icon={Receipt}
          variant="warning"
        />
      </div>

      {/* Date Filter Bar */}
      <div className="rounded-xl border border-theme-border bg-theme-surface p-4 flex flex-wrap items-center justify-between gap-4 shadow-2xs transition-colors">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-theme-secondary">
            <Filter className="h-3.5 w-3.5 text-theme-brand" />
            <span>Filter Transactions:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-theme-border bg-theme-surface px-3 py-1.5 text-xs text-theme-primary focus:border-theme-brand focus:outline-hidden"
          >
            <option value="">All Statuses</option>
            <option value="paid">Paid & Confirmed</option>
            <option value="refunded">Refunded</option>
            <option value="failed">Failed</option>
            <option value="created">Created (Unpaid)</option>
          </select>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-theme-muted">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-theme-border bg-theme-surface px-2.5 py-1 text-xs text-theme-primary focus:border-theme-brand focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-theme-muted">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-theme-border bg-theme-surface px-2.5 py-1 text-xs text-theme-primary focus:border-theme-brand focus:outline-hidden"
            />
          </div>
        </div>

        {(statusFilter || startDate || endDate) && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs font-semibold text-theme-brand hover:underline"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Transactions Ledger Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-theme-primary">Verified Transactions</h2>
          <span className="text-xs text-theme-muted">{pagination.total} records found</span>
        </div>

        {isPaymentsLoading ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <div className="flex items-center gap-2 text-xs text-theme-muted">
              <Loader2 className="h-5 w-5 animate-spin text-theme-brand" />
              <span>Loading ledger...</span>
            </div>
          </div>
        ) : payments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-theme-border bg-theme-surface p-12 text-center text-xs text-theme-muted">
            No transactions matched the selected filters.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-theme-border bg-theme-surface shadow-2xs transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-theme-border bg-theme-surface-subtle text-theme-muted font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">Accommodation</th>
                    <th className="px-5 py-3.5">Tenant</th>
                    <th className="px-5 py-3.5">Owner</th>
                    <th className="px-5 py-3.5">Amount</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Razorpay Ref</th>
                    <th className="px-5 py-3.5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border text-theme-secondary">
                  {payments.map((p) => {
                    const pg = p.pg || {};
                    const tenant = p.tenant || {};
                    const owner = p.owner || {};

                    return (
                      <tr key={p._id} className="hover:bg-theme-surface-hover transition-colors">
                        <td className="px-5 py-3.5 font-bold text-theme-primary">
                          <div>{pg.title || 'N/A'}</div>
                          <div className="text-[11px] font-normal text-theme-muted">{pg.city || ''}</div>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-theme-primary">{tenant.name || 'Tenant'}</div>
                          <div className="text-[11px] text-theme-muted">{tenant.email || ''}</div>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-theme-primary">{owner.name || 'Owner'}</div>
                          <div className="text-[11px] text-theme-muted">{owner.email || ''}</div>
                        </td>

                        <td className="px-5 py-3.5 font-bold text-theme-primary">
                          ₹{p.amount?.toLocaleString('en-IN')}
                        </td>

                        <td className="px-5 py-3.5">
                          {p.status === 'paid' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Paid</span>
                            </span>
                          )}
                          {p.status === 'refunded' && (
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
                              <span>Unpaid</span>
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 font-mono text-[11px] text-theme-muted">
                          {p.razorpayPaymentId || p.razorpayOrderId}
                        </td>

                        <td className="px-5 py-3.5 text-theme-muted text-[11px]">
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

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-theme-border text-xs text-theme-secondary">
                <span>
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    className="rounded-lg border border-theme-border bg-theme-surface px-3 py-1 text-xs font-semibold disabled:opacity-40 hover:bg-theme-surface-hover transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((prev) => prev + 1)}
                    className="rounded-lg border border-theme-border bg-theme-surface px-3 py-1 text-xs font-semibold disabled:opacity-40 hover:bg-theme-surface-hover transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPaymentsPage;
