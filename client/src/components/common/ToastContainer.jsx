import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Bell, X, ArrowRight } from 'lucide-react';

export const ToastContainer = ({ toasts = [], onDismiss }) => {
  const navigate = useNavigate();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0">
      {toasts.map((toast) => {
        const isChat = toast.type === 'new_message' || Boolean(toast.conversationId);

        const handleClick = () => {
          onDismiss(toast.id);
          if (toast.conversationId) {
            navigate(`/chat?conversationId=${toast.conversationId}`);
          } else if (toast.url) {
            navigate(toast.url);
          } else if (toast.type === 'booking_request') {
            navigate('/owner/bookings');
          } else if (toast.type === 'booking_approved' || toast.type === 'booking_rejected') {
            navigate('/tenant/bookings');
          }
        };

        return (
          <div
            key={toast.id}
            className="pointer-events-auto rounded-xl border border-theme-border bg-theme-surface p-3.5 shadow-xl transition-all animate-in slide-in-from-bottom-3 fade-in duration-200 hover:border-theme-brand group flex items-start gap-3 cursor-pointer"
            onClick={handleClick}
            role="alert"
          >
            <div className="shrink-0 mt-0.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-theme-brand-subtle text-theme-brand font-bold text-xs uppercase shadow-2xs">
                {isChat ? (
                  <MessageSquare className="h-4 w-4" />
                ) : (
                  <Bell className="h-4 w-4" />
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center justify-between gap-1">
                <p className="text-xs font-bold text-theme-primary truncate">
                  {toast.title || 'New Notification'}
                </p>
                <span className="text-[10px] text-theme-muted shrink-0">Just now</span>
              </div>
              <p className="mt-0.5 text-xs text-theme-secondary line-clamp-2 leading-relaxed break-words">
                {toast.message}
              </p>
              <div className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-theme-brand group-hover:underline">
                <span>{isChat ? 'Open conversation' : 'View details'}</span>
                <ArrowRight className="h-3 w-3" />
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(toast.id);
              }}
              className="shrink-0 rounded-lg p-1 text-theme-muted hover:bg-theme-surface-hover hover:text-theme-primary transition-colors"
              title="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
