
// Database configuration
const DB_NAME = 'crossroad-db';
const DB_VERSION = 1;

// Store names
export const STORES = {
  USERS: 'users',
  DEALS: 'deals',
  MESSAGES: 'messages',
  BOOKMARKS: 'bookmarks',
};

// IndexedDB connection
let db;

// Initialize the database
export async function initializeDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create Users store
      if (!db.objectStoreNames.contains(STORES.USERS)) {
        const usersStore = db.createObjectStore(STORES.USERS, { keyPath: 'id' });
        usersStore.createIndex('peerId', 'peerId', { unique: false });
      }
      
      // Create Deals store
      if (!db.objectStoreNames.contains(STORES.DEALS)) {
        const dealsStore = db.createObjectStore(STORES.DEALS, { keyPath: 'id' });
        dealsStore.createIndex('createdBy', 'createdBy', { unique: false });
        dealsStore.createIndex('category', 'category', { unique: false });
      }
      
      // Create Messages store
      if (!db.objectStoreNames.contains(STORES.MESSAGES)) {
        const messagesStore = db.createObjectStore(STORES.MESSAGES, { keyPath: 'id' });
        messagesStore.createIndex('dealId', 'dealId', { unique: false });
      }
      
      // Create Bookmarks store
      if (!db.objectStoreNames.contains(STORES.BOOKMARKS)) {
        const bookmarksStore = db.createObjectStore(STORES.BOOKMARKS, { keyPath: 'id' });
        bookmarksStore.createIndex('userId', 'userId', { unique: false });
        bookmarksStore.createIndex('dealId', 'dealId', { unique: false });
      }
    };
    
    request.onsuccess = (event) => {
      db = event.target.result;
      console.log('Database initialized successfully');
      resolve(db);
    };
    
    request.onerror = (event) => {
      console.error('Error opening database:', event.target.error);
      reject(event.target.error);
    };
  });
}

// Get a transaction for a specific store
function getTransaction(storeName, mode = 'readonly') {
  if (!db) {
    throw new Error('Database not initialized');
  }
  
  return db.transaction(storeName, mode);
}

// Get a store object from a transaction
function getStore(transaction, storeName) {
  return transaction.objectStore(storeName);
}

// Add an item to a store
export async function addItem(storeName, item) {
  return new Promise((resolve, reject) => {
    const transaction = getTransaction(storeName, 'readwrite');
    const store = getStore(transaction, storeName);
    const request = store.add(item);
    
    request.onsuccess = () => resolve(item);
    request.onerror = (event) => reject(event.target.error);
  });
}

// Get an item by its key
export async function getItemByKey(storeName, key) {
  return new Promise((resolve, reject) => {
    const transaction = getTransaction(storeName);
    const store = getStore(transaction, storeName);
    const request = store.get(key);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

// Get all items from a store
export async function getAllItems(storeName) {
  return new Promise((resolve, reject) => {
    const transaction = getTransaction(storeName);
    const store = getStore(transaction, storeName);
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

// Get items by index
export async function getItemsByIndex(storeName, indexName, value) {
  return new Promise((resolve, reject) => {
    const transaction = getTransaction(storeName);
    const store = getStore(transaction, storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

// Update an item
export async function updateItem(storeName, item) {
  return new Promise((resolve, reject) => {
    const transaction = getTransaction(storeName, 'readwrite');
    const store = getStore(transaction, storeName);
    const request = store.put(item);
    
    request.onsuccess = () => resolve(item);
    request.onerror = (event) => reject(event.target.error);
  });
}

// Delete an item
export async function deleteItem(storeName, key) {
  return new Promise((resolve, reject) => {
    const transaction = getTransaction(storeName, 'readwrite');
    const store = getStore(transaction, storeName);
    const request = store.delete(key);
    
    request.onsuccess = () => resolve();
    request.onerror = (event) => reject(event.target.error);
  });
}
