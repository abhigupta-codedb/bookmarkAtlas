import { Bookmark, Collection } from '../types';

export const extractDomain = (urlString: string): string => {
  try {
    let cleanUrl = urlString.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }
    const parsed = new URL(cleanUrl);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return urlString;
  }
};

export const normalizeUrl = (url: string): string => {
  let clean = url.trim();
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = 'https://' + clean;
  }
  try {
    const parsed = new URL(clean);
    return parsed.href;
  } catch {
    return clean;
  }
};

export const getFaviconUrl = (url: string): string => {
  const domain = extractDomain(url);
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
};

export const formatDate = (timestamp: number | undefined): string => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

export const COLLECTION_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#3b82f6', // Blue
  '#14b8a6', // Teal
  '#f97316', // Orange
];

export const getRandomCollectionColor = (seed?: string): string => {
  if (!seed) return COLLECTION_COLORS[0];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLLECTION_COLORS.length;
  return COLLECTION_COLORS[index];
};

/**
 * Generate standard Netscape Bookmark HTML file (compatible with Chrome, Safari, Firefox, Edge)
 */
export const generateNetscapeHtml = (bookmarks: Bookmark[], collections: Collection[]): string => {
  const collectionMap = new Map<string, Collection>(collections.map(c => [c.id, c]));
  
  // Group bookmarks by first collection or Inbox
  const bookmarksByCollection = new Map<string, Bookmark[]>();
  const unclassifiedBookmarks: Bookmark[] = [];

  bookmarks.forEach(bm => {
    if (!bm.collectionIds || bm.collectionIds.length === 0) {
      unclassifiedBookmarks.push(bm);
    } else {
      bm.collectionIds.forEach(colId => {
        const list = bookmarksByCollection.get(colId) || [];
        list.push(bm);
        bookmarksByCollection.set(colId, list);
      });
    }
  });

  let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
`;

  // Write collections
  collections.forEach(col => {
    html += `    <DT><H3 ADD_DATE="${Math.floor(col.createdAt / 1000)}">${escapeHtml(col.name)}</H3>\n    <DL><p>\n`;
    const colBookmarks = bookmarksByCollection.get(col.id) || [];
    colBookmarks.forEach(bm => {
      const tagsAttr = bm.tags.length > 0 ? ` TAGS="${escapeHtml(bm.tags.join(','))}"` : '';
      html += `        <DT><A HREF="${escapeHtml(bm.url)}" ADD_DATE="${Math.floor(bm.createdAt / 1000)}"${tagsAttr}>${escapeHtml(bm.title || bm.url)}</A>\n`;
      if (bm.description || bm.notes) {
        html += `        <DD>${escapeHtml(bm.description || bm.notes || '')}\n`;
      }
    });
    html += `    </DL><p>\n`;
  });

  // Write Inbox / Unclassified
  if (unclassifiedBookmarks.length > 0) {
    html += `    <DT><H3>Inbox</H3>\n    <DL><p>\n`;
    unclassifiedBookmarks.forEach(bm => {
      const tagsAttr = bm.tags.length > 0 ? ` TAGS="${escapeHtml(bm.tags.join(','))}"` : '';
      html += `        <DT><A HREF="${escapeHtml(bm.url)}" ADD_DATE="${Math.floor(bm.createdAt / 1000)}"${tagsAttr}>${escapeHtml(bm.title || bm.url)}</A>\n`;
      if (bm.description || bm.notes) {
        html += `        <DD>${escapeHtml(bm.description || bm.notes || '')}\n`;
      }
    });
    html += `    </DL><p>\n`;
  }

  html += `</DL><p>`;
  return html;
};

const escapeHtml = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export const downloadFile = (content: string, fileName: string, contentType: string) => {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const parseNetscapeHtml = (htmlText: string): { 
  bookmarks: Array<Partial<Bookmark>>; 
  collections: Array<{ name: string; parentName?: string }>; 
} => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, 'text/html');
  const links = doc.querySelectorAll('a');
  const bookmarks: Array<Partial<Bookmark>> = [];
  const foundCollections = new Set<string>();

  links.forEach(link => {
    const url = link.getAttribute('href');
    if (!url || !url.startsWith('http')) return;
    
    const title = link.textContent?.trim() || url;
    const tagsAttr = link.getAttribute('tags') || link.getAttribute('TAGS');
    const tags = tagsAttr ? tagsAttr.split(',').map(t => t.trim()).filter(Boolean) : [];
    
    // Look up parent folder (H3 in preceding DT)
    let parentFolder = '';
    let curr: Element | null = link.parentElement;
    while (curr && curr.tagName !== 'BODY') {
      if (curr.tagName === 'DL' && curr.previousElementSibling && curr.previousElementSibling.tagName === 'H3') {
        parentFolder = curr.previousElementSibling.textContent?.trim() || '';
        break;
      }
      curr = curr.parentElement;
    }

    if (parentFolder && parentFolder !== 'Bookmarks' && parentFolder !== 'Bookmarks Bar') {
      foundCollections.add(parentFolder);
    }

    bookmarks.push({
      title,
      url,
      tags,
      description: link.nextElementSibling?.tagName === 'DD' ? link.nextElementSibling.textContent?.trim() : '',
      collectionIds: parentFolder ? [parentFolder] : []
    });
  });

  return {
    bookmarks,
    collections: Array.from(foundCollections).map(name => ({ name }))
  };
};
