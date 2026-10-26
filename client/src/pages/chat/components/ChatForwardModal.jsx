import React from 'react';
import { Forward, X, Check, Loader2, Send } from 'lucide-react';

export const ChatForwardModal = ({
  isOpen,
  onClose,
  message,
  conversations = [],
  selectedTargets = [],
  onToggleTarget,
  onForward,
  isForwarding,
  getCounterpart,
}) => {
  if (!isOpen || !message) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-theme-surface border border-theme-border rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-theme-border flex items-center justify-between bg-theme-surface-subtle">
          <div className="flex items-center gap-2">
            <Forward className="h-4 w-4 text-theme-brand" />
            <h3 className="text-sm font-bold text-theme-primary">Forward message to...</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-theme-surface-hover cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Message preview snippet */}
        <div className="p-3 bg-theme-bg border-b border-theme-border text-xs text-theme-secondary flex items-center gap-2">
          <span className="font-semibold text-theme-primary shrink-0">Forwarding:</span>
          <span className="truncate italic">
            {message.text ||
              (message.attachments?.[0]?.fileType === 'image'
                ? '📷 Photo'
                : '📄 Document')}
          </span>
        </div>

        {/* Conversation list to choose recipients */}
        <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-theme-border p-2">
          {conversations.map((conv) => {
            const cp = getCounterpart(conv);
            const isChecked = selectedTargets.includes(conv._id);
            return (
              <button
                key={conv._id}
                type="button"
                onClick={() => onToggleTarget(conv._id)}
                className={`w-full p-3 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer ${
                  isChecked ? 'bg-theme-brand-subtle/50' : 'hover:bg-theme-surface-hover'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-theme-brand-subtle text-theme-brand font-bold text-xs uppercase shrink-0">
                    {cp?.name?.[0] || 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-theme-primary truncate">
                      {cp?.name || 'User'}
                    </p>
                    <p className="text-[11px] text-theme-muted truncate">
                      {conv.pg?.title || 'Accommodation'}
                    </p>
                  </div>
                </div>
                <div
                  className={`h-5 w-5 rounded-md border flex items-center justify-center transition-colors ${
                    isChecked
                      ? 'bg-theme-brand border-theme-brand text-white'
                      : 'border-theme-border bg-theme-surface'
                  }`}
                >
                  {isChecked && <Check className="h-3.5 w-3.5" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-theme-border bg-theme-surface-subtle flex items-center justify-between">
          <span className="text-xs text-theme-muted">
            {selectedTargets.length} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-theme-border bg-theme-surface text-xs font-semibold text-theme-secondary hover:bg-theme-surface-hover cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedTargets.length === 0 || isForwarding}
              onClick={onForward}
              className="px-4 py-1.5 rounded-lg bg-theme-brand text-xs font-bold text-white hover:bg-theme-brand-hover disabled:opacity-40 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              {isForwarding ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              <span>Forward ({selectedTargets.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
