
// IndexedDB database operations
const DB_VERSION = 1;
const DB_NAME = "peerBoardDB";
let db;

// Initialize IndexedDB
async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('p2pBulletinBoard', 2);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains('users')) {
        const usersStore = db.createObjectStore('users', { keyPath: 'id' });
        usersStore.createIndex('peerId', 'peerId', { unique: true });
      }
      
      if (!db.objectStoreNames.contains('listings')) {
        const listingsStore = db.createObjectStore('listings', { keyPath: 'id' });
        listingsStore.createIndex('authorId', 'authorId', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('deals')) {
        const dealsStore = db.createObjectStore('deals', { keyPath: 'id' });
        dealsStore.createIndex('listingId', 'listingId', { unique: false });
        dealsStore.createIndex('proposerId', 'proposerId', { unique: false });
        dealsStore.createIndex('receiverId', 'receiverId', { unique: false });
      }
      
      // Add comments store
      if (!db.objectStoreNames.contains('comments')) {
        const commentsStore = db.createObjectStore('comments', { keyPath: 'id' });
        commentsStore.createIndex('dealId', 'dealId', { unique: false });
        commentsStore.createIndex('authorId', 'authorId', { unique: false });
      }
    };
    
    request.onsuccess = (event) => {
      db = event.target.result;
      console.log('Database initialized successfully');
      resolve();
    };
    
    request.onerror = (event) => {
      console.error('Error initializing database:', event.target.error);
      reject(event.target.error);
    };
  });
}

// Get all listings from the database
async function getAllListings() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['listings'], 'readonly');
    const store = transaction.objectStore('listings');
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Get user listings
async function getUserListings(userId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['listings'], 'readonly');
    const store = transaction.objectStore('listings');
    const index = store.index('by_author');
    const request = index.getAll(userId);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Get user by ID
async function getUserById(id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['users'], 'readonly');
    const store = transaction.objectStore('users');
    const request = store.get(id);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Save or update user
async function saveUser(user) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['users'], 'readwrite');
    const store = transaction.objectStore('users');
    const request = store.put(user);
    
    request.onsuccess = () => resolve(user);
    request.onerror = () => reject(request.error);
  });
}

// Save a new listing
async function saveListing(listing) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['listings'], 'readwrite');
    const store = transaction.objectStore('listings');
    const request = store.put(listing);
    
    request.onsuccess = () => resolve(listing);
    request.onerror = () => reject(request.error);
  });
}

// Save a new deal
async function saveDeal(deal) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['deals'], 'readwrite');
    const store = transaction.objectStore('deals');
    const request = store.put(deal);
    
    request.onsuccess = () => resolve(deal);
    request.onerror = () => reject(request.error);
  });
}

// Get deals by user
async function getUserDeals(userId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['deals'], 'readonly');
    const store = transaction.objectStore('deals');
    const request = store.getAll();
    
    request.onsuccess = () => {
      const deals = request.result.filter(
        deal => deal.proposerId === userId || deal.receiverId === userId
      );
      resolve(deals);
    };
    request.onerror = () => reject(request.error);
  });
}

// Get a listing by ID
async function getListingById(id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['listings'], 'readonly');
    const store = transaction.objectStore('listings');
    const request = store.get(id);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Get a deal by ID
async function getDealById(id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['deals'], 'readonly');
    const store = transaction.objectStore('deals');
    const request = store.get(id);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Save a comment
async function saveComment(comment) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['comments'], 'readwrite');
    const store = transaction.objectStore('comments');
    const request = store.put(comment);
    
    request.onsuccess = () => resolve(comment);
    request.onerror = () => reject(request.error);
  });
}

// Get all comments for a deal
async function getDealComments(dealId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['comments'], 'readonly');
    const store = transaction.objectStore('comments');
    const index = store.index('dealId');
    const request = index.getAll(dealId);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
