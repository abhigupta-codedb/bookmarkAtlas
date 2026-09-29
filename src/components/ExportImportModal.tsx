import React, { useState } from 'react';
import { Bookmark, Collection } from '../types';
import { 
  downloadFile, 
  generateNetscapeHtml, 
  parseNetscapeHtml 
} from '../lib/utils';
import { 
  X, 
  Download, 
  Upload, 
  FileCode, 
  FileText, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: Bookmark[];
  collections: Collection[];
  onImport: (bookmarks: Array<Partial<Bookmark>>, collections: Array<{ name: string }>) => Promise<number>;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  bookmarks,
  collections,
  onImport,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle Export to JSON
  const handleExportJson = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      collections,
      bookmarks,
    };
    const jsonStr = JSON.stringify(exportData, null, 2);
    downloadFile(jsonStr, `starlight-bookmarks-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  };

  // Handle Export to standard Netscape Bookmark HTML
  const handleExportHtml = () => {
    const htmlStr = generateNetscapeHtml(bookmarks, collections);
    downloadFile(htmlStr, `bookmarks-${new Date().toISOString().split('T')[0]}.html`, 'text/html');
  };

  // Handle File Upload for Import
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportStatus(null);
    setImportError(null);

    try {
      const text = await file.text();
      let importedBookmarks: Array<Partial<Bookmark>> = [];
      let importedCollections: Array<{ name: string }> = [];

      if (file.name.endsWith('.json') || file.type === 'application/json') {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed.bookmarks)) {
          importedBookmarks = parsed.bookmarks;
          importedCollections = Array.isArray(parsed.collections) ? parsed.collections : [];
        } else if (Array.isArray(parsed)) {
          importedBookmarks = parsed;
        } else {
          throw new Error('Unrecognized JSON format. Expected an array of bookmarks or an export object.');
        }
      } else {
        // Parse as Netscape HTML
        const result = parseNetscapeHtml(text);
        importedBookmarks = result.bookmarks;
        importedCollections = result.collections;
      }

      if (importedBookmarks.length === 0) {
        throw new Error('No valid bookmarks found in the uploaded file.');
      }

      const count = await onImport(importedBookmarks, importedCollections);
      setImportStatus(`Successfully imported ${count} bookmarks and organized collections!`);
    } catch (err: any) {
      setImportError(err.message || 'Failed to parse and import bookmark file.');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('export')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'export'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Export Data
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'import'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Import Bookmarks
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'export' ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Take your data anywhere. Export your visual library, collections, tags, and notes with one click.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* HTML Export Button */}
                <button
                  onClick={handleExportHtml}
                  className="flex flex-col items-start p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-indigo-500/60 transition-all text-left group"
                >
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors">
                    Browser HTML
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Standard Netscape format for Chrome, Safari, Firefox & Edge.
                  </p>
                </button>

                {/* JSON Export Button */}
                <button
                  onClick={handleExportJson}
                  className="flex flex-col items-start p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-indigo-500/60 transition-all text-left group"
                >
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-semibold text-white group-hover:text-purple-300 transition-colors">
                    Full JSON Data
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Includes all notes, tags, colors, and hierarchical structures.
                  </p>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Total Bookmarks: <strong className="text-white">{bookmarks.length}</strong></span>
                <span>Collections: <strong className="text-white">{collections.length}</strong></span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Import bookmarks from a browser HTML export or a JSON backup file.
              </p>

              {importStatus && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{importStatus}</span>
                </div>
              )}

              {importError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              <label className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-slate-700 hover:border-indigo-500/60 bg-slate-950/60 cursor-pointer transition-colors group">
                <Upload className="w-8 h-8 text-slate-500 group-hover:text-indigo-400 mb-2 transition-colors" />
                <span className="text-xs font-medium text-white group-hover:text-indigo-300">
                  {importing ? 'Processing bookmarks...' : 'Choose .html or .json file to upload'}
                </span>
                <span className="text-[10px] text-slate-500 mt-1">
                  Supports exported bookmarks from Google Chrome, Brave, Safari, Firefox
                </span>
                <input
                  type="file"
                  accept=".html,.htm,.json"
                  disabled={importing}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-800 bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
