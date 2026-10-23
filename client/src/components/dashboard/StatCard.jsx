import React from 'react';
import { Link } from 'react-router-dom';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  to,
  variant = 'brand',
  progressBar,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
          valueColor: 'text-theme-primary',
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
          valueColor: 'text-theme-primary',
        };
      case 'error':
        return {
          iconBg: 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400',
          valueColor: 'text-theme-primary',
        };
      case 'indigo':
        return {
          iconBg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400',
          valueColor: 'text-theme-primary',
        };
      case 'brand':
      default:
        return {
          iconBg: 'bg-theme-brand-subtle text-theme-brand',
          valueColor: 'text-theme-primary',
        };
    }
  };

  const styles = getVariantStyles();

  const CardContent = (
    <div className="rounded-xl border border-theme-border bg-theme-surface p-5 shadow-2xs hover:border-theme-border/80 transition-all group">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">
          {title}
        </span>
        {Icon && (
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${styles.iconBg}`}
          >
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className={`mt-3 text-2xl font-bold tracking-tight ${styles.valueColor}`}>
        {value}
      </div>

      {progressBar && (
        <div className="mt-2.5 h-1.5 w-full bg-theme-surface-hover rounded-full overflow-hidden">
          <div
            className="h-full bg-theme-brand rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, progressBar))}%` }}
          />
        </div>
      )}

      {subtitle && (
        <p className="mt-1.5 text-xs text-theme-muted">
          {subtitle} {to && <span className="group-hover:translate-x-0.5 inline-block transition-transform">&rarr;</span>}
        </p>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block focus:outline-hidden focus:ring-2 focus:ring-theme-brand rounded-xl">
        {CardContent}
      </Link>
    );
  }

  return CardContent;
};

export default StatCard;
