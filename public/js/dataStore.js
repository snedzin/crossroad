// Data storage and manipulation functions

// Get all listings (local + external)
function getAllListings() {
  const listings = JSON.parse(localStorage.getItem('crossroadListings') || '[]');
  const externalListingsMap = window.externalListings || new Map();
  const allListings = [...listings];
  
  externalListingsMap.forEach(listing => {
    allListings.push(listing);
  });
  
  return allListings;
}

// Get all deals (local + external)
function getAllDeals() {
  const deals = JSON.parse(localStorage.getItem('crossroadDeals') || '[]');
  const externalDealsMap = window.externalDeals || new Map();
  const allDeals = [...deals];
  
  externalDealsMap.forEach(deal => {
    allDeals.push(deal);
  });
  
  return allDeals;
}

// Get a deal by ID
function getDealById(id) {
  const deals = JSON.parse(localStorage.getItem('crossroadDeals') || '[]');
  const localDeal = deals.find(deal => deal.id === id);
  if (localDeal) return localDeal;
  
  const externalDealsMap = window.externalDeals || new Map();
  return externalDealsMap.get(id) || null;
}

// Update a deal in storage
async function updateDeal(deal) {
  const transaction = db.transaction(['deals'], 'readwrite');
  const store = transaction.objectStore('deals');
  
  return new Promise((resolve, reject) => {
    const request = store.put(deal);
    request.onsuccess = () => resolve(deal);
    request.onerror = () => reject(request.error);
  });
}

// Mark a deal as opened
function markDealAsOpened(id) {
  const deals = JSON.parse(localStorage.getItem('crossroadDeals') || '[]');
  const externalDealsMap = window.externalDeals || new Map();
  
  // Find deal in local storage
  const localIndex = deals.findIndex(deal => deal.id === id);
  if (localIndex !== -1) {
    deals[localIndex].opened = true;
    deals[localIndex].lastOpenedAt = new Date().toISOString();
    localStorage.setItem('crossroadDeals', JSON.stringify(deals));
    
    // Also broadcast the updated deal
    if (window.p2pService) {
      window.p2pService.broadcastDeal(deals[localIndex]);
    }
    return;
  }
  
  // Check external deals
  if (externalDealsMap.has(id)) {
    const deal = externalDealsMap.get(id);
    deal.opened = true;
    deal.lastOpenedAt = new Date().toISOString();
    externalDealsMap.set(id, deal);
    
    // Also broadcast the updated deal
    if (window.p2pService) {
      window.p2pService.broadcastDeal(deal);
    }
  }
}

// Check if we already have a listing with the given ID
function hasListing(id) {
  const listings = JSON.parse(localStorage.getItem('crossroadListings') || '[]');
  const externalListingsMap = window.externalListings || new Map();
  
  const localHas = listings.some(listing => listing.id === id);
  const externalHas = externalListingsMap.has(id);
  return localHas || externalHas;
}

// Check if we already have a deal with the given ID
function hasDeal(id) {
  const deals = JSON.parse(localStorage.getItem('crossroadDeals') || '[]');
  const externalDealsMap = window.externalDeals || new Map();
  
  const localHas = deals.some(deal => deal.id === id);
  const externalHas = externalDealsMap.has(id);
  return localHas || externalHas;
}

// Format timestamp for display
function formatTimestamp(timestamp) {
  if (!timestamp) return 'Unknown';
  
  try {
    const date = new Date(timestamp);
    return date.toLocaleString();
  } catch (error) {
    return 'Invalid date';
  }
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Helper function to generate a UUID (shared with mobile implementation)
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, 
          v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
