
export type ContentSource = 'Reddit' | 'Newsletter';

export interface ContentHook {
  id: string;
  text: string;
}

export interface ContentItem {
  id: string;
  title: string;
  snippet: string;
  source: ContentSource;
  timestamp: string;
  imageUrl?: string;
  isSaved?: boolean;
  hooks?: ContentHook[];
  isGeneratingHooks?: boolean;
}

export type AppTab = 'Feed' | 'Saved' | 'Settings';
