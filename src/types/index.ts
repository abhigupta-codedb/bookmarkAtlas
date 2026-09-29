export interface Bookmark {
  id: string;
  title: string;
  url: string;
  description?: string;
  favicon?: string;
  collectionIds: string[];
  tags: string[];
  notes?: string;
  createdAt: number; // Unix timestamp in ms
  updatedAt: number;
}

export interface Collection {
  id: string;
  name: string;
  parentCollectionId?: string | null;
  color?: string;
  icon?: string;
  createdAt: number;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  createdAt: number;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export type ViewMode = 'map' | 'cards' | 'list';

export interface FilterState {
  searchQuery: string;
  selectedCollectionId: string | null; // null means 'all', or 'inbox', or specific collection id
  selectedTag: string | null;
}

// Graph node types for D3
export type NodeType = 'collection' | 'subcollection' | 'bookmark';

export interface GraphNode {
  id: string;
  title: string;
  type: NodeType;
  data: Bookmark | Collection;
  expanded?: boolean;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  color?: string;
  radius?: number;
  parentId?: string | null;
  childCount?: number;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  id: string;
}
