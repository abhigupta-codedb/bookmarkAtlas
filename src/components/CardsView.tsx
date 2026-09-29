import React from 'react';
import { Bookmark, Collection } from '../types';
import { extractDomain, formatDate } from '../lib/utils';
import { 
  ExternalLink, 
  Tag as TagIcon, 
  Layers, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Copy, 
  Check, 
  FileText 
} from 'lucide-react';

interface CardsViewProps {
  bookmarks: Bookmark[];
  collections: Collection[];
  onSelectBookmark: (bookmark: Bookmark) => void;
  onEditBookmark: (bookmark: Bookmark) => void;
  onDeleteBookmark: (bookmark: Bookmark) => void;
}

export const CardsView: React.FC<CardsViewProps> = ({
  bookmarks,
  collections,
  onSelectBookmark,
  onEditBookmark,
  onDeleteBookmark,
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = React.useState<string | null>(null);

  const collectionMap = React.useMemo(() => {
    return new Map<string, Collection>(collections.map(c => [c.id, c]));
  }, [collections]);

  const handleCopy = (e: React.MouseEvent, bm: Bookmark) => {
    e.stopPropagation();
    navigator.clipboard.writeText(bm.url);
    setCopiedId(bm.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto max-h-full">
      {bookmarks.map((bm) => {
        const domain = extractDomain(bm.url);
        const parentCollections = (bm.collectionIds || [])
          .map(id => collectionMap.get(id))
          .filter((c): c is Collection => Boolean(c));

        return (
          <div
            key={bm.id}
            onClick={() => onSelectBookmark(bm)}
            className="group relative flex flex-col justify-between rounded-2xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800/90 hover:border-slate-700/80 p-5 transition-all duration-200 shadow-sm hover:shadow-xl hover:-translate-y-0.5 cursor-pointer"
          >
            <div>
              {/* Header: Favicon, Domain, Actions */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-slate-800/80 flex items-center justify-center p-1.5 flex-shrink-0 border border-slate-700/50">
                    <img
                      src={bm.favicon || `https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                      alt=""
                      className="w-4 h-4 rounded-sm object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <span className="text-xs font-mono text-slate-400 group-hover:text-indigo-400 transition-colors truncate">
                    {domain}
                  </span>
                </div>

                {/* Top Action Buttons */}
                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleCopy(e, bm)}
                    title="Copy URL"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    {copiedId === bm.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <a
                    href={bm.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title="Open website"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-sky-300 hover:bg-sky-500/10 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  {/* Menu trigger */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === bm.id ? null : bm.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>

                    {activeMenuId === bm.id && (
                      <div 
                        className="absolute right-0 top-full mt-1 w-36 rounded-xl bg-slate-900 border border-slate-700 shadow-xl py-1 z-30"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            onEditBookmark(bm);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 text-left"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            onDeleteBookmark(bm);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-left"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-sm font-semibold text-white group-hover:text-indigo-200 transition-colors line-clamp-2 leading-snug mb-2">
                {bm.title || domain}
              </h3>

              {/* Description */}
              {bm.description && (
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                  {bm.description}
                </p>
              )}

              {/* Notes Indicator if notes exist */}
              {bm.notes && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-950/50 rounded-lg px-2.5 py-1 mb-3">
                  <FileText className="w-3 h-3 text-amber-400/80 flex-shrink-0" />
                  <span className="truncate italic">{bm.notes}</span>
                </div>
              )}
            </div>

            {/* Footer with Collections, Tags, and Date */}
            <div className="pt-3 border-t border-slate-800/80 mt-2 space-y-2">
              <div className="flex flex-wrap gap-1.5 items-center">
                {parentCollections.length > 0 ? (
                  parentCollections.map((col) => (
                    <span
                      key={col.id}
                      className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
                      style={{ borderColor: col.color ? `${col.color}40` : undefined }}
                    >
                      <Layers className="w-2.5 h-2.5" />
                      {col.name}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] font-medium text-slate-400 px-2 py-0.5 rounded-md bg-slate-800/80">
                    Inbox
                  </span>
                )}

                {bm.tags.slice(0, 3).map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60"
                  >
                    <TagIcon className="w-2.5 h-2.5 text-slate-400" />
                    {tag}
                  </span>
                ))}
                {bm.tags.length > 3 && (
                  <span className="text-[10px] text-slate-500">+{bm.tags.length - 3}</span>
                )}
              </div>

              <div className="text-[10px] text-slate-500">
                Added {formatDate(bm.createdAt)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
