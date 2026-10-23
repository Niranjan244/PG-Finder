import React from 'react';

export const PageHeader = ({ title, description, badge, actions }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-theme-border">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-theme-primary">
            {title}
          </h1>
          {badge && (
            <span className="rounded-full bg-theme-brand-subtle px-2.5 py-0.5 text-xs font-semibold text-theme-brand border border-theme-border">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-1 text-xs sm:text-sm text-theme-muted">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
