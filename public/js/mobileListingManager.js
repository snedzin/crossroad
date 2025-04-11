
// Render all listings in the listings grid
async function renderListings(filter = 'all') {
  const grid = document.getElementById('listingsGrid');
  const listings = await getAllListings();
  
  if (listings.length === 0) {
    grid.innerHTML = '<p>No listings yet. Click "Create Listing" to add one!</p>';
    return;
  }
  
  let filteredListings = listings;
  if (filter !== 'all') {
    filteredListings = listings.filter(listing => listing.category === filter);
  }
  
  if (filteredListings.length === 0) {
    grid.innerHTML = '<p>No listings found for this filter.</p>';
    return;
  }
  
  let html = '';
  
  for (const listing of filteredListings) {
    const author = await getUserById(listing.authorId) || { name: 'Unknown' };
    const dateString = new Date(listing.createdAt).toLocaleDateString();
    
    html += `
      <div class="listing-card" data-id="${listing.id}">
        <div class="listing-header">
          <div class="listing-title">${listing.title}</div>
          <div class="listing-meta">
            <span>${author.name}</span>
            <span>•</span>
            <span>${dateString}</span>
          </div>
        </div>
        <div class="listing-content">
          <p class="listing-description">${listing.description.substring(0, 100)}${listing.description.length > 100 ? '...' : ''}</p>
          <div class="listing-tags">
            ${listing.tags.map(tag => `<span class="listing-tag">${tag}</span>`).join('')}
          </div>
        </div>
        <div class="listing-footer">
          <span>$${listing.price.toFixed(2)}</span>
          <span>${listing.category}</span>
        </div>
      </div>
    `;
  }
  
  grid.innerHTML = html;
  
  // Add click event to cards
  const cards = grid.querySelectorAll('.listing-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const listingId = card.dataset.id;
      openListingDialog(listingId);
    });
  });
}

// Render user listings in the profile panel
async function renderUserListings() {
  if (!currentUser) return;
  
  const container = document.getElementById('userListings');
  const listings = await getUserListings(currentUser.id);
  
  if (listings.length === 0) {
    container.innerHTML = '<p>You have not created any listings yet.</p>';
    return;
  }
  
  let html = '';
  
  for (const listing of listings) {
    const dateString = new Date(listing.createdAt).toLocaleDateString();
    
    html += `
      <div class="listing-card" data-id="${listing.id}">
        <div class="listing-header">
          <div class="listing-title">${listing.title}</div>
          <div class="listing-meta">
            <span>${dateString}</span>
          </div>
        </div>
        <div class="listing-footer">
          <span>$${listing.price.toFixed(2)}</span>
          <span>${listing.category}</span>
        </div>
      </div>
    `;
  }
  
  container.innerHTML = html;
  
  // Add click event to cards
  const cards = container.querySelectorAll('.listing-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const listingId = card.dataset.id;
      openListingDialog(listingId);
    });
  });
}

// Open the listing dialog to view a listing
async function openListingDialog(listingId) {
  const transaction = db.transaction(['listings'], 'readonly');
  const store = transaction.objectStore('listings');
  const request = store.get(listingId);
  
  request.onsuccess = async () => {
    const listing = request.result;
    if (!listing) {
      showToast('Error', 'Listing not found', 'error');
      return;
    }
    
    currentViewingListing = listing;
    
    const author = await getUserById(listing.authorId) || { name: 'Unknown' };
    const dateString = new Date(listing.createdAt).toLocaleDateString();
    
    document.getElementById('viewListingTitle').textContent = listing.title;
    document.getElementById('viewListingDescription').textContent = listing.description;
    document.getElementById('viewListingPrice').textContent = `$${listing.price.toFixed(2)}`;
    document.getElementById('viewListingCategory').textContent = listing.category;
    
    const tagsContainer = document.getElementById('viewListingTags');
    tagsContainer.innerHTML = listing.tags.map(tag => `<span class="listing-tag">${tag}</span>`).join('');
    
    document.getElementById('viewListingAuthor').textContent = author.name;
    document.getElementById('viewListingDate').textContent = dateString;
    
    // Show propose button only if listing is not by current user
    const proposeBtn = document.getElementById('proposeBtn');
    if (listing.authorId === currentUser.id) {
      proposeBtn.style.display = 'none';
    } else {
      proposeBtn.style.display = 'block';
    }
    
    document.getElementById('viewListingDialog').classList.add('open');
  };
  
  request.onerror = () => {
    showToast('Error', 'Failed to load listing', 'error');
  };
}

// Render user deals in the deals panel
async function renderDeals() {
  if (!currentUser) return;
  
  const container = document.getElementById('userDeals');
  const deals = await getUserDeals(currentUser.id);
  
  if (deals.length === 0) {
    container.innerHTML = '<p>No deals yet</p>';
    return;
  }
  
  let html = '';
  
  for (const deal of deals) {
    const listing = await getListingById(deal.listingId);
    if (!listing) continue;
    
    const isProposer = deal.proposerId === currentUser.id;
    const otherPartyId = isProposer ? deal.receiverId : deal.proposerId;
    const otherParty = await getUserById(otherPartyId) || { name: 'Unknown' };
    
    const dateString = new Date(deal.createdAt).toLocaleDateString();
    
    html += `
      <div class="listing-card">
        <div class="listing-header">
          <div class="listing-title">${listing.title}</div>
          <div class="listing-meta">
            <span>${dateString}</span>
          </div>
        </div>
        <div class="listing-content">
          <p class="listing-description">
            ${isProposer ? 'You proposed' : 'Proposed by'}: ${otherParty.name}<br>
            Offer: $${deal.offerAmount.toFixed(2)}
          </p>
        </div>
        <div class="listing-footer">
          <span class="peer-badge ${deal.status === 'pending' ? 'badge-warning' : 
             deal.status === 'accepted' ? 'badge-success' : 'badge-danger'}">${deal.status}</span>
          ${!isProposer && deal.status === 'pending' ? `
            <div>
              <button class="btn btn-outline btn-sm accept-deal-btn" data-id="${deal.id}">Accept</button>
              <button class="btn btn-outline btn-sm reject-deal-btn" data-id="${deal.id}">Reject</button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  container.innerHTML = html;
  
  // Add event listeners for accept/reject buttons
  container.querySelectorAll('.accept-deal-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      respondToDeal(btn.dataset.id, true);
    });
  });
  
  container.querySelectorAll('.reject-deal-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      respondToDeal(btn.dataset.id, false);
    });
  });
}

// Respond to a deal proposal
async function respondToDeal(dealId, accepted) {
  try {
    const transaction = db.transaction(['deals'], 'readwrite');
    const store = transaction.objectStore('deals');
    const request = store.get(dealId);
    
    request.onsuccess = async () => {
      const deal = request.result;
      if (!deal) {
        showToast('Error', 'Deal not found', 'error');
        return;
      }
      
      deal.status = accepted ? 'accepted' : 'rejected';
      deal.updatedAt = Date.now();
      
      const updateRequest = store.put(deal);
      
      updateRequest.onsuccess = () => {
        renderDeals();
        
        // Notify the proposer
        const connection = connections[deal.proposerId];
        if (connection) {
          sendMessage(connection, {
            type: 'DEAL_RESPONSE',
            data: {
              dealId,
              accepted,
              receiverId: currentUser.id
            }
          });
        }
        
        showToast(
          'Deal Updated', 
          `You ${accepted ? 'accepted' : 'rejected'} the deal proposal`, 
          accepted ? 'success' : 'info'
        );
      };
      
      updateRequest.onerror = () => {
        showToast('Error', 'Failed to update deal', 'error');
      };
    };
    
    request.onerror = () => {
      showToast('Error', 'Failed to load deal', 'error');
    };
  } catch (err) {
    console.error('Error responding to deal:', err);
    showToast('Error', 'An error occurred while responding to the deal', 'error');
  }
}
