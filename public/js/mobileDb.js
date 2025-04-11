
// IndexedDB database operations
const DB_VERSION = 1;
const DB_NAME = "peerBoardDB";
let db;

// Initialize IndexedDB
async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (event) => {
      db = event.target.result;
      
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains('listings')) {
        const listingStore = db.createObjectStore('listings', { keyPath: 'id' });
        listingStore.createIndex('by_author', 'authorId', { unique: false });
        listingStore.createIndex('by_category', 'category', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('deals')) {
        const dealStore = db.createObjectStore('deals', { keyPath: 'id' });
        dealStore.createIndex('by_listing', 'listingId', { unique: false });
        dealStore.createIndex('by_parties', ['proposerId', 'receiverId'], { unique: false });
      }
      
      if (!db.objectStoreNames.contains('messages')) {
        const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
        messageStore.createIndex('by_deal', 'dealId', { unique: false });
      }
    };
    
    request.onsuccess = (event) => {
      db = event.target.result;
      console.log("Database initialized successfully");
      resolve(db);
    };
    
    request.onerror = (event) => {
      console.error("Database error:", event.target.error);
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
