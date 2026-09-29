import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { Bookmark, Collection, Tag } from '../types';
import { extractDomain, getFaviconUrl } from './utils';

// Bookmarks
export const subscribeBookmarks = (
  userId: string, 
  callback: (bookmarks: Bookmark[]) => void,
  onError?: (error: Error) => void
) => {
  const bookmarksRef = collection(db, 'users', userId, 'bookmarks');
  const q = query(bookmarksRef, orderBy('createdAt', 'desc'));
  
  return onSnapshot(
    q, 
    (snapshot) => {
      const items: Bookmark[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          title: data.title || '',
          url: data.url || '',
          description: data.description || '',
          favicon: data.favicon || getFaviconUrl(data.url || ''),
          collectionIds: data.collectionIds || [],
          tags: data.tags || [],
          notes: data.notes || '',
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now(),
        });
      });
      callback(items);
    },
    (err) => {
      console.error('Firestore bookmarks subscription error:', err);
      if (onError) onError(err);
    }
  );
};

// Collections
export const subscribeCollections = (
  userId: string, 
  callback: (collections: Collection[]) => void,
  onError?: (error: Error) => void
) => {
  const colRef = collection(db, 'users', userId, 'collections');
  const q = query(colRef, orderBy('name', 'asc'));
  
  return onSnapshot(
    q, 
    (snapshot) => {
      const items: Collection[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          name: data.name || '',
          parentCollectionId: data.parentCollectionId || null,
          color: data.color || '#6366f1',
          icon: data.icon || 'Folder',
          createdAt: data.createdAt || Date.now(),
        });
      });
      callback(items);
    },
    (err) => {
      console.error('Firestore collections subscription error:', err);
      if (onError) onError(err);
    }
  );
};

// Tags
export const subscribeTags = (
  userId: string, 
  callback: (tags: Tag[]) => void,
  onError?: (error: Error) => void
) => {
  const tagsRef = collection(db, 'users', userId, 'tags');
  const q = query(tagsRef, orderBy('name', 'asc'));
  
  return onSnapshot(
    q, 
    (snapshot) => {
      const items: Tag[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          name: data.name || '',
          color: data.color || '#8b5cf6',
          createdAt: data.createdAt || Date.now(),
        });
      });
      callback(items);
    },
    (err) => {
      console.error('Firestore tags subscription error:', err);
      if (onError) onError(err);
    }
  );
};

// Add Bookmark
export const addBookmark = async (userId: string, data: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const newDocRef = doc(collection(db, 'users', userId, 'bookmarks'));
  const now = Date.now();
  const favicon = data.favicon || getFaviconUrl(data.url);
  const title = data.title.trim() || extractDomain(data.url);

  await setDoc(newDocRef, {
    title,
    url: data.url.trim(),
    description: data.description?.trim() || '',
    favicon,
    collectionIds: data.collectionIds || [],
    tags: data.tags || [],
    notes: data.notes?.trim() || '',
    createdAt: now,
    updatedAt: now,
  });

  return newDocRef.id;
};

// Update Bookmark
export const updateBookmark = async (userId: string, id: string, data: Partial<Bookmark>): Promise<void> => {
  const docRef = doc(db, 'users', userId, 'bookmarks', id);
  const updateData: any = {
    ...data,
    updatedAt: Date.now(),
  };
  delete updateData.id;
  await updateDoc(docRef, updateData);
};

// Delete Bookmark
export const deleteBookmark = async (userId: string, id: string): Promise<void> => {
  const docRef = doc(db, 'users', userId, 'bookmarks', id);
  await deleteDoc(docRef);
};

// Add Collection
export const addCollection = async (
  userId: string, 
  data: { name: string; parentCollectionId?: string | null; color?: string; icon?: string }
): Promise<string> => {
  const newDocRef = doc(collection(db, 'users', userId, 'collections'));
  await setDoc(newDocRef, {
    name: data.name.trim(),
    parentCollectionId: data.parentCollectionId || null,
    color: data.color || '#6366f1',
    icon: data.icon || 'Folder',
    createdAt: Date.now(),
  });
  return newDocRef.id;
};

// Update Collection
export const updateCollection = async (
  userId: string, 
  id: string, 
  data: Partial<Collection>
): Promise<void> => {
  const docRef = doc(db, 'users', userId, 'collections', id);
  const updateData: any = { ...data };
  delete updateData.id;
  await updateDoc(docRef, updateData);
};

// Delete Collection with options
export const deleteCollectionWithOptions = async (
  userId: string,
  collectionId: string,
  action: 'move_to_inbox' | 'reassign' | 'delete_all_links',
  targetCollectionId?: string,
  bookmarks: Bookmark[] = []
): Promise<void> => {
  const batch = writeBatch(db);

  // 1. Delete collection doc
  const colDocRef = doc(db, 'users', userId, 'collections', collectionId);
  batch.delete(colDocRef);

  // 2. Handle bookmarks that include this collectionId
  const affectedBookmarks = bookmarks.filter(b => b.collectionIds.includes(collectionId));
  for (const bm of affectedBookmarks) {
    const bmRef = doc(db, 'users', userId, 'bookmarks', bm.id);
    if (action === 'move_to_inbox') {
      const newColIds = bm.collectionIds.filter(id => id !== collectionId);
      batch.update(bmRef, { collectionIds: newColIds, updatedAt: Date.now() });
    } else if (action === 'reassign' && targetCollectionId) {
      const filtered = bm.collectionIds.filter(id => id !== collectionId);
      if (!filtered.includes(targetCollectionId)) {
        filtered.push(targetCollectionId);
      }
      batch.update(bmRef, { collectionIds: filtered, updatedAt: Date.now() });
    } else if (action === 'delete_all_links') {
      batch.delete(bmRef);
    }
  }

  await batch.commit();
};

// Seed initial sample data for new accounts
export const seedSampleData = async (userId: string): Promise<void> => {
  const batch = writeBatch(db);

  // Create sample collections
  const researchId = doc(collection(db, 'users', userId, 'collections')).id;
  const reportingId = doc(collection(db, 'users', userId, 'collections')).id;
  const governanceId = doc(collection(db, 'users', userId, 'collections')).id;
  const toolsId = doc(collection(db, 'users', userId, 'collections')).id;
  const travelId = doc(collection(db, 'users', userId, 'collections')).id;

  batch.set(doc(db, 'users', userId, 'collections', researchId), {
    name: 'Research',
    parentCollectionId: null,
    color: '#6366f1',
    createdAt: Date.now() - 500000,
  });

  batch.set(doc(db, 'users', userId, 'collections', reportingId), {
    name: 'Integrated Reporting',
    parentCollectionId: researchId,
    color: '#3b82f6',
    createdAt: Date.now() - 400000,
  });

  batch.set(doc(db, 'users', userId, 'collections', governanceId), {
    name: 'Governance',
    parentCollectionId: researchId,
    color: '#06b6d4',
    createdAt: Date.now() - 300000,
  });

  batch.set(doc(db, 'users', userId, 'collections', toolsId), {
    name: 'Tools & AI',
    parentCollectionId: null,
    color: '#10b981',
    createdAt: Date.now() - 200000,
  });

  batch.set(doc(db, 'users', userId, 'collections', travelId), {
    name: 'Travel & Trips',
    parentCollectionId: null,
    color: '#f59e0b',
    createdAt: Date.now() - 100000,
  });

  // Create sample bookmarks
  const sampleBookmarks: Array<Omit<Bookmark, 'id'>> = [
    {
      title: 'IFRS - Sustainability & Financial Standards',
      url: 'https://www.ifrs.org',
      description: 'Global accounting and sustainability disclosure standards for global capital markets.',
      favicon: 'https://www.google.com/s2/favicons?domain=ifrs.org&sz=64',
      collectionIds: [researchId, reportingId],
      tags: ['IFRS', 'Reporting', 'ESG', 'Finance'],
      notes: 'Key reference for climate-related disclosures (S1 & S2 guidelines).',
      createdAt: Date.now() - 120000,
      updatedAt: Date.now() - 120000,
    },
    {
      title: 'Harvard Corporate Governance Forum',
      url: 'https://corpgov.law.harvard.edu',
      description: 'Forum on corporate governance, board accountability, and shareholder rights.',
      favicon: 'https://www.google.com/s2/favicons?domain=corpgov.law.harvard.edu&sz=64',
      collectionIds: [researchId, governanceId],
      tags: ['Governance', 'Papers', 'Law'],
      notes: 'Review recent papers on board diversity and audit committee roles.',
      createdAt: Date.now() - 100000,
      updatedAt: Date.now() - 100000,
    },
    {
      title: 'arXiv Computer Science & Machine Learning',
      url: 'https://arxiv.org/corr',
      description: 'Open-access archive for 2+ million scholarly articles in computer science, ML, and statistics.',
      favicon: 'https://www.google.com/s2/favicons?domain=arxiv.org&sz=64',
      collectionIds: [researchId],
      tags: ['Papers', 'AI', 'Machine Learning'],
      notes: 'Check daily alerts for transformer architectures and graph neural networks.',
      createdAt: Date.now() - 90000,
      updatedAt: Date.now() - 90000,
    },
    {
      title: 'Tailwind CSS Documentation',
      url: 'https://tailwindcss.com',
      description: 'A utility-first CSS framework packed with classes that can be composed directly in your markup.',
      favicon: 'https://www.google.com/s2/favicons?domain=tailwindcss.com&sz=64',
      collectionIds: [toolsId],
      tags: ['React', 'CSS', 'UI', 'Frontend'],
      notes: 'New v4 engine features and color palette guide.',
      createdAt: Date.now() - 80000,
      updatedAt: Date.now() - 80000,
    },
    {
      title: 'D3.js Data-Driven Documents',
      url: 'https://d3js.org',
      description: 'JavaScript library for visualizing data using SVG, Canvas, and HTML with force simulations.',
      favicon: 'https://www.google.com/s2/favicons?domain=d3js.org&sz=64',
      collectionIds: [toolsId],
      tags: ['Visualization', 'JavaScript', 'Graph'],
      notes: 'D3 force simulation patterns for interactive constellation layouts.',
      createdAt: Date.now() - 70000,
      updatedAt: Date.now() - 70000,
    },
    {
      title: 'Japan Rail Pass & Shinkansen Guide',
      url: 'https://japanrailpass.net',
      description: 'Official comprehensive travel guide for rail pass holders across Tokyo, Kyoto, and Hokkaido.',
      favicon: 'https://www.google.com/s2/favicons?domain=japanrailpass.net&sz=64',
      collectionIds: [travelId],
      tags: ['Travel', 'Japan', 'Trains'],
      notes: 'Check route planner from Tokyo to Kanazawa via Hokuriku Shinkansen.',
      createdAt: Date.now() - 60000,
      updatedAt: Date.now() - 60000,
    },
    {
      title: 'Switzerland Swiss Travel System',
      url: 'https://www.myswitzerland.com',
      description: 'Official tourism portal for Swiss Alpine passes, scenic train routes, and mountain huts.',
      favicon: 'https://www.google.com/s2/favicons?domain=myswitzerland.com&sz=64',
      collectionIds: [travelId],
      tags: ['Travel', 'Hotel', 'Hiking'],
      notes: 'Bernese Oberland hiking trails and Zermatt peak train tickets.',
      createdAt: Date.now() - 50000,
      updatedAt: Date.now() - 50000,
    },
    {
      title: 'Prompt Engineering Guide - DAIR.AI',
      url: 'https://www.promptingguide.ai',
      description: 'Guides, papers, and resources for state-of-the-art LLM prompting and evaluation techniques.',
      favicon: 'https://www.google.com/s2/favicons?domain=promptingguide.ai&sz=64',
      collectionIds: [], // Inbox test item!
      tags: ['AI', 'Research', 'Tools'],
      notes: 'Saved to Inbox for quick review later on weekend.',
      createdAt: Date.now() - 40000,
      updatedAt: Date.now() - 40000,
    }
  ];

  sampleBookmarks.forEach(bm => {
    const bmRef = doc(collection(db, 'users', userId, 'bookmarks'));
    batch.set(bmRef, bm);
  });

  await batch.commit();
};
