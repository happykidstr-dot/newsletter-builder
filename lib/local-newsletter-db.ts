/**
 * Local-first, browser-owned drafts. IndexedDB can store large photographs
 * without consuming localStorage's small synchronous quota.
 * This store is not a cross-device backup and may be cleared by the browser.
 */
const DB_NAME = 'bulten-read-offline-v1';
const VERSION = 1;
const DOCUMENTS = 'newsletters';
const DRAFTS = 'drafts';

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('Tarayıcı IndexedDB desteği bulunamadı.'));
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DOCUMENTS)) db.createObjectStore(DOCUMENTS, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(DRAFTS)) db.createObjectStore(DRAFTS, { keyPath: 'id' });
    };
    request.onerror = () => reject(request.error || new Error('Yerel arşiv açılamadı.'));
    request.onblocked = () => reject(new Error('Yerel arşiv başka bir sekme tarafından engellendi.'));
    request.onsuccess = () => resolve(request.result);
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Yerel kayıt okunamadı.'));
  });
}

async function transactionWrite(store: string, operation: (objectStore: IDBObjectStore) => void): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Tarayıcı depolama kotası aşıldı.'));
      tx.onabort = () => reject(tx.error || new Error('Tarayıcı depolama kotası aşıldı.'));
      try { operation(tx.objectStore(store)); }
      catch (error) { tx.abort(); reject(error); }
    });
  } finally { db.close(); }
}

async function transactionRead<T>(store: string, operation: (objectStore: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDatabase();
  try {
    return await requestResult(operation(db.transaction(store, 'readonly').objectStore(store)));
  } finally { db.close(); }
}

export async function saveLocalNewsletter<T extends { id: string }>(record: T): Promise<void> {
  if (!record.id) throw new Error('Bülten kimliği eksik.');
  await transactionWrite(DOCUMENTS, store => { store.put(record); });
}

export async function listLocalNewsletters<T extends { id: string; savedAt?: string }>(): Promise<T[]> {
  const records = await transactionRead<T[]>(DOCUMENTS, store => store.getAll());
  return records.sort((a, b) => (b.savedAt || '').localeCompare(a.savedAt || ''));
}

export async function removeLocalNewsletter(id: string): Promise<void> {
  await transactionWrite(DOCUMENTS, store => { store.delete(id); });
}

export async function saveLocalDraft<T>(record: T): Promise<void> {
  await transactionWrite(DRAFTS, store => { store.put({ id: 'active', content: record }); });
}

export async function loadLocalDraft<T>(): Promise<T | null> {
  const saved = await transactionRead<{ id: string; content: T } | undefined>(
    DRAFTS, store => store.get('active')
  );
  return saved?.content ?? null;
}

/** Erase both IndexedDB stores; localStorage removal alone misses Phase 2 drafts. */
export async function clearLocalNewsletterData():Promise<void>{
  const db=await openDatabase();
  try{
    await new Promise<void>((resolve,reject)=>{
      const tx=db.transaction([DOCUMENTS,DRAFTS],'readwrite');
      tx.oncomplete=()=>resolve();
      tx.onerror=()=>reject(tx.error||new Error('Yerel veriler silinemedi.'));
      tx.onabort=()=>reject(tx.error||new Error('Yerel veriler silinemedi.'));
      tx.objectStore(DOCUMENTS).clear();
      tx.objectStore(DRAFTS).clear();
    });
  }finally{db.close();}
}
