import React from 'react';
import { Trash2 } from 'lucide-react';

export const ChatDeleteModal = ({
  isOpen,
  onClose,
  message,
  currentUserId,
  isDeleting,
  onDelete,
  getSenderId,
}) => {
  if (!isOpen || !message) return null;

  const isMyMessage = getSenderId(message.sender) === String(currentUserId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-theme-surface border border-theme-border rounded-2xl shadow-2xl p-5 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 shrink-0">
            <Trash2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-theme-primary">Delete message?</h3>
            <p className="text-xs text-theme-muted mt-0.5 line-clamp-2">
              {message.text ||
                (message.attachments?.[0]?.originalName
                  ? `Attachment: ${message.attachments[0].originalName}`
                  : 'Selected message')}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          {/* If current user is sender and message isn't already deleted, show Delete for everyone */}
          {isMyMessage && !message.isDeleted && (
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => onDelete(message._id, 'everyone')}
              className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs text-center"
            >
              Delete for everyone
            </button>
          )}

          <button
            type="button"
            disabled={isDeleting}
            onClick={() => onDelete(message._id, 'me')}
            className="w-full py-2 px-3 rounded-xl border border-theme-border bg-theme-surface hover:bg-theme-surface-hover text-theme-primary font-semibold text-xs transition-colors cursor-pointer text-center"
          >
            Delete for me
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-1.5 px-3 rounded-xl text-theme-muted hover:text-theme-primary text-xs font-medium transition-colors cursor-pointer text-center"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
