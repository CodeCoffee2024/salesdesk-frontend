// Wraps Angular's generated service worker (ngsw-worker.js — asset/data-group
// caching per ngsw-config.json) with the custom event handling
// @angular/service-worker doesn't support extending: Background Sync (TASK-027
// offline draft queue) and Web Push (TASK-027 notifications). This is the
// standard, documented workaround for adding custom logic alongside Angular's
// service worker without ejecting it — importScripts runs ngsw-worker.js's own
// self.addEventListener calls in this same worker, so both sets of listeners
// coexist for every event type.
//
// __API_BASE_URL__ is a build-time placeholder — see vercel.json, which
// substitutes it the same way it substitutes environment.prod.ts's copy. A raw
// fetch() from inside a service worker resolves against the worker's own
// origin (the frontend's), not the API's, so this worker needs the absolute
// API URL explicitly rather than relying on a relative /api/... path.
importScripts('./ngsw-worker.js');

const API_BASE_URL = '__API_BASE_URL__';
const DB_NAME = 'salesdesk-offline';
const DB_VERSION = 1;
const PENDING_STORE = 'pendingDocuments';
const TOKEN_STORE = 'authToken';
const TOKEN_ID = 'current';
const SYNC_TAG = 'sync-documents';

// No onupgradeneeded handler here on purpose: Dexie (running in the page) owns
// schema creation for this database. This worker only ever reads/writes
// stores Dexie has already created and must never win an upgrade race against it.
function openOfflineDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAll(db, storeName) {
  return new Promise((resolve, reject) => {
    const request = db.transaction(storeName, 'readonly').objectStore(storeName).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAuthToken(db) {
  return new Promise((resolve, reject) => {
    const request = db.transaction(TOKEN_STORE, 'readonly').objectStore(TOKEN_STORE).get(TOKEN_ID);
    request.onsuccess = () => resolve(request.result ? request.result.value : null);
    request.onerror = () => reject(request.error);
  });
}

function deletePending(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PENDING_STORE, 'readwrite');
    tx.objectStore(PENDING_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function markFailed(db, id, errorMessage) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PENDING_STORE, 'readwrite');
    const store = tx.objectStore(PENDING_STORE);
    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      const record = getRequest.result;
      if (record) {
        record.status = 'failed';
        record.errorMessage = errorMessage;
        store.put(record);
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function syncPendingDocuments() {
  const db = await openOfflineDb();
  const [pending, token] = await Promise.all([getAll(db, PENDING_STORE), getAuthToken(db)]);

  for (const item of pending.filter((p) => p.status !== 'syncing')) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/documents`, {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: `Bearer ${token}` } : {}),
        body: JSON.stringify(item.payload)
      });

      if (response.ok) {
        await deletePending(db, item.id);
      } else {
        await markFailed(db, item.id, `Sync failed (HTTP ${response.status})`);
      }
    } catch {
      // Still offline, or the API is unreachable — leave it queued. The app's
      // own `online` listener (OfflineQueueService) is the guaranteed
      // fallback delivery path regardless of what happens to this sync event.
      await markFailed(db, item.id, 'Could not reach the server — will retry.');
    }
  }
}

self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(syncPendingDocuments());
  }
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'SalesDesk';
  const options = {
    body: data.body || '',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/icon-72x72.png',
    data: { url: data.url || '/' }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      const existing = clientsArr.find((c) => c.url.indexOf(self.location.origin) === 0);
      if (existing) {
        existing.focus();
        return existing.navigate(url);
      }
      return self.clients.openWindow(url);
    })
  );
});
