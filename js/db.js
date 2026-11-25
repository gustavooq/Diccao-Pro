/**
 * ARMAZENAMENTO DAS GRAVAÇÕES (IndexedDB)
 * Guarda os áudios no próprio aparelho do usuário, sem servidor.
 */
const AudioDB = (() => {
  const DB_NAME = 'diccao_audios';
  const STORE = 'gravacoes';
  let dbPromise = null;

  function open() {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        if (!('indexedDB' in window)) {
          reject(new Error('IndexedDB indisponível'));
          return;
        }
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'key' });
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    return dbPromise;
  }

  async function run(mode, fn) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const request = fn(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(request ? request.result : undefined);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  return {
    save: (key, blob, seconds) =>
      run('readwrite', (s) => s.put({ key, blob, seconds, date: new Date().toISOString() })),
    remove: (key) => run('readwrite', (s) => s.delete(key)),
    getAll: () => run('readonly', (s) => s.getAll()),
    clear: () => run('readwrite', (s) => s.clear())
  };
})();
