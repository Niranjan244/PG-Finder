import React from 'react';
import {
  HardDrive,
  X,
  Loader2,
  Folder,
  Image as ImageIcon,
  FileText,
  Eye,
  Download,
} from 'lucide-react';

export const ChatStorageModal = ({
  isOpen,
  onClose,
  storageData,
  isLoading,
  counterpartName,
  propertyTitle,
  onPreviewImage,
  formatFileSize,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-theme-surface border border-theme-border rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-theme-border flex items-center justify-between bg-theme-surface-subtle">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-theme-brand-subtle text-theme-brand">
              <HardDrive className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-theme-primary">Storage Usage</h3>
              <p className="text-[10px] text-theme-muted">
                {counterpartName || 'Chat'} • {propertyTitle || 'Accommodation'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-theme-surface-hover cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-theme-muted">
              <Loader2 className="h-6 w-6 animate-spin text-theme-brand" />
              <span className="text-xs">Calculating storage...</span>
            </div>
          ) : (
            <>
              {/* Total Storage Summary Card */}
              <div className="p-4 rounded-xl border border-theme-border bg-theme-surface-subtle flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">
                    Total Chat Storage
                  </p>
                  <h4 className="text-xl font-bold text-theme-primary mt-0.5">
                    {formatFileSize(storageData?.totalBytes || 0)}
                  </h4>
                  <p className="text-[11px] text-theme-muted mt-0.5">
                    {storageData?.totalFiles || 0} shared item{(storageData?.totalFiles || 0) === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-theme-brand text-white shadow-md">
                  <Folder className="h-6 w-6" />
                </div>
              </div>

              {/* Storage Visual Bar */}
              {storageData?.totalBytes > 0 && (
                <div className="space-y-1.5">
                  <div className="h-3 w-full rounded-full bg-theme-surface-hover overflow-hidden flex">
                    <div
                      style={{
                        width: `${Math.round(
                          ((storageData.imageBytes || 0) / (storageData.totalBytes || 1)) * 100
                        )}%`,
                      }}
                      className="bg-purple-500 h-full transition-all"
                      title={`Photos & Media: ${formatFileSize(storageData.imageBytes || 0)}`}
                    />
                    <div
                      style={{
                        width: `${Math.round(
                          ((storageData.docBytes || 0) / (storageData.totalBytes || 1)) * 100
                        )}%`,
                      }}
                      className="bg-indigo-500 h-full transition-all"
                      title={`Documents: ${formatFileSize(storageData.docBytes || 0)}`}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-theme-muted px-0.5">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-purple-500 inline-block" />
                      <span>Photos ({formatFileSize(storageData?.imageBytes || 0)})</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-indigo-500 inline-block" />
                      <span>Docs ({formatFileSize(storageData?.docBytes || 0)})</span>
                    </span>
                  </div>
                </div>
              )}

              {/* Category Breakdown Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-theme-border bg-theme-surface flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 shrink-0">
                    <ImageIcon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-theme-primary">Photos & Media</p>
                    <p className="text-[10px] text-theme-muted">
                      {storageData?.imageCount || 0} files • {formatFileSize(storageData?.imageBytes || 0)}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-theme-border bg-theme-surface flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 shrink-0">
                    <FileText className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-theme-primary">Documents</p>
                    <p className="text-[10px] text-theme-muted">
                      {storageData?.docCount || 0} files • {formatFileSize(storageData?.docBytes || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Itemized Files List */}
              <div className="space-y-2 pt-2">
                <h5 className="text-xs font-bold text-theme-primary">
                  Shared Files ({storageData?.files?.length || 0})
                </h5>
                {!storageData?.files || storageData.files.length === 0 ? (
                  <div className="text-center py-8 text-theme-muted text-xs">
                    <HardDrive className="h-6 w-6 mx-auto mb-1.5 opacity-40" />
                    <p>No files shared in this chat yet</p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {storageData.files.map((file, fIdx) => (
                      <div
                        key={fIdx}
                        className="p-2.5 rounded-xl border border-theme-border bg-theme-surface hover:bg-theme-surface-hover flex items-center justify-between gap-3 text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${
                              file.fileType === 'image'
                                ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                                : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                            }`}
                          >
                            {file.fileType === 'image' ? (
                              <ImageIcon className="h-4 w-4" />
                            ) : (
                              <FileText className="h-4 w-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-theme-primary truncate max-w-[200px] sm:max-w-[260px]">
                              {file.originalName}
                            </p>
                            <p className="text-[10px] text-theme-muted">
                              {formatFileSize(file.fileSize)} •{' '}
                              {new Date(file.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {file.fileType === 'image' ? (
                            <button
                              type="button"
                              onClick={() => onPreviewImage(file.url)}
                              className="p-1.5 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-theme-surface transition-colors cursor-pointer"
                              title="Preview"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          ) : null}
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={file.originalName}
                            className="p-1.5 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-theme-surface transition-colors cursor-pointer"
                            title="Download"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-theme-border bg-theme-surface-subtle flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-theme-border bg-theme-surface hover:bg-theme-surface-hover text-xs font-semibold text-theme-secondary transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
