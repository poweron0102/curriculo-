/**
 * Autosave no IndexedDB (§11.1 e §11.3).
 *
 * Mantém apenas um projeto ativo. Quando o IndexedDB falha, o documento
 * continua em memória e o chamador recebe o erro para exibir um aviso
 * persistente — nunca informamos que o trabalho foi salvo.
 */

const DATABASE_NAME = 'aramara-dialogue-editor';
const DATABASE_VERSION = 1;
const STORE_NAME = 'projects';
const ACTIVE_KEY = 'active';

export const SAVE_DEBOUNCE_MS = 400;

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('Este navegador não oferece IndexedDB.'));
      return;
    }
    let request;
    try {
      request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    } catch (error) {
      reject(error);
      return;
    }
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Falha ao abrir o banco local.'));
    request.onblocked = () => reject(new Error('O banco local está bloqueado por outra aba.'));
  });
}

function runTransaction(database, mode, action) {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    let result;
    try {
      result = action(store);
    } catch (error) {
      reject(error);
      return;
    }
    transaction.oncomplete = () => resolve(result && result.result !== undefined ? result.result : undefined);
    transaction.onerror = () => reject(transaction.error || new Error('Falha na transação local.'));
    transaction.onabort = () => reject(transaction.error || new Error('Transação local cancelada.'));
  });
}

export class ProjectStore {
  constructor() {
    this.databasePromise = null;
  }

  database() {
    if (!this.databasePromise) {
      this.databasePromise = openDatabase().catch((error) => {
        this.databasePromise = null;
        throw error;
      });
    }
    return this.databasePromise;
  }

  async load() {
    const database = await this.database();
    const record = await runTransaction(database, 'readonly', (store) => store.get(ACTIVE_KEY));
    return record || null;
  }

  async save(project) {
    const database = await this.database();
    await runTransaction(database, 'readwrite', (store) =>
      store.put({ savedAt: new Date().toISOString(), project }, ACTIVE_KEY)
    );
  }

  async clear() {
    const database = await this.database();
    await runTransaction(database, 'readwrite', (store) => store.delete(ACTIVE_KEY));
  }
}

/**
 * Salvamento com debounce curto e estados observáveis:
 * `idle`, `saving`, `saved`, `error`.
 */
export class AutoSaver {
  constructor(store, onStatusChange, { debounceMs = SAVE_DEBOUNCE_MS } = {}) {
    this.store = store;
    this.onStatusChange = onStatusChange;
    this.debounceMs = debounceMs;
    this.timer = null;
    this.pendingProject = null;
    this.status = { state: 'idle', savedAt: null, error: null };
  }

  setStatus(state, extra = {}) {
    this.status = { ...this.status, state, ...extra };
    this.onStatusChange(this.status);
  }

  schedule(project) {
    this.pendingProject = project;
    this.setStatus('saving');
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      this.flush();
    }, this.debounceMs);
  }

  async flush() {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    const project = this.pendingProject;
    if (!project) return;
    this.pendingProject = null;
    try {
      await this.store.save(project);
      this.setStatus('saved', { savedAt: new Date().toISOString(), error: null });
    } catch (error) {
      this.setStatus('error', { error: error && error.message ? error.message : String(error) });
    }
  }
}
