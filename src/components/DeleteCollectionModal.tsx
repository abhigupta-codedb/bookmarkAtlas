import React, { useState } from 'react';
import { Collection, Bookmark } from '../types';
import { AlertTriangle, X, Inbox, ArrowRight } from 'lucide-react';

interface DeleteCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection: Collection | null;
  allCollections: Collection[];
  bookmarks: Bookmark[];
  onConfirm: (action: 'move_to_inbox' | 'reassign' | 'delete_all_links', targetCollectionId?: string) => Promise<void>;
}

export const DeleteCollectionModal: React.FC<DeleteCollectionModalProps> = ({
  isOpen,
  onClose,
  collection,
  allCollections,
  bookmarks,
  onConfirm,
}) => {
  const [action, setAction] = useState<'move_to_inbox' | 'reassign'>('move_to_inbox');
  const [targetCollectionId, setTargetCollectionId] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !collection) return null;

  // Number of affected bookmarks
  const affectedBookmarksCount = bookmarks.filter(b => b.collectionIds.includes(collection.id)).length;
  // Available other collections for reassign
  const otherCollections = allCollections.filter(c => c.id !== collection.id);

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      await onConfirm(action, action === 'reassign' ? targetCollectionId : undefined);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
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
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-white">
              Delete "{collection.name}"?
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            This collection contains <span className="font-semibold text-white">{affectedBookmarksCount} bookmark{affectedBookmarksCount === 1 ? '' : 's'}</span>. 
            Deleting the collection will not destroy your saved bookmarks. Please choose where they should be kept:
          </p>

          <div className="space-y-2">
            <label 
              className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                action === 'move_to_inbox'
                  ? 'bg-indigo-500/10 border-indigo-500 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <input
                type="radio"
                name="deleteAction"
                checked={action === 'move_to_inbox'}
                onChange={() => setAction('move_to_inbox')}
                className="mt-0.5 accent-indigo-500"
              />
              <div className="text-xs">
                <span className="font-semibold flex items-center gap-1.5 text-white">
                  <Inbox className="w-3.5 h-3.5 text-indigo-400" />
                  Move to Inbox (Unclassified)
                </span>
                <span className="text-slate-400 block mt-0.5">
                  Keep bookmarks safe in your Inbox so you can re-organize them at any time.
                </span>
              </div>
            </label>

            {otherCollections.length > 0 && (
              <label 
                className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                  action === 'reassign'
                    ? 'bg-indigo-500/10 border-indigo-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <input
                  type="radio"
                  name="deleteAction"
                  checked={action === 'reassign'}
                  onChange={() => {
                    setAction('reassign');
                    if (!targetCollectionId && otherCollections[0]) {
                      setTargetCollectionId(otherCollections[0].id);
                    }
                  }}
                  className="mt-0.5 accent-indigo-500"
                />
                <div className="text-xs flex-1">
                  <span className="font-semibold flex items-center gap-1.5 text-white">
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                    Move to another collection
                  </span>
                  {action === 'reassign' && (
                    <select
                      value={targetCollectionId}
                      onChange={(e) => setTargetCollectionId(e.target.value)}
                      className="mt-2 w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none"
                    >
                      {otherCollections.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </label>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-xs font-medium text-white shadow-lg shadow-rose-600/20 transition-all"
          >
            {isDeleting ? 'Deleting...' : 'Delete Collection'}
          </button>
        </div>
      </div>
    </div>
  );
};
