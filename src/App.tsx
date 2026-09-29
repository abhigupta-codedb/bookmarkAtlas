/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bookmark, 
  Collection, 
  Tag, 
  UserProfile, 
  ViewMode 
} from './types';
import { 
  auth, 
  onAuthStateChanged, 
  signInWithGoogle, 
  logOut 
} from './lib/firebase';
import { 
  subscribeBookmarks, 
  subscribeCollections, 
  subscribeTags, 
  addBookmark, 
  updateBookmark, 
  deleteBookmark, 
  addCollection, 
  updateCollection, 
  deleteCollectionWithOptions, 
  seedSampleData 
} from './lib/firestoreService';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { VisualMap } from './components/VisualMap';
import { CardsView } from './components/CardsView';
import { ListView } from './components/ListView';
import { BookmarkModal } from './components/BookmarkModal';
import { CollectionModal } from './components/CollectionModal';
import { DeleteCollectionModal } from './components/DeleteCollectionModal';
import { DeleteBookmarkModal } from './components/DeleteBookmarkModal';
import { BookmarkDetailModal } from './components/BookmarkDetailModal';
import { ExportImportModal } from './components/ExportImportModal';
import { LandingPage } from './components/LandingPage';
import { EmptyState } from './components/EmptyState';
import { extractDomain, getFaviconUrl } from './lib/utils';
import { 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Sparkles, 
  Layers, 
  Compass, 
  FolderPlus,
  Loader2
} from 'lucide-react';

// Fallback initial sample data for Sandbox tour / Demo mode
const INITIAL_DEMO_COLLECTIONS: Collection[] = [
  { id: 'demo-c1', name: 'Research', parentCollectionId: null, color: '#6366f1', createdAt: Date.now() - 500000 },
  { id: 'demo-c2', name: 'Integrated Reporting', parentCollectionId: 'demo-c1', color: '#3b82f6', createdAt: Date.now() - 400000 },
  { id: 'demo-c3', name: 'Governance', parentCollectionId: 'demo-c1', color: '#06b6d4', createdAt: Date.now() - 300000 },
  { id: 'demo-c4', name: 'Tools & AI', parentCollectionId: null, color: '#10b981', createdAt: Date.now() - 200000 },
  { id: 'demo-c5', name: 'Travel & Trips', parentCollectionId: null, color: '#f59e0b', createdAt: Date.now() - 100000 },
];

const INITIAL_DEMO_BOOKMARKS: Bookmark[] = [
  {
    id: 'demo-b1',
    title: 'IFRS - Sustainability & Financial Standards',
    url: 'https://www.ifrs.org',
    description: 'Global accounting and sustainability disclosure standards for global capital markets.',
    favicon: 'https://www.google.com/s2/favicons?domain=ifrs.org&sz=64',
    collectionIds: ['demo-c1', 'demo-c2'],
    tags: ['IFRS', 'Reporting', 'ESG', 'Finance'],
    notes: 'Key reference for climate-related disclosures (S1 & S2 guidelines).',
    createdAt: Date.now() - 120000,
    updatedAt: Date.now() - 120000,
  },
  {
    id: 'demo-b2',
    title: 'Harvard Corporate Governance Forum',
    url: 'https://corpgov.law.harvard.edu',
    description: 'Forum on corporate governance, board accountability, and shareholder rights.',
    favicon: 'https://www.google.com/s2/favicons?domain=corpgov.law.harvard.edu&sz=64',
    collectionIds: ['demo-c1', 'demo-c3'],
    tags: ['Governance', 'Papers', 'Law'],
    notes: 'Review recent papers on board diversity and audit committee roles.',
    createdAt: Date.now() - 100000,
    updatedAt: Date.now() - 100000,
  },
  {
    id: 'demo-b3',
    title: 'arXiv Computer Science & Machine Learning',
    url: 'https://arxiv.org/corr',
    description: 'Open-access archive for 2+ million scholarly articles in computer science, ML, and statistics.',
    favicon: 'https://www.google.com/s2/favicons?domain=arxiv.org&sz=64',
    collectionIds: ['demo-c1'],
    tags: ['Papers', 'AI', 'Machine Learning'],
    notes: 'Check daily alerts for transformer architectures and graph neural networks.',
    createdAt: Date.now() - 90000,
    updatedAt: Date.now() - 90000,
  },
  {
    id: 'demo-b4',
    title: 'Tailwind CSS Documentation',
    url: 'https://tailwindcss.com',
    description: 'A utility-first CSS framework packed with classes that can be composed directly in your markup.',
    favicon: 'https://www.google.com/s2/favicons?domain=tailwindcss.com&sz=64',
    collectionIds: ['demo-c4'],
    tags: ['React', 'CSS', 'UI', 'Frontend'],
    notes: 'New v4 engine features and color palette guide.',
    createdAt: Date.now() - 80000,
    updatedAt: Date.now() - 80000,
  },
  {
    id: 'demo-b5',
    title: 'D3.js Data-Driven Documents',
    url: 'https://d3js.org',
    description: 'JavaScript library for visualizing data using SVG, Canvas, and HTML with force simulations.',
    favicon: 'https://www.google.com/s2/favicons?domain=d3js.org&sz=64',
    collectionIds: ['demo-c4'],
    tags: ['Visualization', 'JavaScript', 'Graph'],
    notes: 'D3 force simulation patterns for interactive constellation layouts.',
    createdAt: Date.now() - 70000,
    updatedAt: Date.now() - 70000,
  },
  {
    id: 'demo-b6',
    title: 'Japan Rail Pass & Shinkansen Guide',
    url: 'https://japanrailpass.net',
    description: 'Official comprehensive travel guide for rail pass holders across Tokyo, Kyoto, and Hokkaido.',
    favicon: 'https://www.google.com/s2/favicons?domain=japanrailpass.net&sz=64',
    collectionIds: ['demo-c5'],
    tags: ['Travel', 'Japan', 'Trains'],
    notes: 'Check route planner from Tokyo to Kanazawa via Hokuriku Shinkansen.',
    createdAt: Date.now() - 60000,
    updatedAt: Date.now() - 60000,
  },
  {
    id: 'demo-b7',
    title: 'Prompt Engineering Guide - DAIR.AI',
    url: 'https://www.promptingguide.ai',
    description: 'Guides, papers, and resources for state-of-the-art LLM prompting and evaluation techniques.',
    favicon: 'https://www.google.com/s2/favicons?domain=promptingguide.ai&sz=64',
    collectionIds: [], // Inbox test item
    tags: ['AI', 'Research', 'Tools'],
    notes: 'Saved to Inbox for quick review later on weekend.',
    createdAt: Date.now() - 40000,
    updatedAt: Date.now() - 40000,
  }
];

export default function App() {
  // Auth state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // App Data state
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Modals state
  const [bookmarkModalOpen, setBookmarkModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);

  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [createSubParentId, setCreateSubParentId] = useState<string | null>(null);

  const [deletingCollection, setDeletingCollection] = useState<Collection | null>(null);
  const [deletingBookmark, setDeletingBookmark] = useState<Bookmark | null>(null);
  const [detailBookmark, setDetailBookmark] = useState<Bookmark | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setCurrentUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });
        setIsDemoMode(false);
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen to Firestore when user is logged in
  useEffect(() => {
    if (!currentUser || isDemoMode) {
      if (isDemoMode) {
        setCollections(INITIAL_DEMO_COLLECTIONS);
        setBookmarks(INITIAL_DEMO_BOOKMARKS);
        setTags([
          { id: 't1', name: 'IFRS', createdAt: 0 },
          { id: 't2', name: 'Reporting', createdAt: 0 },
          { id: 't3', name: 'Governance', createdAt: 0 },
          { id: 't4', name: 'AI', createdAt: 0 },
          { id: 't5', name: 'Machine Learning', createdAt: 0 },
          { id: 't6', name: 'React', createdAt: 0 },
          { id: 't7', name: 'Travel', createdAt: 0 },
        ]);
        setDataLoading(false);
      }
      return;
    }

    setDataLoading(true);

    const unsubBookmarks = subscribeBookmarks(
      currentUser.uid,
      (bms) => {
        setBookmarks(bms);
        setDataLoading(false);
      },
      (err) => {
        console.error('Bookmarks error:', err);
        showToast('Error syncing bookmarks from cloud.', 'error');
        setDataLoading(false);
      }
    );

    const unsubCollections = subscribeCollections(
      currentUser.uid,
      (cols) => {
        setCollections(cols);
      },
      (err) => {
        console.error('Collections error:', err);
      }
    );

    const unsubTags = subscribeTags(
      currentUser.uid,
      (tgs) => {
        setTags(tgs);
      },
      (err) => {
        console.error('Tags error:', err);
      }
    );

    return () => {
      unsubBookmarks();
      unsubCollections();
      unsubTags();
    };
  }, [currentUser, isDemoMode]);

  // Handle Google Login
  const handleGoogleSignIn = async () => {
    try {
      setAuthError(null);
      await signInWithGoogle();
      showToast('Welcome to your private visual bookmark space!', 'success');
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || 'Google sign-in could not be completed.');
      throw err;
    }
  };

  // Handle Logout
  const handleSignOut = async () => {
    try {
      if (isDemoMode) {
        setIsDemoMode(false);
        setCurrentUser(null);
      } else {
        await logOut();
      }
      showToast('Signed out safely.', 'info');
    } catch (err: any) {
      console.error(err);
    }
  };

  // Start Demo Mode
  const handleStartDemo = () => {
    setIsDemoMode(true);
    setCurrentUser({
      uid: 'demo-user',
      email: 'guest@starlight.local',
      displayName: 'Guest Explorer',
      photoURL: null,
    });
    setCollections(INITIAL_DEMO_COLLECTIONS);
    setBookmarks(INITIAL_DEMO_BOOKMARKS);
    showToast('Launched live interactive sandbox tour!', 'info');
  };

  // Seed sample data helper
  const handleLoadSampleData = async () => {
    if (!currentUser) return;
    try {
      setIsSeeding(true);
      if (isDemoMode) {
        setCollections(INITIAL_DEMO_COLLECTIONS);
        setBookmarks(INITIAL_DEMO_BOOKMARKS);
      } else {
        await seedSampleData(currentUser.uid);
      }
      showToast('Sample constellation loaded successfully!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Failed to load sample data.', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  // Bookmark CRUD handlers
  const handleSaveBookmark = async (data: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (isDemoMode) {
      if (editingBookmark) {
        setBookmarks(prev => prev.map(b => b.id === editingBookmark.id ? {
          ...b,
          ...data,
          updatedAt: Date.now(),
        } : b));
        showToast('Bookmark updated.');
      } else {
        const newBm: Bookmark = {
          ...data,
          id: `demo-${Date.now()}`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setBookmarks(prev => [newBm, ...prev]);
        showToast('Bookmark saved.');
      }
      setEditingBookmark(null);
      return;
    }

    if (!currentUser) return;

    if (editingBookmark) {
      await updateBookmark(currentUser.uid, editingBookmark.id, data);
      showToast('Bookmark updated.');
      setEditingBookmark(null);
    } else {
      await addBookmark(currentUser.uid, data);
      showToast('Bookmark added to constellation.');
    }
  };

  const handleDeleteBookmarkConfirm = async () => {
    if (!deletingBookmark) return;

    if (isDemoMode) {
      setBookmarks(prev => prev.filter(b => b.id !== deletingBookmark.id));
      setDeletingBookmark(null);
      showToast('Bookmark deleted.');
      return;
    }

    if (!currentUser) return;
    await deleteBookmark(currentUser.uid, deletingBookmark.id);
    showToast('Bookmark deleted.');
    setDeletingBookmark(null);
  };

  // Collection CRUD handlers
  const handleSaveCollection = async (data: { name: string; parentCollectionId: string | null; color: string }) => {
    if (isDemoMode) {
      if (editingCollection) {
        setCollections(prev => prev.map(c => c.id === editingCollection.id ? { ...c, ...data } : c));
        showToast('Collection updated.');
      } else {
        const newCol: Collection = {
          id: `demo-col-${Date.now()}`,
          ...data,
          createdAt: Date.now(),
        };
        setCollections(prev => [...prev, newCol]);
        showToast('Collection created.');
      }
      setEditingCollection(null);
      setCreateSubParentId(null);
      return;
    }

    if (!currentUser) return;

    if (editingCollection) {
      await updateCollection(currentUser.uid, editingCollection.id, data);
      showToast('Collection updated.');
      setEditingCollection(null);
    } else {
      await addCollection(currentUser.uid, data);
      showToast('Collection created.');
      setCreateSubParentId(null);
    }
  };

  const handleInlineCreateCollection = async (name: string): Promise<string> => {
    if (isDemoMode) {
      const id = `demo-col-${Date.now()}`;
      const newCol: Collection = {
        id,
        name,
        parentCollectionId: null,
        color: '#6366f1',
        createdAt: Date.now(),
      };
      setCollections(prev => [...prev, newCol]);
      return id;
    }

    if (!currentUser) throw new Error('Not authenticated');
    return await addCollection(currentUser.uid, { name });
  };

  const handleDeleteCollectionConfirm = async (
    action: 'move_to_inbox' | 'reassign' | 'delete_all_links',
    targetCollectionId?: string
  ) => {
    if (!deletingCollection) return;

    if (isDemoMode) {
      setCollections(prev => prev.filter(c => c.id !== deletingCollection.id));
      if (action === 'move_to_inbox') {
        setBookmarks(prev => prev.map(b => ({
          ...b,
          collectionIds: b.collectionIds.filter(id => id !== deletingCollection.id)
        })));
      } else if (action === 'reassign' && targetCollectionId) {
        setBookmarks(prev => prev.map(b => {
          if (!b.collectionIds.includes(deletingCollection.id)) return b;
          const filtered = b.collectionIds.filter(id => id !== deletingCollection.id);
          if (!filtered.includes(targetCollectionId)) filtered.push(targetCollectionId);
          return { ...b, collectionIds: filtered };
        }));
      } else if (action === 'delete_all_links') {
        setBookmarks(prev => prev.filter(b => !b.collectionIds.includes(deletingCollection.id)));
      }
      setDeletingCollection(null);
      showToast('Collection deleted and bookmarks re-routed safely.');
      return;
    }

    if (!currentUser) return;
    await deleteCollectionWithOptions(
      currentUser.uid,
      deletingCollection.id,
      action,
      targetCollectionId,
      bookmarks
    );
    showToast('Collection deleted.');
    setDeletingCollection(null);
  };

  // Import Handler
  const handleImport = async (
    importedBookmarks: Array<Partial<Bookmark>>, 
    importedCollections: Array<{ name: string }>
  ): Promise<number> => {
    let count = 0;

    // Create a mapping for collection names to IDs
    const colNameToId = new Map<string, string>();
    collections.forEach(c => colNameToId.set(c.name.toLowerCase(), c.id));

    // Ensure collections exist
    for (const c of importedCollections) {
      const lower = c.name.toLowerCase();
      if (!colNameToId.has(lower)) {
        if (isDemoMode) {
          const newId = `demo-col-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          setCollections(prev => [...prev, {
            id: newId,
            name: c.name,
            parentCollectionId: null,
            createdAt: Date.now(),
          }]);
          colNameToId.set(lower, newId);
        } else if (currentUser) {
          const newId = await addCollection(currentUser.uid, { name: c.name });
          colNameToId.set(lower, newId);
        }
      }
    }

    // Insert Bookmarks
    for (const bm of importedBookmarks) {
      if (!bm.url) continue;
      const mappedColIds: string[] = [];
      if (bm.collectionIds) {
        bm.collectionIds.forEach(colNameOrId => {
          const mapped = colNameToId.get(colNameOrId.toLowerCase()) || colNameOrId;
          if (mapped) mappedColIds.push(mapped);
        });
      }

      const bookmarkPayload = {
        title: bm.title || extractDomain(bm.url),
        url: bm.url,
        description: bm.description || '',
        notes: bm.notes || '',
        favicon: bm.favicon || getFaviconUrl(bm.url),
        collectionIds: mappedColIds,
        tags: bm.tags || [],
      };

      if (isDemoMode) {
        setBookmarks(prev => [
          {
            ...bookmarkPayload,
            id: `demo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          ...prev
        ]);
        count++;
      } else if (currentUser) {
        await addBookmark(currentUser.uid, bookmarkPayload);
        count++;
      }
    }

    return count;
  };

  // Filter bookmarks based on sidebar selection and search query
  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter(bm => {
      // Collection filter
      if (selectedCollectionId === 'inbox') {
        if (bm.collectionIds && bm.collectionIds.length > 0) return false;
      } else if (selectedCollectionId !== null) {
        if (!bm.collectionIds || !bm.collectionIds.includes(selectedCollectionId)) return false;
      }

      // Tag filter
      if (selectedTag) {
        if (!bm.tags.includes(selectedTag)) return false;
      }

      // Search query filter (for Cards and List views)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = bm.title.toLowerCase().includes(q);
        const matchesUrl = bm.url.toLowerCase().includes(q);
        const matchesDesc = bm.description?.toLowerCase().includes(q) || false;
        const matchesNotes = bm.notes?.toLowerCase().includes(q) || false;
        const matchesTags = bm.tags.some(t => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesUrl && !matchesDesc && !matchesNotes && !matchesTags) {
          return false;
        }
      }

      return true;
    });
  }, [bookmarks, selectedCollectionId, selectedTag, searchQuery]);

  // Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
        <span className="text-xs font-medium">Initializing Starlight...</span>
      </div>
    );
  }

  // Not signed in & not in demo -> Show Landing Page
  if (!currentUser && !isDemoMode) {
    return (
      <LandingPage
        onSignInWithGoogle={handleGoogleSignIn}
        onStartDemo={handleStartDemo}
        authError={authError}
      />
    );
  }

  // Active collection entity for header / empty state
  const activeCollection = collections.find(c => c.id === selectedCollectionId);

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'} antialiased selection:bg-indigo-500 selection:text-white`}>
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl text-xs text-white animate-in slide-in-from-top duration-200">
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
          {toast.type === 'info' && <Sparkles className="w-4 h-4 text-sky-400 flex-shrink-0" />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Demo Banner */}
      {isDemoMode && (
        <div className="bg-gradient-to-r from-indigo-900/90 via-purple-900/90 to-sky-900/90 border-b border-indigo-500/30 px-4 py-2 text-xs flex items-center justify-between z-40">
          <div className="flex items-center gap-2 text-indigo-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>
              <strong>Sandbox Tour Active:</strong> You are exploring with sample data.
            </span>
          </div>
          <button
            onClick={handleGoogleSignIn}
            className="px-3 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-950 text-xs font-bold transition-all shadow"
          >
            Sign In with Google
          </button>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAddModal={() => {
          setEditingBookmark(null);
          setBookmarkModalOpen(true);
        }}
        onOpenExportModal={() => setExportModalOpen(true)}
        user={currentUser}
        onSignOut={handleSignOut}
        onToggleSidebar={() => setSidebarOpenMobile(!sidebarOpenMobile)}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
      />

      {/* Workspace Shell */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          collections={collections}
          bookmarks={bookmarks}
          tags={tags}
          selectedCollectionId={selectedCollectionId}
          onSelectCollection={setSelectedCollectionId}
          selectedTag={selectedTag}
          onSelectTag={setSelectedTag}
          onOpenCreateCollection={(parentId) => {
            setEditingCollection(null);
            setCreateSubParentId(parentId || null);
            setCollectionModalOpen(true);
          }}
          onEditCollection={(col) => {
            setEditingCollection(col);
            setCollectionModalOpen(true);
          }}
          onDeleteCollection={(col) => setDeletingCollection(col)}
          isOpenMobile={sidebarOpenMobile}
          onCloseMobile={() => setSidebarOpenMobile(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {/* Active Filter Indicator Bar if filtered */}
          {(selectedCollectionId !== null || selectedTag !== null || searchQuery.trim() !== '') && (
            <div className="h-10 px-6 border-b border-slate-800/60 bg-slate-900/40 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-slate-500">Filtering:</span>
                {selectedCollectionId === 'inbox' && (
                  <span className="font-semibold text-sky-400">Inbox (Unclassified)</span>
                )}
                {activeCollection && (
                  <span className="font-semibold text-indigo-400 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" />
                    {activeCollection.name}
                  </span>
                )}
                {selectedTag && (
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    #{selectedTag}
                  </span>
                )}
                {searchQuery.trim() && (
                  <span className="text-slate-400">
                    matching "<strong className="text-white">{searchQuery}</strong>"
                  </span>
                )}
              </div>

              <button
                onClick={() => {
                  setSelectedCollectionId(null);
                  setSelectedTag(null);
                  setSearchQuery('');
                }}
                className="text-[11px] text-slate-400 hover:text-indigo-400 transition-colors"
              >
                Reset filters
              </button>
            </div>
          )}

          {/* View Render */}
          {viewMode === 'map' ? (
            <div className="flex-1 relative overflow-hidden flex flex-col">
              {bookmarks.length === 0 ? (
                <EmptyState
                  type="all"
                  onAddBookmark={() => {
                    setEditingBookmark(null);
                    setBookmarkModalOpen(true);
                  }}
                  onLoadSamples={handleLoadSampleData}
                  isSeeding={isSeeding}
                />
              ) : (
                <VisualMap
                  bookmarks={bookmarks}
                  collections={collections}
                  searchQuery={searchQuery}
                  selectedCollectionId={selectedCollectionId}
                  selectedTag={selectedTag}
                  onSelectBookmark={(bm) => setDetailBookmark(bm)}
                  onEditBookmark={(bm) => {
                    setEditingBookmark(bm);
                    setBookmarkModalOpen(true);
                  }}
                  isDarkMode={isDarkMode}
                />
              )}
            </div>
          ) : viewMode === 'cards' ? (
            <div className="flex-1 overflow-y-auto">
              {filteredBookmarks.length === 0 ? (
                <EmptyState
                  type={
                    searchQuery ? 'search' :
                    selectedCollectionId === 'inbox' ? 'inbox' :
                    selectedCollectionId ? 'collection' :
                    selectedTag ? 'tag' : 'all'
                  }
                  searchQuery={searchQuery}
                  collectionName={activeCollection?.name}
                  tagName={selectedTag || undefined}
                  onAddBookmark={() => {
                    setEditingBookmark(null);
                    setBookmarkModalOpen(true);
                  }}
                  onLoadSamples={handleLoadSampleData}
                  onClearFilters={() => {
                    setSearchQuery('');
                    setSelectedCollectionId(null);
                    setSelectedTag(null);
                  }}
                  isSeeding={isSeeding}
                />
              ) : (
                <CardsView
                  bookmarks={filteredBookmarks}
                  collections={collections}
                  onSelectBookmark={(bm) => setDetailBookmark(bm)}
                  onEditBookmark={(bm) => {
                    setEditingBookmark(bm);
                    setBookmarkModalOpen(true);
                  }}
                  onDeleteBookmark={(bm) => setDeletingBookmark(bm)}
                />
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {filteredBookmarks.length === 0 ? (
                <EmptyState
                  type={
                    searchQuery ? 'search' :
                    selectedCollectionId === 'inbox' ? 'inbox' :
                    selectedCollectionId ? 'collection' :
                    selectedTag ? 'tag' : 'all'
                  }
                  searchQuery={searchQuery}
                  collectionName={activeCollection?.name}
                  tagName={selectedTag || undefined}
                  onAddBookmark={() => {
                    setEditingBookmark(null);
                    setBookmarkModalOpen(true);
                  }}
                  onLoadSamples={handleLoadSampleData}
                  onClearFilters={() => {
                    setSearchQuery('');
                    setSelectedCollectionId(null);
                    setSelectedTag(null);
                  }}
                  isSeeding={isSeeding}
                />
              ) : (
                <ListView
                  bookmarks={filteredBookmarks}
                  collections={collections}
                  onSelectBookmark={(bm) => setDetailBookmark(bm)}
                  onEditBookmark={(bm) => {
                    setEditingBookmark(bm);
                    setBookmarkModalOpen(true);
                  }}
                  onDeleteBookmark={(bm) => setDeletingBookmark(bm)}
                />
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modals & Dialogs */}
      <BookmarkModal
        isOpen={bookmarkModalOpen}
        onClose={() => {
          setBookmarkModalOpen(false);
          setEditingBookmark(null);
        }}
        onSave={handleSaveBookmark}
        initialData={editingBookmark}
        collections={collections}
        existingTags={tags}
        existingBookmarks={bookmarks}
        onCreateCollection={handleInlineCreateCollection}
      />

      <CollectionModal
        isOpen={collectionModalOpen}
        onClose={() => {
          setCollectionModalOpen(false);
          setEditingCollection(null);
          setCreateSubParentId(null);
        }}
        onSave={handleSaveCollection}
        initialData={editingCollection}
        existingCollections={collections}
      />

      <DeleteCollectionModal
        isOpen={!!deletingCollection}
        onClose={() => setDeletingCollection(null)}
        collection={deletingCollection}
        allCollections={collections}
        bookmarks={bookmarks}
        onConfirm={handleDeleteCollectionConfirm}
      />

      <DeleteBookmarkModal
        isOpen={!!deletingBookmark}
        onClose={() => setDeletingBookmark(null)}
        bookmark={deletingBookmark}
        onConfirm={handleDeleteBookmarkConfirm}
      />

      <BookmarkDetailModal
        isOpen={!!detailBookmark}
        onClose={() => setDetailBookmark(null)}
        bookmark={detailBookmark}
        collections={collections}
        onEdit={(bm) => {
          setDetailBookmark(null);
          setEditingBookmark(bm);
          setBookmarkModalOpen(true);
        }}
        onDelete={(bm) => {
          setDetailBookmark(null);
          setDeletingBookmark(bm);
        }}
      />

      <ExportImportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        bookmarks={bookmarks}
        collections={collections}
        onImport={handleImport}
      />
    </div>
  );
}
