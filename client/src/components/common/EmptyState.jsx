import React from 'react';
import { Link } from 'react-router-dom';

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
}) => {
  return (
    <div className="rounded-2xl border border-dashed border-theme-border bg-theme-surface p-12 text-center transition-colors">
      {Icon && (
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-theme-surface-hover text-theme-muted">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <h3 className="mt-4 text-sm font-semibold text-theme-primary">{title}</h3>
      {description && (
        <p className="mt-1.5 text-xs text-theme-muted max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      )}
      {(actionLabel && (actionTo || onAction)) && (
        <div className="mt-6">
          {actionTo ? (
            <Link
              to={actionTo}
              className="inline-flex items-center gap-2 rounded-lg bg-theme-brand px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-theme-brand-hover transition-colors"
            >
              {actionLabel}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center gap-2 rounded-lg bg-theme-brand px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-theme-brand-hover transition-colors"
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
