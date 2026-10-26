import React from 'react';
import {
  Folder,
  HardDrive,
  X,
  Loader2,
  Image as ImageIcon,
  FileText,
  Download,
  ExternalLink,
  Eye,
} from 'lucide-react';

export const ChatMediaDrawer = ({
  isOpen,
  onClose,
  mediaData = { media: [], docs: [], links: [] },
  isLoading = false,
  activeTab = 'media',
  onTabChange,
  onOpenStorage,
  onPreviewImage,
  formatFileSize,
}) => {
  if (!isOpen) return null;

  return (
    <div className="w-80 sm:w-96 border-l border-theme-border bg-theme-surface flex flex-col z-20 animate-in slide-in-from-right duration-200 shadow-xl shrink-0">
      {/* Drawer Header */}
      <div className="p-4 border-b border-theme-border flex items-center justify-between bg-theme-surface-subtle">
        <div className="flex items-center gap-2">
          <Folder className="h-4 w-4 text-theme-brand" />
          <h3 className="text-xs font-bold text-theme-primary">Media, Links & Docs</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onOpenStorage}
            className="p-1 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-theme-surface-hover transition-colors cursor-pointer"
            title="View Storage Usage"
          >
            <HardDrive className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-theme-surface-hover transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 border-b border-theme-border bg-theme-surface text-xs font-semibold text-center">
        <button
          type="button"
          onClick={() => onTabChange('media')}
          className={`py-2.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'media'
              ? 'border-theme-brand text-theme-brand'
              : 'border-transparent text-theme-muted hover:text-theme-primary'
          }`}
        >
          Media ({mediaData.media?.length || 0})
        </button>
        <button
          type="button"
          onClick={() => onTabChange('docs')}
          className={`py-2.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'docs'
              ? 'border-theme-brand text-theme-brand'
              : 'border-transparent text-theme-muted hover:text-theme-primary'
          }`}
        >
          Docs ({mediaData.docs?.length || 0})
        </button>
        <button
          type="button"
          onClick={() => onTabChange('links')}
          className={`py-2.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'links'
              ? 'border-theme-brand text-theme-brand'
              : 'border-transparent text-theme-muted hover:text-theme-primary'
          }`}
        >
          Links ({mediaData.links?.length || 0})
        </button>
      </div>

      {/* Drawer Tab Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-theme-brand" />
          </div>
        ) : activeTab === 'media' ? (
          mediaData.media?.length === 0 ? (
            <div className="text-center py-12 text-theme-muted text-xs">
              <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No photos or media shared yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {mediaData.media.map((item, mIdx) => (
                <div
                  key={mIdx}
                  onClick={() => onPreviewImage(item.url)}
                  className="relative aspect-square rounded-lg overflow-hidden bg-theme-surface-subtle cursor-pointer group"
                >
                  <img
                    src={item.url}
                    alt={item.originalName || 'Photo'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Eye className="h-4 w-4" />
                  </div>
                </div>
              ))}
            </div>
          )
        ) : activeTab === 'docs' ? (
          mediaData.docs?.length === 0 ? (
            <div className="text-center py-12 text-theme-muted text-xs">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No documents or PDFs shared yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {mediaData.docs.map((doc, dIdx) => (
                <a
                  key={dIdx}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={doc.originalName}
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-theme-border bg-theme-surface-subtle hover:bg-theme-surface-hover transition-colors"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-theme-brand-subtle text-theme-brand shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-theme-primary truncate">
                      {doc.originalName || 'Document'}
                    </p>
                    <p className="text-[10px] text-theme-muted">
                      {formatFileSize(doc.fileSize)} •{' '}
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Download className="h-4 w-4 text-theme-muted hover:text-theme-primary shrink-0" />
                </a>
              ))}
            </div>
          )
        ) : mediaData.links?.length === 0 ? (
          <div className="text-center py-12 text-theme-muted text-xs">
            <ExternalLink className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No web links shared yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {mediaData.links.map((linkItem, lIdx) => (
              <a
                key={lIdx}
                href={linkItem.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl border border-theme-border bg-theme-surface-subtle hover:bg-theme-surface-hover transition-colors flex items-start gap-2.5"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-500/10 text-sky-500 shrink-0 mt-0.5">
                  <ExternalLink className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-sky-500 truncate">
                    {linkItem.url}
                  </p>
                  <p className="text-[11px] text-theme-secondary line-clamp-2 mt-0.5">
                    {linkItem.text}
                  </p>
                  <p className="text-[9px] text-theme-muted mt-1">
                    {new Date(linkItem.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
