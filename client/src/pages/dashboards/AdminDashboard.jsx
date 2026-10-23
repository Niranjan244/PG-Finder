import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  fetchAdminStats,
  fetchAdminPGs,
  updatePGStatusApi,
  deletePGByAdminApi,
  fetchAdminUsersApi,
  toggleBlockUserApi,
} from '../../services/adminClient.js';
import { getAdminRevenueReportApi } from '../../services/paymentClient.js';
import { PageHeader } from '../../components/dashboard/PageHeader.jsx';
import { StatCard } from '../../components/dashboard/StatCard.jsx';
import {
  Shield,
  Users,
  Building,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Loader2,
  AlertCircle,
  Calendar,
  Phone,
  Mail,
  MapPin,
  BedDouble,
  Trash2,
  Search,
  UserX,
  UserCheck,
  CreditCard,
  X,
} from 'lucide-react';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('listings'); // 'listings' | 'users'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Rejection modal state
  const [rejectingPg, setRejectingPg] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Platform stats
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: fetchAdminStats,
    refetchInterval: 15000,
  });

  // Platform revenue query
  const { data: revenueData } = useQuery({
    queryKey: ['adminRevenueReport'],
    queryFn: () => getAdminRevenueReportApi(),
    refetchInterval: 30000,
  });

  const totalRevenue = revenueData?.data?.summary?.totalAmount || 0;

  // Accommodation listings
  const { data: pgsData, isLoading: isPGsLoading } = useQuery({
    queryKey: ['adminPGs', statusFilter],
    queryFn: () => fetchAdminPGs(statusFilter === 'all' ? {} : { status: statusFilter }),
    refetchInterval: 15000,
  });

  // User management query
  const { data: usersData, isLoading: isUsersLoading } = useQuery({
    queryKey: ['adminUsers', userRoleFilter, userSearch],
    queryFn: () =>
      fetchAdminUsersApi({
        role: userRoleFilter || undefined,
        search: userSearch || undefined,
      }),
    enabled: activeTab === 'users',
    refetchInterval: 15000,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, reason }) => updatePGStatusApi(id, status, reason),
    onSuccess: (_, variables) => {
      setActionError('');
      setActionSuccess(`Listing successfully marked as ${variables.status}`);
      setRejectingPg(null);
      setRejectionReason('');
      queryClient.invalidateQueries({ queryKey: ['adminPGs'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      queryClient.invalidateQueries({ queryKey: ['searchPGs'] });
      setTimeout(() => setActionSuccess(''), 4000);
    },
    onError: (error) => {
      setActionError(error?.response?.data?.message || error?.message || 'Failed to update accommodation status');
    },
  });

  const deleteListingMutation = useMutation({
    mutationFn: (id) => deletePGByAdminApi(id),
    onSuccess: (response) => {
      setActionError('');
      setActionSuccess(response?.data?.message || 'Property permanently removed');
      queryClient.invalidateQueries({ queryKey: ['adminPGs'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      setTimeout(() => setActionSuccess(''), 4000);
    },
    onError: (error) => {
      setActionError(error?.response?.data?.message || error?.message || 'Failed to remove listing');
    },
  });

  const toggleBlockMutation = useMutation({
    mutationFn: (userId) => toggleBlockUserApi(userId),
    onSuccess: (response) => {
      setActionError('');
      setActionSuccess(response?.data?.message || 'User status updated');
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      setTimeout(() => setActionSuccess(''), 4000);
    },
    onError: (error) => {
      setActionError(error?.response?.data?.message || error?.message || 'Failed to update user status');
    },
  });

  const stats = statsData?.data?.stats || {
    totalUsers: 0,
    totalPGs: 0,
    pendingPGs: 0,
    approvedPGs: 0,
    totalBookings: 0,
  };

  const listings = pgsData?.data?.listings || [];
  const users = usersData?.data?.users || [];

  const handleApprove = (pgId) => {
    setActionError('');
    statusMutation.mutate({ id: pgId, status: 'approved' });
  };

  const handleOpenReject = (pg) => {
    setRejectingPg(pg);
    setRejectionReason('');
    setActionError('');
  };

  const handleConfirmReject = (event) => {
    event.preventDefault();
    if (!rejectingPg) return;
    if (!rejectionReason.trim()) {
      setActionError('Please provide a specific rejection reason for the property owner.');
      return;
    }
    statusMutation.mutate({
      id: rejectingPg._id,
      status: 'rejected',
      reason: rejectionReason.trim(),
    });
  };

  const handleDeleteListing = (pg) => {
    if (window.confirm(`Permanently remove "${pg.title}"? This cannot be undone.`)) {
      deleteListingMutation.mutate(pg._id);
    }
  };

  const handleToggleBlock = (targetUser) => {
    const action = targetUser.isBlocked ? 'unblock' : 'block';
    if (window.confirm(`Are you sure you want to ${action} ${targetUser.name} (${targetUser.email})?`)) {
      toggleBlockMutation.mutate(targetUser._id);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            <span>Approved & Live</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">
            <XCircle className="h-3 w-3" />
            <span>Rejected</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
            <Clock className="h-3 w-3" />
            <span>Pending Review</span>
          </span>
        );
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'owner':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-blue-50 text-brand-700 border-brand-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Standardized Page Header */}
      <PageHeader
        title="Platform Administration"
        description="Platform governance, listing moderation, user management, and security oversight."
        badge="Admin"
        actions={
          <div className="flex items-center gap-1.5 bg-theme-surface border border-theme-border p-1 rounded-xl text-xs font-semibold shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab('listings')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
                activeTab === 'listings'
                  ? 'bg-theme-brand text-white shadow-2xs'
                  : 'text-theme-secondary hover:text-theme-primary'
              }`}
            >
              <Building className="h-3.5 w-3.5" />
              <span>Listings ({stats.totalPGs})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
                activeTab === 'users'
                  ? 'bg-theme-brand text-white shadow-2xs'
                  : 'text-theme-secondary hover:text-theme-primary'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Users ({stats.totalUsers})</span>
            </button>
            <Link
              to="/admin/payments"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-theme-secondary hover:text-theme-primary transition-all"
            >
              <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
              <span>Payments</span>
            </Link>
          </div>
        }
      />

      {/* Global Alerts */}
      {actionError && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-500/10 p-4 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-500/10 p-4 text-xs text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          title="Platform Users"
          value={isStatsLoading ? '...' : stats.totalUsers}
          subtitle="Registered users"
          icon={Users}
          variant="brand"
        />

        <StatCard
          title="Total Listings"
          value={isStatsLoading ? '...' : stats.totalPGs}
          subtitle={`${stats.approvedPGs} approved & live`}
          icon={Building}
          variant="brand"
        />

        <StatCard
          title="Pending Review"
          value={isStatsLoading ? '...' : stats.pendingPGs}
          subtitle="Require action"
          icon={Clock}
          variant="warning"
        />

        <StatCard
          title="Total Bookings"
          value={isStatsLoading ? '...' : stats.totalBookings}
          subtitle="Reservation inquiries"
          icon={Calendar}
          variant="indigo"
        />

        <StatCard
          title="Token Volume"
          value={`₹${totalRevenue.toLocaleString('en-IN')}`}
          subtitle="Razorpay transactions"
          icon={CreditCard}
          variant="success"
          to="/admin/payments"
        />
      </div>

      {/* TAB 1: LISTINGS MODERATION */}
      {activeTab === 'listings' && (
        <div className="rounded-xl border border-theme-border bg-theme-surface shadow-2xs overflow-hidden transition-colors">
          <div className="p-5 sm:p-6 border-b border-theme-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-theme-primary">Accommodation Listings Moderation</h2>
              <p className="mt-0.5 text-xs text-theme-muted">
                Review property submissions, inspect live room vacancies, approve listings or reject with reasons.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-theme-surface-subtle p-1 rounded-lg text-xs font-medium border border-theme-border">
              {[
                { id: 'all', label: 'All Listings' },
                { id: 'pending', label: `Pending (${stats.pendingPGs})` },
                { id: 'approved', label: 'Approved' },
                { id: 'rejected', label: 'Rejected' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`rounded-md px-3 py-1.5 transition-colors ${
                    statusFilter === tab.id
                      ? 'bg-theme-brand text-white shadow-2xs font-semibold'
                      : 'text-theme-secondary hover:text-theme-primary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {isPGsLoading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Building className="mx-auto h-10 w-10 text-slate-300" />
              <h3 className="mt-2 text-sm font-semibold text-slate-900">No properties in this view</h3>
              <p className="mt-1 text-xs text-slate-500">
                There are currently no listings matching the selected status filter.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {listings.map((pg) => (
                <div key={pg._id} className="p-6 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    {/* Left: Listing Details */}
                    <div className="space-y-2 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-base font-bold text-slate-900">{pg.title}</h3>
                        {getStatusBadge(pg.status)}
                        <span className="text-xs text-slate-400 capitalize">
                          {pg.genderPreference} Accommodation
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-600">
                        <span className="flex items-center gap-1 text-slate-500">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          <span>{pg.address}, {pg.area}, {pg.city}</span>
                        </span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <BedDouble className="h-3.5 w-3.5 text-slate-400" />
                          <span>{pg.roomCount || 0} rooms ({pg.availableBeds || 0} vacant beds)</span>
                        </span>
                        <span className="font-semibold text-slate-900">
                          ₹{pg.rentRange?.minRent?.toLocaleString('en-IN') || 0} - ₹{pg.rentRange?.maxRent?.toLocaleString('en-IN') || 0}/mo
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 line-clamp-2">{pg.description}</p>

                      {pg.rejectionReason && pg.status === 'rejected' && (
                        <div className="rounded-lg bg-rose-50 border border-rose-200 p-2 text-xs text-rose-700">
                          <span className="font-semibold">Rejection Note: </span>
                          {pg.rejectionReason}
                        </div>
                      )}

                      {/* Owner Contact Information */}
                      <div className="pt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700">Owner:</span>
                        <span>{pg.owner?.name || 'Registered Owner'}</span>
                        {pg.owner?.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-slate-400" />
                            <span>{pg.owner.email}</span>
                          </span>
                        )}
                        {pg.owner?.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-slate-400" />
                            <span>{pg.owner.phone}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Link
                        to={`/pg/${pg._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Preview</span>
                      </Link>

                      {pg.status !== 'approved' && (
                        <button
                          type="button"
                          onClick={() => handleApprove(pg._id)}
                          disabled={statusMutation.isPending}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Approve</span>
                        </button>
                      )}

                      {pg.status !== 'rejected' && (
                        <button
                          type="button"
                          onClick={() => handleOpenReject(pg)}
                          disabled={statusMutation.isPending}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50 transition-colors"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Reject</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteListing(pg)}
                        disabled={deleteListingMutation.isPending}
                        title="Remove Listing"
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="rounded-xl border border-theme-border bg-theme-surface shadow-2xs overflow-hidden transition-colors">
          <div className="p-5 sm:p-6 border-b border-theme-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-theme-primary">User Account Governance</h2>
              <p className="mt-0.5 text-xs text-theme-muted">
                Inspect platform accounts, audit roles, and toggle instant block/unblock status.
              </p>
            </div>

            {/* Search & Role Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-theme-muted" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(event) => setUserSearch(event.target.value)}
                  placeholder="Search name, email, phone..."
                  className="rounded-lg border border-theme-border bg-theme-surface pl-8 pr-3 py-1.5 text-xs text-theme-primary placeholder:text-theme-muted focus:border-theme-brand focus:outline-hidden w-48 sm:w-64"
                />
              </div>

              <div className="flex items-center gap-1 bg-theme-surface-subtle p-1 rounded-lg text-xs font-medium border border-theme-border">
                {[
                  { id: '', label: 'All' },
                  { id: 'tenant', label: 'Tenants' },
                  { id: 'owner', label: 'Owners' },
                  { id: 'admin', label: 'Admins' },
                ].map((roleTab) => (
                  <button
                    key={roleTab.id}
                    type="button"
                    onClick={() => setUserRoleFilter(roleTab.id)}
                    className={`rounded-md px-2.5 py-1 transition-colors ${
                      userRoleFilter === roleTab.id
                        ? 'bg-theme-brand text-white shadow-2xs font-semibold'
                        : 'text-theme-secondary hover:text-theme-primary'
                    }`}
                  >
                    {roleTab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isUsersLoading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Users className="mx-auto h-10 w-10 text-slate-300" />
              <h3 className="mt-2 text-sm font-semibold text-slate-900">No users found</h3>
              <p className="mt-1 text-xs text-slate-500">
                No registered accounts match your current search or filter criteria.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {users.map((adminUser) => {
                const isRootAdmin = adminUser.email === 'a.niranjan244@gmail.com' || adminUser._id === user?._id || adminUser._id === user?.id;

                return (
                  <div key={adminUser._id} className="p-4 sm:p-6 hover:bg-slate-50/50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      {/* User Info */}
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700 text-sm">
                          {adminUser.name?.[0] || 'U'}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{adminUser.name}</span>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${getRoleBadge(
                                adminUser.role
                              )}`}
                            >
                              {adminUser.role}
                            </span>
                            {adminUser.isBlocked ? (
                              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 border border-rose-200">
                                Blocked
                              </span>
                            ) : (
                              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-slate-400" />
                              <span>{adminUser.email}</span>
                            </span>
                            {adminUser.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3 text-slate-400" />
                                <span>{adminUser.phone}</span>
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400">
                              Joined {new Date(adminUser.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        {!isRootAdmin && (
                          <button
                            type="button"
                            onClick={() => handleToggleBlock(adminUser)}
                            disabled={toggleBlockMutation.isPending}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-xs transition-colors ${
                              adminUser.isBlocked
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                            }`}
                          >
                            {adminUser.isBlocked ? (
                              <>
                                <UserCheck className="h-3.5 w-3.5" />
                                <span>Unblock Account</span>
                              </>
                            ) : (
                              <>
                                <UserX className="h-3.5 w-3.5" />
                                <span>Block Account</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectingPg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                <XCircle className="h-5 w-5" />
                <span>Reject Property Listing</span>
              </div>
              <button
                type="button"
                onClick={() => setRejectingPg(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Please provide a specific rejection reason for <strong className="text-slate-900">"{rejectingPg.title}"</strong>. The owner will be notified to correct the listing.
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rejection Reason / Required Corrections
                </label>
                <textarea
                  rows={4}
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  placeholder="e.g. Photo quality is insufficient, address does not match coordinates, or room pricing violates policy."
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-brand-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingPg(null)}
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={statusMutation.isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 disabled:opacity-50"
                >
                  {statusMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Confirm Rejection</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
