import React, { useState, useEffect } from 'react';
import { Collection } from '../types';
import { COLLECTION_COLORS } from '../lib/utils';
import { X, Folder, Layers, Check } from 'lucide-react';

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; parentCollectionId: string | null; color: string }) => Promise<void>;
  initialData?: Collection | null;
  existingCollections: Collection[];
}

export const CollectionModal: React.FC<CollectionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  existingCollections,
}) => {
  const [name, setName] = useState('');
  const [parentCollectionId, setParentCollectionId] = useState<string | null>(null);
  const [color, setColor] = useState(COLLECTION_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setParentCollectionId(initialData.parentCollectionId || null);
        setColor(initialData.color || COLLECTION_COLORS[0]);
      } else {
        setName('');
        setParentCollectionId(null);
        setColor(COLLECTION_COLORS[Math.floor(Math.random() * COLLECTION_COLORS.length)]);
      }
      setError(null);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  // Filter out self and its descendants to prevent circular parenting
  const eligibleParents = existingCollections.filter(c => {
    if (!initialData) return true;
    if (c.id === initialData.id) return false;
    if (c.parentCollectionId === initialData.id) return false;
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a collection name.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({
        name: name.trim(),
        parentCollectionId: parentCollectionId || null,
        color,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save collection');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Folder className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-white">
              {initialData ? 'Edit Collection' : 'Create Collection'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Collection Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Research, Tools, Architecture"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-white placeholder-slate-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Parent Collection (Optional)</span>
            </label>
            <select
              value={parentCollectionId || ''}
              onChange={(e) => setParentCollectionId(e.target.value ? e.target.value : null)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-white outline-none transition-all"
            >
              <option value="">None (Top-Level Collection)</option>
              {eligibleParents.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.parentCollectionId ? '(subcollection)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Color Accent
            </label>
            <div className="flex flex-wrap gap-2.5">
              {COLLECTION_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-4 h-4 text-white drop-shadow" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-medium text-white shadow-lg shadow-indigo-600/20 transition-all"
            >
              {isSubmitting ? 'Saving...' : initialData ? 'Save Changes' : 'Create Collection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
