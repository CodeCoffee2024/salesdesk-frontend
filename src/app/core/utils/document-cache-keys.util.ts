import { DocumentType } from '../models/document.model';

/** TASK-041: the documents list is cached per tab (server-side filtered by type+search), so a single "documents" key would silently mix results across tabs. */
export const DOCUMENTS_CACHE_KEY_PREFIX = 'documents:';

export type DocumentListTab = 'all' | 'quote' | 'invoice';

export function documentsListCacheKey(tab: DocumentListTab): string {
  return `${DOCUMENTS_CACHE_KEY_PREFIX}${tab}`;
}

/**
 * Deliberately a *different* prefix ("document-detail:", not "documents:") from
 * the list cache above — DocumentService.upsertInMatchingLists/removeFromMatchingLists
 * scan every cached key starting with DOCUMENTS_CACHE_KEY_PREFIX assuming each one
 * holds a Document[]; a detail entry holds a single Document, so it must live
 * outside that prefix or that scan would crash trying to .findIndex/.map it as a list.
 */
export function documentDetailCacheKey(id: string): string {
  return `document-detail:${id}`;
}

/**
 * Whether a document of `documentType` belongs in the cached list at `key` —
 * used by DocumentService to decide whether a newly created/converted document
 * should be inserted into a cached tab it doesn't already appear in (an edit to
 * a document already present in a tab's cache is always applied regardless,
 * see LocalCacheService.upsertInMatchingLists).
 */
export function documentBelongsInCachedList(key: string, documentType: DocumentType): boolean {
  if (key === documentsListCacheKey('quote')) {
    return documentType === 'Quote';
  }
  if (key === documentsListCacheKey('invoice')) {
    return documentType === 'Invoice';
  }
  return true;
}
