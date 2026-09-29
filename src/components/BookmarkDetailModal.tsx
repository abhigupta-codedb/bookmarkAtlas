import React from 'react';
import { Bookmark, Collection } from '../types';
import { extractDomain, formatDate } from '../lib/utils';
import { 
  X, 
  ExternalLink, 
  Copy, 
  Check, 
  Edit3, 
  Trash2, 
  Layers, 
  Tag as TagIcon, 
  Calendar, 
  FileText 
} from 'lucide-react';

interface BookmarkDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookmark: Bookmark | null;
  collections: Collection[];
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (bookmark: Bookmark) => void;
}

export const BookmarkDetailModal: React.FC<BookmarkDetailModalProps> = ({
  isOpen,
  onClose,
  bookmark,
  collections,
  onEdit,
  onDelete,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !bookmark) return null;

  const domain = extractDomain(bookmark.url);
  const collectionMap = new Map<string, Collection>(collections.map(c => [c.id, c]));
  const parentCollections = (bookmark.collectionIds || [])
    .map(id => collectionMap.get(id))
    .filter((c): c is Collection => Boolean(c));

  const handleCopy = () => {
    navigator.clipboard.writeText(bookmark.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center p-1.5 flex-shrink-0 border border-slate-700/60">
              <img
                src={bookmark.favicon || `https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                alt=""
                className="w-4 h-4 rounded-xs"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <span className="text-xs font-mono text-indigo-400 truncate">
              {domain}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Title */}
          <div>
            <h2 className="text-lg font-bold text-white leading-snug">
              {bookmark.title || domain}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-mono text-slate-400 truncate flex-1 select-all">
                {bookmark.url}
              </span>
              <button
                onClick={handleCopy}
                title="Copy URL"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition-all shadow-md shadow-indigo-600/20"
              >
                <span>Visit</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Description */}
          {bookmark.description && (
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Description
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                {bookmark.description}
              </p>
            </div>
          )}

          {/* Personal Notes */}
          {bookmark.notes && (
            <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Notes & Highlights</span>
              </h4>
              <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                {bookmark.notes}
              </p>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80">
              <span className="text-[11px] text-slate-500 block mb-1.5 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Collections</span>
              </span>
              <div className="flex flex-wrap gap-1">
                {parentCollections.length > 0 ? (
                  parentCollections.map(col => (
                    <span
                      key={col.id}
                      className="px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/20"
                    >
                      {col.name}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-slate-400">Inbox</span>
                )}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80">
              <span className="text-[11px] text-slate-500 block mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                <span>Saved Date</span>
              </span>
              <span className="text-xs text-slate-300 font-medium">
                {formatDate(bookmark.createdAt)}
              </span>
            </div>
          </div>

          {/* Tags */}
          {bookmark.tags.length > 0 && (
            <div>
              <span className="text-[11px] text-slate-500 block mb-1.5 flex items-center gap-1">
                <TagIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Tags</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {bookmark.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 text-slate-300 border border-slate-700/60"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/50">
          <button
            onClick={() => {
              onClose();
              onDelete(bookmark);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(bookmark);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
