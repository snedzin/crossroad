
// Database utilities for the P2P bulletin board
// Uses IndexedDB for local storage

// Database constants
const DB_NAME = "p2p_bulletin_board";
const DB_VERSION = 1;

// Object store names
export const STORES = {
  LISTINGS: "listings",
  DEALS: "deals",
  USERS: "users",
  PEERS: "peers",
  MESSAGES: "messages",
};

// Initialize the database
export const initializeDatabase = () => {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      reject("Database error: " + (event.target as IDBOpenDBRequest).error);
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.LISTINGS)) {
        const listingsStore = db.createObjectStore(STORES.LISTINGS, { keyPath: "id" });
        listingsStore.createIndex("title", "title", { unique: false });
        listingsStore.createIndex("category", "category", { unique: false });
        listingsStore.createIndex("createdBy", "createdBy", { unique: false });
        listingsStore.createIndex("createdAt", "createdAt", { unique: false });
        listingsStore.createIndex("status", "status", { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.DEALS)) {
        const dealsStore = db.createObjectStore(STORES.DEALS, { keyPath: "id" });
        dealsStore.createIndex("listingId", "listingId", { unique: false });
        dealsStore.createIndex("initiatorId", "initiatorId", { unique: false });
        dealsStore.createIndex("recipientId", "recipientId", { unique: false });
        dealsStore.createIndex("status", "status", { unique: false });
        dealsStore.createIndex("createdAt", "createdAt", { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.USERS)) {
        const usersStore = db.createObjectStore(STORES.USERS, { keyPath: "id" });
        usersStore.createIndex("peerId", "peerId", { unique: true });
      }

      if (!db.objectStoreNames.contains(STORES.PEERS)) {
        const peersStore = db.createObjectStore(STORES.PEERS, { keyPath: "id" });
        peersStore.createIndex("lastSeen", "lastSeen", { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.MESSAGES)) {
        const messagesStore = db.createObjectStore(STORES.MESSAGES, { keyPath: "id" });
        messagesStore.createIndex("fromPeerId", "fromPeerId", { unique: false });
        messagesStore.createIndex("toPeerId", "toPeerId", { unique: false });
        messagesStore.createIndex("dealId", "dealId", { unique: false });
        messagesStore.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
  });
};

// Generic function to get connection to the database
export const getDbConnection = () => {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      reject("Database connection error: " + (event.target as IDBOpenDBRequest).error);
    };
    
    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };
  });
};

// Generic function to add an item to any store
export const addItem = <T>(storeName: string, item: T) => {
  return new Promise<T>((resolve, reject) => {
    getDbConnection()
      .then((db) => {
        const transaction = db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.add(item);
        
        request.onsuccess = () => {
          resolve(item);
        };
        
        request.onerror = (event) => {
          reject("Error adding item: " + (event.target as IDBRequest).error);
        };
        
        transaction.oncomplete = () => {
          db.close();
        };
      })
      .catch(reject);
  });
};

// Generic function to get all items from a store
export const getAllItems = <T>(storeName: string) => {
  return new Promise<T[]>((resolve, reject) => {
    getDbConnection()
      .then((db) => {
        const transaction = db.transaction(storeName, "readonly");
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        
        request.onsuccess = () => {
          resolve(request.result as T[]);
        };
        
        request.onerror = (event) => {
          reject("Error getting items: " + (event.target as IDBRequest).error);
        };
        
        transaction.oncomplete = () => {
          db.close();
        };
      })
      .catch(reject);
  });
};

// Generic function to get an item by key
export const getItemByKey = <T>(storeName: string, key: string | number) => {
  return new Promise<T | undefined>((resolve, reject) => {
    getDbConnection()
      .then((db) => {
        const transaction = db.transaction(storeName, "readonly");
        const store = transaction.objectStore(storeName);
        const request = store.get(key);
        
        request.onsuccess = () => {
          resolve(request.result as T | undefined);
        };
        
        request.onerror = (event) => {
          reject("Error getting item: " + (event.target as IDBRequest).error);
        };
        
        transaction.oncomplete = () => {
          db.close();
        };
      })
      .catch(reject);
  });
};

// Generic function to update an item
export const updateItem = <T>(storeName: string, item: T) => {
  return new Promise<T>((resolve, reject) => {
    getDbConnection()
      .then((db) => {
        const transaction = db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.put(item);
        
        request.onsuccess = () => {
          resolve(item);
        };
        
        request.onerror = (event) => {
          reject("Error updating item: " + (event.target as IDBRequest).error);
        };
        
        transaction.oncomplete = () => {
          db.close();
        };
      })
      .catch(reject);
  });
};

// Generic function to delete an item
export const deleteItem = (storeName: string, key: string | number) => {
  return new Promise<void>((resolve, reject) => {
    getDbConnection()
      .then((db) => {
        const transaction = db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);
        
        request.onsuccess = () => {
          resolve();
        };
        
        request.onerror = (event) => {
          reject("Error deleting item: " + (event.target as IDBRequest).error);
        };
        
        transaction.oncomplete = () => {
          db.close();
        };
      })
      .catch(reject);
  });
};

// Function to query items by index
export const queryByIndex = <T>(storeName: string, indexName: string, value: any) => {
  return new Promise<T[]>((resolve, reject) => {
    getDbConnection()
      .then((db) => {
        const transaction = db.transaction(storeName, "readonly");
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(value);
        
        request.onsuccess = () => {
          resolve(request.result as T[]);
        };
        
        request.onerror = (event) => {
          reject("Error querying items: " + (event.target as IDBRequest).error);
        };
        
        transaction.oncomplete = () => {
          db.close();
        };
      })
      .catch(reject);
  });
};
