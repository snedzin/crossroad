
// Main application logic

// Global state
let listings = [];
let deals = [];
window.externalListings = new Map();
window.externalDeals = new Map();

document.addEventListener('DOMContentLoaded', function() {
  // Initialize P2P service
  window.p2pService = new PeerBoardP2P();
  
  // DOM elements
  const statusIndicator = document.getElementById('status-indicator');
  const myPeerIdElement = document.getElementById('my-peer-id');
  const copyIdButton = document.getElementById('copy-id');
  const reconnectButton = document.getElementById('reconnect');
  const peerIdInput = document.getElementById('peer-id-input');
  const connectButton = document.getElementById('connect-button');
  const createListingBtn = document.getElementById('create-listing-btn');
  const createListingModal = document.getElementById('create-listing-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const listingForm = document.getElementById('listing-form');
  const filterCategories = document.getElementById('filter-categories');
  const selectCategories = document.getElementById('select-categories');
  const selectedCategoryInput = document.getElementById('selected-category');
  const searchInput = document.getElementById('search-input');
  const searchButton = document.getElementById('search-button');
  const p2pTabs = document.querySelectorAll('.p2p-tab');
  const p2pTabContents = document.querySelectorAll('.p2p-tab-content');
  const dealViewModal = document.getElementById('deal-view-modal');
  const closeDealViewBtn = document.getElementById('close-deal-view-btn');
  
  // Load data from local storage
  listings = JSON.parse(localStorage.getItem('crossroadListings') || '[]');
  deals = JSON.parse(localStorage.getItem('crossroadDeals') || '[]');
  
  // Initialize peer connection
  initializePeer();
  
  // Set up P2P callbacks
  window.p2pService.onPeerConnected = (peerId) => {
    updatePeerList();
    showToast(`Connected to: ${peerId.substring(0, 8)}...`);
    
    // Share our listings with the new peer
    listings.forEach(listing => {
      window.p2pService.sendToPeer(peerId, {
        type: 'LISTING_BROADCAST',
        senderId: window.p2pService.peerId,
        timestamp: Date.now(),
        messageId: window.p2pService.generateId(),
        listing: listing
      });
    });
    
    // Share our deals with the new peer
    deals.forEach(deal => {
      window.p2pService.sendToPeer(peerId, {
        type: 'DEAL_BROADCAST',
        senderId: window.p2pService.peerId,
        timestamp: Date.now(),
        messageId: window.p2pService.generateId(),
        deal: deal
      });
    });
  };
  
  window.p2pService.onPeerDisconnected = (peerId) => {
    updatePeerList();
    showToast(`Disconnected from: ${peerId.substring(0, 8)}...`);
    
    // We don't remove external listings/deals on disconnection
    // This implements the persistent data model where data stays in the network
  };
  
  window.p2pService.onListingReceived = (listing) => {
    // Add peer ID to the listing if not present
    listing.peerId = listing.peerId || window.p2pService.peerId;
    listing.external = true;
    
    // Don't duplicate if we already have the same listing ID
    if (!hasListing(listing.id)) {
      window.externalListings.set(listing.id, listing);
      showToast(`New offering received: ${listing.title}`);
      renderListings();
    }
  };
  
  window.p2pService.onDealReceived = (deal) => {
    // Add peer ID to the deal if not present
    deal.peerId = deal.peerId || window.p2pService.peerId;
    deal.external = true;
    
    // Don't duplicate if we already have the same deal ID
    if (!hasDeal(deal.id)) {
      window.externalDeals.set(deal.id, deal);
      showToast(`New deal received: ${deal.title}`);
      renderListings(); // Refresh listings which may include deals
    }
  };
  
  // Initialize peer connection
  async function initializePeer() {
    try {
      const peerId = await window.p2pService.initializePeer();
      myPeerIdElement.textContent = peerId;
      statusIndicator.classList.remove('status-disconnected');
      statusIndicator.classList.add('status-connected');
      copyIdButton.disabled = false;
      connectButton.disabled = false;
      
      showToast('Connected to Crossroad network');
    } catch (error) {
      console.error('Failed to initialize peer:', error);
      myPeerIdElement.textContent = 'Connection failed';
      statusIndicator.classList.remove('status-connected');
      statusIndicator.classList.add('status-disconnected');
      
      showToast('Failed to connect to network. Try reconnecting.', 'error');
    }
  }
  
  // Copy peer ID to clipboard
  copyIdButton.addEventListener('click', () => {
    const peerId = myPeerIdElement.textContent;
    navigator.clipboard.writeText(peerId)
      .then(() => {
        showToast('Peer ID copied to clipboard');
      })
      .catch(err => {
        console.error('Failed to copy:', err);
      });
  });
  
  // Connect to a peer
  connectButton.addEventListener('click', async () => {
    const peerId = peerIdInput.value.trim();
    if (peerId) {
      connectButton.disabled = true;
      connectButton.textContent = 'Connecting...';
      
      console.log("Initiating connection to:", peerId);
      const success = await window.p2pService.connectToPeer(peerId);
      
      if (success) {
        showToast(`Connected to ${peerId.substring(0, 8)}...`);
        peerIdInput.value = '';
      } else {
        showToast(`Failed to connect to ${peerId.substring(0, 8)}...`, 'error');
      }
      
      connectButton.disabled = false;
      connectButton.textContent = 'Connect';
      updatePeerList();
    }
  });
  
  // Enter key in peer ID input should trigger connect button
  peerIdInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !connectButton.disabled) {
      connectButton.click();
    }
  });
  
  // Reconnect button
  reconnectButton.addEventListener('click', () => {
    initializePeer();
  });
  
  // Handle category selection in create form
  selectCategories.addEventListener('click', (e) => {
    if (e.target.classList.contains('category-badge')) {
      // Remove selected class from all badges
      selectCategories.querySelectorAll('.category-badge').forEach(badge => {
        badge.classList.remove('selected');
      });
      
      // Add selected class to clicked badge
      e.target.classList.add('selected');
      
      // Update hidden input
      selectedCategoryInput.value = e.target.dataset.category;
    }
  });
  
  // Filter by category
  filterCategories.addEventListener('click', (e) => {
    if (e.target.classList.contains('category-badge')) {
      // Remove selected class from all badges
      filterCategories.querySelectorAll('.category-badge').forEach(badge => {
        badge.classList.remove('selected');
      });
      
      // Add selected class to clicked badge
      e.target.classList.add('selected');
      
      // Apply filter
      renderListings(e.target.dataset.category, searchInput.value);
    }
  });
  
  // Search functionality
  searchButton.addEventListener('click', () => {
    const activeFilter = filterCategories.querySelector('.selected').dataset.category;
    renderListings(activeFilter, searchInput.value);
  });
  
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const activeFilter = filterCategories.querySelector('.selected').dataset.category;
      renderListings(activeFilter, searchInput.value);
    }
  });
  
  // Create listing modal handlers
  createListingBtn.addEventListener('click', () => {
    createListingModal.classList.add('active');
  });
  
  closeModalBtn.addEventListener('click', () => {
    createListingModal.classList.remove('active');
  });
  
  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === createListingModal) {
      createListingModal.classList.remove('active');
    }
  });
  
  // P2P Tab functionality
  p2pTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      
      // Update active tab
      p2pTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Update active content
      p2pTabContents.forEach(content => content.classList.remove('active'));
      document.getElementById(`${tabName}-tab`).classList.add('active');
    });
  });
  
  // Form submission
  listingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const newDeal = {
      id: Date.now().toString(),
      title: document.getElementById('listing-title').value,
      description: document.getElementById('listing-description').value,
      price: document.getElementById('listing-price').value,
      category: selectedCategoryInput.value,
      contact: document.getElementById('listing-contact').value,
      time: 'Just now',
      peerId: window.p2pService.peerId,
      createdAt: new Date().toISOString()
    };
    
    // Save to local storage as a deal
    deals.push(newDeal);
    localStorage.setItem('crossroadDeals', JSON.stringify(deals));
    
    // Broadcast to peers
    window.p2pService.broadcastDeal(newDeal);
    
    // Reset form and close modal
    listingForm.reset();
    createListingModal.classList.remove('active');
    
    // Rerender with current filters
    const activeFilter = filterCategories.querySelector('.selected').dataset.category;
    renderListings(activeFilter, searchInput.value);
    
    showToast('Your offering has been posted and shared with connected peers!');
  });
  
  // Close deal view modal
  closeDealViewBtn.addEventListener('click', () => {
    dealViewModal.classList.remove('active');
  });
  
  // Close deal view when clicking outside
  dealViewModal.addEventListener('click', (e) => {
    if (e.target === dealViewModal) {
      dealViewModal.classList.remove('active');
    }
  });
  
  // Initialize the board
  renderListings();
  
  // Auto-select the first category in the creation form
  const firstCategoryBadge = selectCategories.querySelector('.category-badge');
  if (firstCategoryBadge) {
    firstCategoryBadge.classList.add('selected');
    selectedCategoryInput.value = firstCategoryBadge.dataset.category;
  }
});
