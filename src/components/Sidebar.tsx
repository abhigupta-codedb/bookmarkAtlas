import React, { useState } from 'react';
import { Collection, Bookmark, Tag } from '../types';
import { 
  Compass, 
  Inbox, 
  Folder, 
  FolderPlus, 
  ChevronDown, 
  ChevronRight, 
  Tag as TagIcon, 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  X, 
  Plus, 
  Layers
} from 'lucide-react';

interface SidebarProps {
  collections: Collection[];
  bookmarks: Bookmark[];
  tags: Tag[];
  selectedCollectionId: string | null;
  onSelectCollection: (colId: string | null) => void;
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  onOpenCreateCollection: (parentId?: string | null) => void;
  onEditCollection: (col: Collection) => void;
  onDeleteCollection: (col: Collection) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collections,
  bookmarks,
  tags,
  selectedCollectionId,
  onSelectCollection,
  selectedTag,
  onSelectTag,
  onOpenCreateCollection,
  onEditCollection,
  onDeleteCollection,
  isOpenMobile,
  onCloseMobile,
}) => {
  const [collapsedParents, setCollapsedParents] = useState<Set<string>>(new Set());
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Group collections into root and children
  const rootCollections = collections.filter(c => !c.parentCollectionId);
  const childCollectionsMap = new Map<string, Collection[]>();
  collections.forEach(c => {
    if (c.parentCollectionId) {
      const list = childCollectionsMap.get(c.parentCollectionId) || [];
      list.push(c);
      childCollectionsMap.set(c.parentCollectionId, list);
    }
  });

  // Calculate bookmark counts per collection & inbox
  const bookmarkCountByCol = new Map<string, number>();
  let inboxCount = 0;
  bookmarks.forEach(bm => {
    if (!bm.collectionIds || bm.collectionIds.length === 0) {
      inboxCount++;
    } else {
      bm.collectionIds.forEach(cid => {
        bookmarkCountByCol.set(cid, (bookmarkCountByCol.get(cid) || 0) + 1);
      });
    }
  });

  // Unique tags with counts
  const tagCounts = new Map<string, number>();
  bookmarks.forEach(bm => {
    bm.tags.forEach(t => {
      tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
    });
  });

  const toggleCollapse = (colId: string) => {
    setCollapsedParents(prev => {
      const next = new Set(prev);
      if (next.has(colId)) {
        next.delete(colId);
      } else {
        next.add(colId);
      }
      return next;
    });
  };

  const renderCollectionItem = (col: Collection, isSub = false) => {
    const isSelected = selectedCollectionId === col.id;
    const children = childCollectionsMap.get(col.id) || [];
    const hasChildren = children.length > 0;
    const isCollapsed = collapsedParents.has(col.id);
    const count = bookmarkCountByCol.get(col.id) || 0;

    return (
      <div key={col.id} className="relative group">
        <div
          onClick={() => {
            onSelectCollection(col.id);
            onCloseMobile();
          }}
          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
            isSelected
              ? 'bg-indigo-600/20 text-white border border-indigo-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          } ${isSub ? 'ml-4' : ''}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {hasChildren && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCollapse(col.id);
                }}
                className="p-0.5 text-slate-500 hover:text-white"
              >
                {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}

            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: col.color || '#6366f1' }}
            />

            <span className="truncate">{col.name}</span>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {count > 0 && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono text-slate-400 bg-slate-800/80">
                {count}
              </span>
            )}

            {/* Hover Actions Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenuId(activeMenuId === col.id ? null : col.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-opacity"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>

              {activeMenuId === col.id && (
                <div 
                  className="absolute right-0 top-full mt-1 w-36 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-1 z-40"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      setActiveMenuId(null);
                      onOpenCreateCollection(col.id);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 text-left"
                  >
                    <Plus className="w-3 h-3 text-indigo-400" />
                    <span>Add Subcollection</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveMenuId(null);
                      onEditCollection(col);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 text-left"
                  >
                    <Edit2 className="w-3 h-3 text-slate-400" />
                    <span>Rename</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveMenuId(null);
                      onDeleteCollection(col);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-left"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Subcollections recursion */}
        {hasChildren && !isCollapsed && (
          <div className="mt-1 space-y-1">
            {children.map(child => renderCollectionItem(child, true))}
          </div>
        )}
      </div>
    );
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between p-4 bg-slate-950 border-r border-slate-800/80 w-64 flex-shrink-0 select-none overflow-y-auto">
      <div className="space-y-6">
        {/* Mobile Header with close */}
        <div className="md:hidden flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="text-xs font-semibold text-white uppercase tracking-wider">Navigation</span>
          <button onClick={onCloseMobile} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Core */}
        <div className="space-y-1">
          {/* All Bookmarks */}
          <button
            onClick={() => {
              onSelectCollection(null);
              onSelectTag(null);
              onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              selectedCollectionId === null && selectedTag === null
                ? 'bg-indigo-600/20 text-white border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-400" />
              <span>All Bookmarks</span>
            </div>
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono text-slate-400 bg-slate-800/80">
              {bookmarks.length}
            </span>
          </button>

          {/* Inbox (Unclassified) */}
          <button
            onClick={() => {
              onSelectCollection('inbox');
              onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              selectedCollectionId === 'inbox'
                ? 'bg-indigo-600/20 text-white border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <Inbox className="w-4 h-4 text-sky-400" />
              <span>Inbox</span>
            </div>
            {inboxCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono text-sky-300 bg-sky-500/20">
                {inboxCount}
              </span>
            )}
          </button>
        </div>

        {/* Collections Section */}
        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-indigo-400" />
              <span>Collections</span>
            </span>
            <button
              onClick={() => onOpenCreateCollection(null)}
              title="Add New Collection"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            {rootCollections.map(col => renderCollectionItem(col))}

            {rootCollections.length === 0 && (
              <div className="px-3 py-2 text-xs text-slate-500 italic">
                No collections yet. Click + to create one!
              </div>
            )}
          </div>
        </div>

        {/* Tags Section */}
        {tagCounts.size > 0 && (
          <div>
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <TagIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Tags</span>
              </span>
              {selectedTag && (
                <button
                  onClick={() => onSelectTag(null)}
                  className="text-[10px] text-slate-400 hover:text-indigo-400"
                >
                  Clear filter
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 px-2">
              {Array.from(tagCounts.entries()).map(([tag, count]) => {
                const isSelected = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => {
                      onSelectTag(isSelected ? null : tag);
                      onCloseMobile();
                    }}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span>#{tag}</span>
                    <span className="text-[9px] opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="pt-4 border-t border-slate-900 text-[11px] text-slate-500 flex items-center justify-between">
        <span>Private Workspace</span>
        <span className="w-2 h-2 rounded-full bg-emerald-500" title="Connected to Firestore" />
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block h-full">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 w-72 h-full bg-slate-950 shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
