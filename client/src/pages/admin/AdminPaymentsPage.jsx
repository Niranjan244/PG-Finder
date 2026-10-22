import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAdminPaymentsApi, getAdminRevenueReportApi } from '../../services/paymentClient.js';
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
  DollarSign,
  Receipt,
  Download,
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-theme-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-theme-primary">
            Platform Payments & Revenue Analytics
          </h1>
          <p className="mt-1 text-xs text-theme-secondary">
            Financial reporting, booking token transactions, and refund audit ledger across PG Finder.
          </p>
        </div>
      </div>

      {/* KPI Revenue Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="rounded-2xl border border-theme-border bg-theme-surface p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-theme-secondary">
            <span>Gross Token Volume</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-theme-primary">
            ₹{summary.grossRevenue?.toLocaleString('en-IN') || 0}
          </div>
          <p className="text-[11px] text-theme-muted">
            {summary.totalPaidTransactions} successful token deposits
          </p>
        </div>

        {/* Net Revenue */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            <span>Net Platform Volume</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-900 dark:text-emerald-300">
            ₹{summary.netRevenue?.toLocaleString('en-IN') || 0}
          </div>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
            Gross volume minus processed refunds
          </p>
        </div>

        {/* Total Refunds */}
        <div className="rounded-2xl border border-theme-border bg-theme-surface p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-theme-secondary">
            <span>Refunds Processed</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">
              <RotateCcw className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-theme-primary">
            ₹{summary.totalRefundedAmount?.toLocaleString('en-IN') || 0}
          </div>
          <p className="text-[11px] text-theme-muted">
            {summary.totalRefundedTransactions} returned token payments
          </p>
        </div>

        {/* Total Transactions */}
        <div className="rounded-2xl border border-theme-border bg-theme-surface p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-theme-secondary">
            <span>Total Orders Initiated</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-theme-primary">
            {summary.totalTransactions || 0}
          </div>
          <p className="text-[11px] text-theme-muted">
            {summary.totalFailedTransactions} failed or expired orders
          </p>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="rounded-2xl border border-theme-border bg-theme-surface p-4 flex flex-wrap items-center justify-between gap-4">
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
            className="rounded-lg border border-theme-border bg-theme-surface px-3 py-1.5 text-xs text-theme-primary focus:border-theme-brand focus:outline-none"
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
              className="rounded-lg border border-theme-border bg-theme-surface px-2.5 py-1 text-xs text-theme-primary focus:border-theme-brand focus:outline-none"
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
              className="rounded-lg border border-theme-border bg-theme-surface px-2.5 py-1 text-xs text-theme-primary focus:border-theme-brand focus:outline-none"
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
          <h2 className="text-base font-bold text-theme-primary">Transaction Ledger</h2>
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
          <div className="rounded-2xl border border-dashed border-theme-border bg-theme-surface p-12 text-center text-xs text-theme-muted">
            No transactions matched the selected filters.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-theme-border bg-theme-surface shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-theme-border bg-theme-surface-hover text-theme-muted font-semibold uppercase tracking-wider text-[11px]">
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
                      <tr key={p._id} className="hover:bg-theme-surface-hover/50 transition-colors">
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

                        <td className="px-5 py-3.5 font-extrabold text-theme-primary">
                          ₹{p.amount?.toLocaleString('en-IN')}
                        </td>

                        <td className="px-5 py-3.5">
                          {p.status === 'paid' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 px-2 py-0.5 text-[11px] font-semibold">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Paid</span>
                            </span>
                          )}
                          {p.status === 'refunded' && (
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
                    className="rounded-lg border border-theme-border px-3 py-1 text-xs font-semibold disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((prev) => prev + 1)}
                    className="rounded-lg border border-theme-border px-3 py-1 text-xs font-semibold disabled:opacity-40"
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
