import React, { useState, useEffect } from 'react';
import { Bookmark, Collection, Tag } from '../types';
import { extractDomain, getFaviconUrl } from '../lib/utils';
import { 
  X, 
  ExternalLink, 
  Layers, 
  Tag as TagIcon, 
  AlertCircle, 
  FolderPlus, 
  Sparkles,
  Check
} from 'lucide-react';

interface BookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialData?: Bookmark | null;
  collections: Collection[];
  existingTags: Tag[];
  existingBookmarks: Bookmark[];
  onCreateCollection?: (name: string) => Promise<string>;
}

export const BookmarkModal: React.FC<BookmarkModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  collections,
  existingTags,
  existingBookmarks,
  onCreateCollection,
}) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick collection inline creation
  const [isCreatingCol, setIsCreatingCol] = useState(false);
  const [newColName, setNewColName] = useState('');

  // Populate data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setUrl(initialData.url);
        setTitle(initialData.title);
        setDescription(initialData.description || '');
        setNotes(initialData.notes || '');
        setSelectedCollectionIds(initialData.collectionIds || []);
        setTags(initialData.tags || []);
      } else {
        setUrl('');
        setTitle('');
        setDescription('');
        setNotes('');
        setSelectedCollectionIds([]);
        setTags([]);
      }
      setTagInput('');
      setIsCreatingCol(false);
      setNewColName('');
      setError(null);
    }
  }, [isOpen, initialData]);

  // Derive title from URL when user stops typing URL if title is blank
  const handleUrlBlur = () => {
    if (!url.trim()) return;
    try {
      if (!title.trim()) {
        const domain = extractDomain(url);
        // capitalize domain name nicely
        const cleanName = domain.split('.')[0];
        const capitalized = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
        setTitle(capitalized);
      }
    } catch {
      // ignore
    }
  };

  // Duplicate URL check
  const duplicateBookmark = React.useMemo(() => {
    if (!url.trim()) return null;
    const cleanCurrent = url.trim().toLowerCase().replace(/\/$/, '');
    return existingBookmarks.find(b => 
      b.id !== initialData?.id &&
      b.url.toLowerCase().replace(/\/$/, '') === cleanCurrent
    );
  }, [url, existingBookmarks, initialData]);

  if (!isOpen) return null;

  const handleAddTag = (tagToAdd: string) => {
    const clean = tagToAdd.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const toggleCollection = (colId: string) => {
    setSelectedCollectionIds(prev => 
      prev.includes(colId) ? prev.filter(id => id !== colId) : [...prev, colId]
    );
  };

  const handleCreateCollection = async () => {
    if (!newColName.trim() || !onCreateCollection) return;
    try {
      const createdId = await onCreateCollection(newColName.trim());
      setSelectedCollectionIds(prev => [...prev, createdId]);
      setNewColName('');
      setIsCreatingCol(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create collection');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Please provide a valid website URL.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      let cleanUrl = url.trim();
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = 'https://' + cleanUrl;
      }

      const favicon = getFaviconUrl(cleanUrl);
      const computedTitle = title.trim() || extractDomain(cleanUrl);

      await onSave({
        url: cleanUrl,
        title: computedTitle,
        description: description.trim(),
        notes: notes.trim(),
        favicon,
        collectionIds: selectedCollectionIds,
        tags,
      });

      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save bookmark.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-white">
              {initialData ? 'Edit Bookmark' : 'Add New Bookmark'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {duplicateBookmark && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>
                Note: A bookmark with this URL already exists in your library ("{duplicateBookmark.title}").
              </span>
            </div>
          )}

          {/* URL Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              URL <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={handleUrlBlur}
              placeholder="https://example.com/article"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-white placeholder-slate-500 outline-none transition-all font-mono"
            />
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Next-Generation Visual Discovery"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-white placeholder-slate-500 outline-none transition-all"
            />
          </div>

          {/* Collections Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Collections</span>
                <span className="text-[11px] font-normal text-slate-500">(Leave empty for Inbox)</span>
              </label>

              {onCreateCollection && !isCreatingCol && (
                <button
                  type="button"
                  onClick={() => setIsCreatingCol(true)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <FolderPlus className="w-3 h-3" />
                  <span>+ New Collection</span>
                </button>
              )}
            </div>

            {/* Inline Collection Creator */}
            {isCreatingCol && (
              <div className="flex items-center gap-2 mb-2 p-2 bg-slate-950 rounded-xl border border-slate-800">
                <input
                  type="text"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  placeholder="Collection name..."
                  className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 outline-none px-2"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateCollection();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleCreateCollection}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingCol(false)}
                  className="p-1 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Collection Badges / Toggles */}
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
              {collections.map(col => {
                const isSelected = selectedCollectionIds.includes(col.id);
                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => toggleCollection(col.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    <span>{col.name}</span>
                    {col.parentCollectionId && (
                      <span className="text-[10px] opacity-70">
                        (sub)
                      </span>
                    )}
                  </button>
                );
              })}

              {collections.length === 0 && (
                <p className="text-xs text-slate-500 py-1">
                  No collections created yet. Bookmark will be placed in Inbox.
                </p>
              )}
            </div>
          </div>

          {/* Tags Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <TagIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Tags</span>
            </label>

            {/* Current Tags Chips */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 text-xs border border-slate-700"
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  handleAddTag(tagInput);
                }
              }}
              placeholder="Type tag and press Enter (e.g. AI, Travel, Papers)..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-white placeholder-slate-500 outline-none transition-all"
            />

            {/* Suggested existing tags */}
            {existingTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="text-[10px] text-slate-500 self-center mr-1">Suggestions:</span>
                {existingTags
                  .filter(t => !tags.includes(t.name))
                  .slice(0, 6)
                  .map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleAddTag(t.name)}
                      className="text-[11px] px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
                    >
                      +{t.name}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Description / Summary
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief context about this link..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-white placeholder-slate-500 outline-none transition-all resize-none"
            />
          </div>

          {/* Personal Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Personal Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Thoughts, key quotes, or action items..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-white placeholder-slate-500 outline-none transition-all resize-none"
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800/80 bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-medium text-white shadow-lg shadow-indigo-600/20 transition-all"
          >
            {isSubmitting ? 'Saving...' : initialData ? 'Save Changes' : 'Add Bookmark'}
          </button>
        </div>
      </div>
    </div>
  );
};
