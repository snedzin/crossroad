
// Data storage and manipulation functions

/**
 * User functions
 */
// Get or create a user profile
function getUserProfile() {
  let user = JSON.parse(localStorage.getItem('crossroadUser') || 'null');
  if (!user) {
    // Create a default user profile if none exists
    user = {
      id: generateUUID(),
      username: 'Anonymous',
      bio: '',
      avatar: '',
      createdAt: new Date().toISOString(),
      lastSeen: new Date().toISOString()
    };
    saveUserProfile(user);
  }
  return user;
}

// Save user profile
function saveUserProfile(user) {
  user.lastSeen = new Date().toISOString();
  localStorage.setItem('crossroadUser', JSON.stringify(user));
  return user;
}

// Update user profile
function updateUserProfile(updates) {
  const user = getUserProfile();
  const updatedUser = { ...user, ...updates };
  return saveUserProfile(updatedUser);
}

// Generate a peer ID based on username
function generatePeerIdFromUsername(username) {
  // Remove special characters and spaces
  const sanitized = username.replace(/[^\w]/g, '').toLowerCase();
  // Add a random suffix to avoid collisions
  const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `peer-${sanitized}-${randomSuffix}`;
}

/**
 * Listing functions
 */
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

// Save a new listing
function saveListing(listing) {
  const listings = JSON.parse(localStorage.getItem('crossroadListings') || '[]');
  
  // If listing exists, update it
  const index = listings.findIndex(l => l.id === listing.id);
  if (index !== -1) {
    listings[index] = listing;
  } else {
    listings.push(listing);
  }
  
  localStorage.setItem('crossroadListings', JSON.stringify(listings));
  
  // Also broadcast the listing
  if (window.p2pService) {
    window.p2pService.broadcastListing(listing);
  }
  
  return listing;
}

// Get a listing by ID
function getListingById(id) {
  const listings = JSON.parse(localStorage.getItem('crossroadListings') || '[]');
  const localListing = listings.find(listing => listing.id === id);
  if (localListing) return localListing;
  
  const externalListingsMap = window.externalListings || new Map();
  return externalListingsMap.get(id) || null;
}

// Check if we already have a listing with the given ID
function hasListing(id) {
  const listings = JSON.parse(localStorage.getItem('crossroadListings') || '[]');
  const externalListingsMap = window.externalListings || new Map();
  
  const localHas = listings.some(listing => listing.id === id);
  const externalHas = externalListingsMap.has(id);
  return localHas || externalHas;
}

/**
 * Deal functions
 */
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

// Save a deal
function saveDeal(deal) {
  const deals = JSON.parse(localStorage.getItem('crossroadDeals') || '[]');
  
  // If deal exists, update it
  const index = deals.findIndex(d => d.id === deal.id);
  if (index !== -1) {
    deals[index] = deal;
  } else {
    deals.push(deal);
  }
  
  localStorage.setItem('crossroadDeals', JSON.stringify(deals));
  
  // Also broadcast the deal
  if (window.p2pService) {
    window.p2pService.broadcastDeal(deal);
  }
  
  return deal;
}

// Get a deal by ID
function getDealById(id) {
  const deals = JSON.parse(localStorage.getItem('crossroadDeals') || '[]');
  const localDeal = deals.find(deal => deal.id === id);
  if (localDeal) return localDeal;
  
  const externalDealsMap = window.externalDeals || new Map();
  return externalDealsMap.get(id) || null;
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

// Check if we already have a deal with the given ID
function hasDeal(id) {
  const deals = JSON.parse(localStorage.getItem('crossroadDeals') || '[]');
  const externalDealsMap = window.externalDeals || new Map();
  
  const localHas = deals.some(deal => deal.id === id);
  const externalHas = externalDealsMap.has(id);
  return localHas || externalHas;
}

/**
 * Comment functions
 */
// Get all comments for a deal
function getCommentsForDeal(dealId) {
  const comments = JSON.parse(localStorage.getItem('crossroadComments') || '[]');
  return comments.filter(comment => comment.dealId === dealId);
}

// Add a comment to a deal
function addCommentToDeal(comment) {
  const comments = JSON.parse(localStorage.getItem('crossroadComments') || '[]');
  comments.push(comment);
  localStorage.setItem('crossroadComments', JSON.stringify(comments));
  
  // Also broadcast the comment
  if (window.p2pService) {
    window.p2pService.broadcastComment(comment);
  }
  
  return comment;
}

/**
 * Utility functions
 */
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

// Helper function to generate user initials for avatar
function getUserInitials(name) {
  if (!name) return '?';
  
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
