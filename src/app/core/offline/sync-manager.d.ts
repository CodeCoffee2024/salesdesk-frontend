// TypeScript's bundled lib.dom.d.ts doesn't include the Background Sync API
// (it's still non-standard, Chromium-only) — this augments the global types
// just enough to use it without `any`, matching the MDN/W3C draft shape.
interface SyncManager {
  register(tag: string): Promise<void>;
  getTags(): Promise<string[]>;
}

interface ServiceWorkerRegistration {
  readonly sync: SyncManager;
}
