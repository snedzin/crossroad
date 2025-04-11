
// Mobile app main script

// Global variables
let currentUser = null;
let currentViewingListing = null;

// Initialize the application
async function initApp() {
  try {
    // Initialize IndexedDB
    await initDB();
    
    // Initialize PeerJS
    const peerId = await initPeer();
    
    // Load or create user profile
    let user = await getUserById(peerId);
    
    if (!user) {
      // Create new user
      user = {
        id: peerId,
        name: 'Anonymous User',
        bio: '',
        email: '',
        createdAt: Date.now()
      };
      
      await saveUser(user);
    }
    
    currentUser = user;
    
    // Update UI with user data
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userAvatar').textContent = getInitials(user.name);
    
    // Render listings and user data
    await renderListings();
    await renderUserListings();
    await renderDeals();
    
    setupEventListeners();
    
    showToast('Ready', 'P2P Bulletin Board initialized successfully', 'success');
  } catch (err) {
    console.error('Error initializing app:', err);
    showToast('Error', `Failed to initialize: ${err.message}`, 'error');
  }
}

// Set up all event listeners
function setupEventListeners() {
  // Sidebar toggle
  document.getElementById('menuBtn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebarOverlay').classList.add('open');
  });
  
  document.getElementById('sidebarClose').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('open');
  });
  
  document.getElementById('sidebarOverlay').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('open');
  });
  
  // Sidebar tabs
  document.querySelectorAll('.sidebar-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs
      document.querySelectorAll('.sidebar-tab').forEach(t => {
        t.classList.remove('active');
      });
      
      // Add active class to clicked tab
      tab.classList.add('active');
      
      // Hide all panels
      document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
      });
      
      // Show the selected panel
      const tabId = tab.getAttribute('data-tab');
      document.getElementById(`${tabId}Panel`).classList.add('active');
    });
  });
  
  // Filter chips
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      // Remove active class from all chips
      document.querySelectorAll('.filter-chip').forEach(c => {
        c.classList.remove('active');
      });
      
      // Add active class to clicked chip
      chip.classList.add('active');
      
      // Apply filter
      const filter = chip.getAttribute('data-filter');
      renderListings(filter);
    });
  });
  
  // Create listing dialog
  document.getElementById('createBtn').addEventListener('click', () => {
    document.getElementById('createListingDialog').classList.add('open');
  });
  
  document.getElementById('closeCreateDialog').addEventListener('click', () => {
    document.getElementById('createListingDialog').classList.remove('open');
  });
  
  document.getElementById('cancelCreateListing').addEventListener('click', () => {
    document.getElementById('createListingDialog').classList.remove('open');
  });
  
  // Submit listing form
  document.getElementById('submitCreateListing').addEventListener('click', async () => {
    const form = document.getElementById('createListingForm');
    
    // Basic validation
    const title = document.getElementById('listingTitle').value.trim();
    const description = document.getElementById('listingDescription').value.trim();
    const price = parseFloat(document.getElementById('listingPrice').value);
    const category = document.getElementById('listingCategory').value;
    const tagsInput = document.getElementById('listingTags').value;
    
    if (!title || !description || isNaN(price)) {
      showToast('Error', 'Please fill all required fields', 'error');
      return;
    }
    
    // Process tags
    const tags = tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    // Create listing object
    const listing = {
      id: generateUUID(),
      title,
      description,
      price,
      category,
      tags,
      authorId: currentUser.id,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    try {
      // Save to local database
      await saveListing(listing);
      
      // Broadcast to connected peers
      broadcastMessage({
        type: 'LISTING_BROADCAST',
        data: { listing }
      });
      
      // Reset form
      form.reset();
      
      // Close dialog
      document.getElementById('createListingDialog').classList.remove('open');
      
      // Show success message
      showToast('Success', 'Listing created and broadcast to peers', 'success');
      
      // Update listings
      renderListings();
      renderUserListings();
    } catch (err) {
      console.error('Error creating listing:', err);
      showToast('Error', 'Failed to create listing', 'error');
    }
  });
  
  // View listing dialog
  document.getElementById('closeViewDialog').addEventListener('click', () => {
    document.getElementById('viewListingDialog').classList.remove('open');
    currentViewingListing = null;
  });
  
  document.getElementById('closeViewDialogBtn').addEventListener('click', () => {
    document.getElementById('viewListingDialog').classList.remove('open');
    currentViewingListing = null;
  });
  
  // Deal proposal
  document.getElementById('proposeBtn').addEventListener('click', () => {
    if (!currentViewingListing) {
      showToast('Error', 'No listing selected', 'error');
      return;
    }
    
    document.getElementById('dealListingTitle').textContent = currentViewingListing.title;
    document.getElementById('dealOfferAmount').value = currentViewingListing.price;
    document.getElementById('dealDialog').classList.add('open');
    document.getElementById('viewListingDialog').classList.remove('open');
  });
  
  document.getElementById('closeDealDialog').addEventListener('click', () => {
    document.getElementById('dealDialog').classList.remove('open');
  });
  
  document.getElementById('cancelDeal').addEventListener('click', () => {
    document.getElementById('dealDialog').classList.remove('open');
  });
  
  document.getElementById('submitDeal').addEventListener('click', async () => {
    if (!currentViewingListing) {
      showToast('Error', 'No listing selected', 'error');
      return;
    }
    
    const message = document.getElementById('dealMessage').value.trim();
    const offerAmount = parseFloat(document.getElementById('dealOfferAmount').value);
    
    if (!message || isNaN(offerAmount)) {
      showToast('Error', 'Please fill all required fields', 'error');
      return;
    }
    
    try {
      // Create deal object
      const deal = {
        id: generateUUID(),
        listingId: currentViewingListing.id,
        proposerId: currentUser.id,
        receiverId: currentViewingListing.authorId,
        message,
        offerAmount,
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      // Save to local database
      await saveDeal(deal);
      
      // Send to listing owner if connected
      const connection = connections[currentViewingListing.authorId];
      if (connection) {
        sendMessage(connection, {
          type: 'DEAL_PROPOSAL',
          data: { deal }
        });
        
        showToast('Success', 'Deal proposal sent to listing owner', 'success');
      } else {
        showToast('Warning', 'Deal saved locally but owner is not currently connected', 'warning');
      }
      
      // Close dialog
      document.getElementById('dealDialog').classList.remove('open');
      currentViewingListing = null;
      
      // Reset form
      document.getElementById('dealProposalForm').reset();
      
      // Update deals
      renderDeals();
    } catch (err) {
      console.error('Error creating deal:', err);
      showToast('Error', 'Failed to create deal', 'error');
    }
  });
  
  // Connect to peer button
  document.getElementById('connectBtn').addEventListener('click', () => {
    const peerId = document.getElementById('peerIdInput').value.trim();
    
    if (!peerId) {
      showToast('Error', 'Please enter a peer ID', 'error');
      return;
    }
    
    connectToPeer(peerId);
    document.getElementById('peerIdInput').value = '';
  });
  
  // Edit profile
  document.getElementById('editProfileBtn').addEventListener('click', () => {
    document.getElementById('userNameInput').value = currentUser.name || '';
    document.getElementById('userBioInput').value = currentUser.bio || '';
    document.getElementById('userEmailInput').value = currentUser.email || '';
    document.getElementById('profileDialog').classList.add('open');
  });
  
  document.getElementById('closeProfileDialog').addEventListener('click', () => {
    document.getElementById('profileDialog').classList.remove('open');
  });
  
  document.getElementById('cancelProfile').addEventListener('click', () => {
    document.getElementById('profileDialog').classList.remove('open');
  });
  
  document.getElementById('saveProfile').addEventListener('click', async () => {
    const name = document.getElementById('userNameInput').value.trim();
    const bio = document.getElementById('userBioInput').value.trim();
    const email = document.getElementById('userEmailInput').value.trim();
    
    if (!name) {
      showToast('Error', 'Please enter a display name', 'error');
      return;
    }
    
    try {
      // Update user object
      currentUser.name = name;
      currentUser.bio = bio;
      currentUser.email = email;
      currentUser.updatedAt = Date.now();
      
      // Save to local database
      await saveUser(currentUser);
      
      // Update UI
      document.getElementById('userName').textContent = currentUser.name;
      document.getElementById('userAvatar').textContent = getInitials(currentUser.name);
      
      // Broadcast to connected peers
      broadcastMessage({
        type: 'USER_INFO',
        data: { user: currentUser }
      });
      
      // Close dialog
      document.getElementById('profileDialog').classList.remove('open');
      
      showToast('Success', 'Profile updated successfully', 'success');
    } catch (err) {
      console.error('Error updating profile:', err);
      showToast('Error', 'Failed to update profile', 'error');
    }
  });
}

// Start the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
