
// UI related utilities

// Show toast notifications with themed styling
function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  
  if (type === 'error') {
    toast.style.borderLeftColor = '#ff3333';
  } else if (type === 'success') {
    toast.style.borderLeftColor = '#33cc66';
  }
  
  toast.textContent = message;
  
  toastContainer.appendChild(toast);
  
  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => {
      toastContainer.removeChild(toast);
    }, 300);
  }, 3000);
}

// Update the peer list UI
function updatePeerList() {
  const peerList = document.getElementById('peer-list');
  const peers = window.p2pService.getConnectedPeers();
  
  if (peers.length === 0) {
    peerList.innerHTML = '<div class="peer-item">No connected souls</div>';
    return;
  }
  
  peerList.innerHTML = '';
  peers.forEach(peerId => {
    const peerItem = document.createElement('div');
    peerItem.className = 'peer-item';
    
    const statusDot = document.createElement('div');
    statusDot.className = 'status-indicator status-connected';
    statusDot.style.marginRight = '0.5rem';
    
    const peerIdText = document.createElement('span');
    peerIdText.textContent = `${peerId.substring(0, 12)}...`;
    peerIdText.className = 'peer-id';
    
    const disconnectBtn = document.createElement('button');
    disconnectBtn.textContent = 'Disconnect';
    disconnectBtn.className = 'copy-button';
    disconnectBtn.style.marginLeft = 'auto';
    disconnectBtn.addEventListener('click', () => {
      window.p2pService.disconnectFromPeer(peerId);
      updatePeerList();
    });
    
    peerItem.appendChild(statusDot);
    peerItem.appendChild(peerIdText);
    peerItem.appendChild(disconnectBtn);
    
    peerList.appendChild(peerItem);
  });
}

// Display deal details
function viewDeal(dealId) {
  const deal = getDealById(dealId);
  if (!deal) return;
  
  // Mark the deal as opened
  markDealAsOpened(dealId);
  
  // Get modal elements
  const dealViewModal = document.getElementById('deal-view-modal');
  const dealViewTitle = document.getElementById('deal-view-title');
  const dealViewContent = document.getElementById('deal-view-content');
  
  // Update modal content
  dealViewTitle.textContent = deal.title;
  
  // Format the content
  const peerIdDisplay = deal.peerId ? 
    `<p class="peer-author">
      <span>Author: ${deal.peerId.substring(0, 8)}...</span>
      <button class="peer-connect-btn" data-peer-id="${deal.peerId}">Connect</button>
     </p>` : '';
  
  const dealTime = deal.time || 'Unknown time';
  const lastOpenedText = deal.lastOpenedAt ? 
    `<span class="timestamp">Last viewed: ${formatTimestamp(deal.lastOpenedAt)}</span>` : '';
  
  dealViewContent.innerHTML = `
    <div>
      <p>${deal.description}</p>
      <p class="price" style="margin-top: 1rem;"><strong>Price:</strong> ${deal.price}</p>
      <p style="margin-top: 0.5rem;"><strong>Contact:</strong> ${deal.contact || 'No contact provided'}</p>
      ${peerIdDisplay}
      <div style="margin-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
        <span class="timestamp">Posted: ${dealTime}</span>
        ${lastOpenedText}
      </div>
    </div>
  `;
  
  // Add event listener to connect buttons
  dealViewContent.querySelectorAll('.peer-connect-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const peerId = btn.getAttribute('data-peer-id');
      if (peerId) {
        connectToPeerFromButton(peerId);
      }
    });
  });
  
  // Show the modal
  dealViewModal.classList.add('active');
}

// Helper to connect to peer from button click
async function connectToPeerFromButton(peerId) {
  if (!peerId || peerId === window.p2pService.peerId) return;
  
  const success = await window.p2pService.connectToPeer(peerId);
  if (success) {
    showToast(`Connected to peer: ${peerId.substring(0, 8)}...`);
    updatePeerList();
  } else {
    showToast(`Failed to connect to: ${peerId.substring(0, 8)}...`, 'error');
  }
}

// Render listings with filters
function renderListings(filter = 'all', searchQuery = '') {
  const listingBoard = document.getElementById('listing-board');
  listingBoard.innerHTML = '';
  const allListings = getAllListings();
  
  const filteredListings = allListings.filter(listing => {
    const matchesCategory = filter === 'all' || listing.category === filter;
    const matchesSearch = !searchQuery || 
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  if (filteredListings.length === 0) {
    listingBoard.innerHTML = `
      <div class="message" style="grid-column: 1 / -1;">
        <h2>No offerings found</h2>
        <p>Adjust your filters or create a new offering.</p>
      </div>
    `;
    return;
  }
  
  filteredListings.forEach(listing => {
    const card = document.createElement('div');
    card.className = 'card';
    
    const isExternal = listing.external === true;
    const isOpened = listing.opened === true;
    
    // Create peer ID display with connect button
    const peerElement = listing.peerId ? 
      `<div class="peer-author">
        <span>Author: ${listing.peerId.substring(0, 8)}...</span>
        <button class="peer-connect-btn" data-peer-id="${listing.peerId}">Connect</button>
       </div>` : '';
    
    // Add opened badge if the listing has been viewed
    const openedBadge = isOpened ? '<div class="opened-badge">Viewed</div>' : '';
    
    card.innerHTML = `
      <div class="card-img">No Image</div>
      <div class="card-content">
        <div class="badge category-${listing.category}">
          ${capitalizeFirstLetter(listing.category)}
          ${isExternal ? '<span style="margin-left: 4px;">• Remote</span>' : ''}
        </div>
        ${openedBadge}
        <h3>${listing.title}</h3>
        <p>${listing.description}</p>
        <div class="card-footer">
          <span class="price">${listing.price}</span>
          <span class="time">${listing.time || 'Just now'}</span>
        </div>
        ${peerElement}
      </div>
    `;
    
    // Add event listeners
    card.addEventListener('click', () => {
      viewDeal(listing.id);
    });
    
    // Add event listener to connect buttons (prevent propagation)
    card.querySelectorAll('.peer-connect-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const peerId = btn.getAttribute('data-peer-id');
        if (peerId) {
          connectToPeerFromButton(peerId);
        }
      });
    });
    
    listingBoard.appendChild(card);
  });
}
