import React from 'react';
import { 
  Sparkles, 
  Inbox, 
  Search, 
  FolderPlus, 
  Tag as TagIcon, 
  Plus, 
  Compass, 
  Wand2 
} from 'lucide-react';

interface EmptyStateProps {
  type: 'all' | 'inbox' | 'search' | 'collection' | 'tag';
  searchQuery?: string;
  collectionName?: string;
  tagName?: string;
  onAddBookmark: () => void;
  onLoadSamples?: () => void;
  onClearFilters?: () => void;
  isSeeding?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  searchQuery,
  collectionName,
  tagName,
  onAddBookmark,
  onLoadSamples,
  onClearFilters,
  isSeeding,
}) => {
  if (type === 'search') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
        <div className="w-14 h-14 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mb-4 shadow-xl">
          <Search className="w-6 h-6 text-indigo-400" />
        </div>
        <h3 className="text-base font-bold text-white mb-1.5">No bookmarks found</h3>
        <p className="text-xs text-slate-400 leading-relaxed mb-5">
          We couldn't find any bookmarks matching "<span className="text-indigo-300 font-medium">{searchQuery}</span>". 
          Try searching by title, URL, tag, or notes.
        </p>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
          >
            Clear Search
          </button>
        )}
      </div>
    );
  }

  if (type === 'inbox') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
        <div className="w-14 h-14 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mb-4 shadow-xl">
          <Inbox className="w-6 h-6 text-sky-400" />
        </div>
        <h3 className="text-base font-bold text-white mb-1.5">Your Inbox is Clear</h3>
        <p className="text-xs text-slate-400 leading-relaxed mb-5">
          All your bookmarks have been categorized into collections. Any bookmarks saved without a collection will arrive here.
        </p>
        <button
          onClick={onAddBookmark}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Save Link to Inbox</span>
        </button>
      </div>
    );
  }

  if (type === 'collection') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
        <div className="w-14 h-14 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mb-4 shadow-xl">
          <FolderPlus className="w-6 h-6 text-indigo-400" />
        </div>
        <h3 className="text-base font-bold text-white mb-1.5">"{collectionName}" is empty</h3>
        <p className="text-xs text-slate-400 leading-relaxed mb-5">
          No bookmarks have been filed in this collection yet. Add a new bookmark or edit an existing one to include it.
        </p>
        <button
          onClick={onAddBookmark}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Bookmark Here</span>
        </button>
      </div>
    );
  }

  if (type === 'tag') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
        <div className="w-14 h-14 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mb-4 shadow-xl">
          <TagIcon className="w-6 h-6 text-purple-400" />
        </div>
        <h3 className="text-base font-bold text-white mb-1.5">No #{tagName} bookmarks</h3>
        <p className="text-xs text-slate-400 leading-relaxed mb-5">
          No bookmarks are currently tagged with #{tagName}.
        </p>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
          >
            Show All Bookmarks
          </button>
        )}
      </div>
    );
  }

  // Default / Empty Universe state
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600/20 to-sky-400/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-2xl">
          <Compass className="w-10 h-10 animate-spin-slow" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-lg">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
      </div>

      <h3 className="text-xl font-bold text-white tracking-tight mb-2">
        Your bookmark universe is empty
      </h3>
      <p className="text-xs text-slate-400 leading-relaxed mb-6 max-w-sm">
        Save your first link and watch your knowledge map illuminate. Or load our curated research & tools constellation to explore right away.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={onAddBookmark}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-xl shadow-indigo-600/25 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Save First Bookmark</span>
        </button>

        {onLoadSamples && (
          <button
            onClick={onLoadSamples}
            disabled={isSeeding}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 transition-all hover:border-indigo-500/50"
          >
            <Wand2 className="w-4 h-4 text-indigo-400" />
            <span>{isSeeding ? 'Creating Constellation...' : 'Load Sample Constellation'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
