import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/common/Header.jsx';

export const MainLayout = () => {
  const [searchMeta, setSearchMeta] = useState({
    totalCount: 0,
    isLoading: false,
    onOpenMobileFilters: null,
  });

  return (
    <div className="min-h-screen flex flex-col bg-theme-bg text-theme-primary transition-colors">
      <Header searchMeta={searchMeta} />
      <main className="flex-1">
        <Outlet context={{ searchMeta, setSearchMeta }} />
      </main>
      <footer className="border-t border-theme-border bg-theme-surface py-6 transition-colors">
        <div className="mx-auto max-w-[1760px] w-full px-4 sm:px-6 lg:px-8 xl:px-10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-theme-muted">
          <p>PG Finder Application &bull; Accommodations, Bookings and Tenant Management</p>
          <p>Production Architecture v1.0.0</p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;