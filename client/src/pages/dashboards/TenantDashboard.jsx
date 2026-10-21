import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useQuery } from '@tanstack/react-query';
import { getMyBookingsApi } from '../../services/bookingClient.js';
import { Bookmark, CalendarCheck, Search, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TenantDashboard = () => {
  const { user } = useAuth();

  const { data: bookingsData } = useQuery({
    queryKey: ['myBookings'],
    queryFn: getMyBookingsApi,
  });

  const bookings = bookingsData?.data || [];
  const approvedCount = bookings.filter((booking) => booking.status === 'approved').length;
  const pendingCount = bookings.filter((booking) => booking.status === 'pending').length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tenant Dashboard</h1>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
              Tenant
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Welcome back, <span className="font-semibold text-slate-800">{user?.name}</span> ({user?.email})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/tenant/bookings"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <span>My Bookings ({bookings.length})</span>
          </Link>
          <Link
            to="/search"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 transition-colors"
          >
            <Search className="h-4 w-4" />
            <span>Search Accommodations</span>
          </Link>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 my-8">
        <Link
          to="/tenant/bookings"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Confirmed Bookings</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
              <CalendarCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{approvedCount}</div>
          <p className="mt-1 text-xs text-slate-500">Approved room reservations &rarr;</p>
        </Link>

        <Link
          to="/tenant/bookings"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Requests</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition-colors">
              <Bell className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{pendingCount}</div>
          <p className="mt-1 text-xs text-slate-500">Awaiting owner review &rarr;</p>
        </Link>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Inquiries</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Bookmark className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{bookings.length}</div>
          <p className="mt-1 text-xs text-slate-500">Submitted booking applications</p>
        </div>
      </div>

      {/* Real Empty State */}
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <CalendarCheck className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-sm font-semibold text-slate-900">No Booking Requests Sent Yet</h3>
        <p className="mt-1.5 text-xs text-slate-500 max-w-sm mx-auto">
          You have not applied for any PG accommodation yet. Browse verified properties, check room amenities, and submit booking inquiries.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            Explore PG Listings
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TenantDashboard;
