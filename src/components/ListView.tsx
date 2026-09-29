import React, { useState } from 'react';
import { Bookmark, Collection } from '../types';
import { extractDomain, formatDate } from '../lib/utils';
import { 
  ExternalLink, 
  Tag as TagIcon, 
  Layers, 
  Edit3, 
  Trash2, 
  ArrowUpDown,
  FileText
} from 'lucide-react';

interface ListViewProps {
  bookmarks: Bookmark[];
  collections: Collection[];
  onSelectBookmark: (bookmark: Bookmark) => void;
  onEditBookmark: (bookmark: Bookmark) => void;
  onDeleteBookmark: (bookmark: Bookmark) => void;
}

export const ListView: React.FC<ListViewProps> = ({
  bookmarks,
  collections,
  onSelectBookmark,
  onEditBookmark,
  onDeleteBookmark,
}) => {
  const [sortField, setSortField] = useState<'date' | 'title' | 'domain'>('date');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const collectionMap = React.useMemo(() => {
    return new Map<string, Collection>(collections.map(c => [c.id, c]));
  }, [collections]);

  const sortedBookmarks = React.useMemo(() => {
    return [...bookmarks].sort((a, b) => {
      let result = 0;
      if (sortField === 'date') {
        result = (a.createdAt || 0) - (b.createdAt || 0);
      } else if (sortField === 'title') {
        result = (a.title || '').localeCompare(b.title || '');
      } else if (sortField === 'domain') {
        result = extractDomain(a.url).localeCompare(extractDomain(b.url));
      }
      return sortAsc ? result : -result;
    });
  }, [bookmarks, sortField, sortAsc]);

  const toggleSort = (field: 'date' | 'title' | 'domain') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="w-full overflow-x-auto max-h-full p-6">
      <div className="min-w-[750px] rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/90 text-xs font-semibold text-slate-400">
              <th className="py-3 px-4">
                <button
                  onClick={() => toggleSort('title')}
                  className="flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  <span>Title & Link</span>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </th>
              <th className="py-3 px-4">
                <button
                  onClick={() => toggleSort('domain')}
                  className="flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  <span>Domain</span>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </th>
              <th className="py-3 px-4">Collection</th>
              <th className="py-3 px-4">Tags</th>
              <th className="py-3 px-4">
                <button
                  onClick={() => toggleSort('date')}
                  className="flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  <span>Date Saved</span>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
            {sortedBookmarks.map((bm) => {
              const domain = extractDomain(bm.url);
              const parentCollections = (bm.collectionIds || [])
                .map(id => collectionMap.get(id))
                .filter((c): c is Collection => Boolean(c));

              return (
                <tr
                  key={bm.id}
                  onClick={() => onSelectBookmark(bm)}
                  className="group hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  {/* Title & Favicon */}
                  <td className="py-3 px-4 max-w-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center p-1 flex-shrink-0">
                        <img
                          src={bm.favicon || `https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                          alt=""
                          className="w-3.5 h-3.5 rounded-xs"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="truncate">
                        <span className="font-medium text-white group-hover:text-indigo-300 transition-colors">
                          {bm.title || domain}
                        </span>
                        {bm.notes && (
                          <span title={bm.notes} className="inline-block ml-1.5 align-middle">
                            <FileText className="w-3 h-3 text-amber-400 inline" />
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Domain */}
                  <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                    {domain}
                  </td>

                  {/* Collection */}
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {parentCollections.length > 0 ? (
                        parentCollections.map(col => (
                          <span
                            key={col.id}
                            className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/25"
                          >
                            <Layers className="w-2.5 h-2.5" />
                            {col.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-500 px-1.5 py-0.5 rounded bg-slate-800">
                          Inbox
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Tags */}
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {bm.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400"
                        >
                          <TagIcon className="w-2.5 h-2.5" />
                          {tag}
                        </span>
                      ))}
                      {bm.tags.length === 0 && <span className="text-slate-600">—</span>}
                    </div>
                  </td>

                  {/* Date Saved */}
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                    {formatDate(bm.createdAt)}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <a
                        href={bm.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open link"
                        className="p-1 rounded text-slate-400 hover:text-sky-300 hover:bg-sky-500/10 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => onEditBookmark(bm)}
                        title="Edit"
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteBookmark(bm)}
                        title="Delete"
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
