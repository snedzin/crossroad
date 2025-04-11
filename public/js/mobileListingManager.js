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
      <div class="listing-card deal-card" data-id="${deal.id}">
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
  
  container.querySelectorAll('.deal-card').forEach(card => {
    card.addEventListener('click', () => {
      const dealId = card.dataset.id;
      openDealDialog(dealId);
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

// Open the deal dialog to view details
async function openDealDialog(dealId) {
  try {
    const transaction = db.transaction(['deals'], 'readonly');
    const store = transaction.objectStore('deals');
    const request = store.get(dealId);
    
    request.onsuccess = async () => {
      const deal = request.result;
      if (!deal) {
        showToast('Error', 'Deal not found', 'error');
        return;
      }
      
      markDealAsOpened(dealId);
      
      const listing = await getListingById(deal.listingId);
      if (!listing) {
        showToast('Error', 'Listing not found', 'error');
        return;
      }
      
      const isProposer = deal.proposerId === currentUser.id;
      const otherPartyId = isProposer ? deal.receiverId : deal.proposerId;
      const otherParty = await getUserById(otherPartyId) || { name: 'Unknown' };
      
      document.getElementById('dealViewTitle').textContent = isProposer ? 
        `Your proposal for: ${listing.title}` : 
        `Proposal from ${otherParty.name} for: ${listing.title}`;
      
      document.getElementById('dealViewStatus').textContent = capitalizeFirstLetter(deal.status);
      document.getElementById('dealViewStatus').className = `peer-badge ${
        deal.status === 'pending' ? 'badge-warning' : 
        deal.status === 'accepted' ? 'badge-success' : 
        deal.status === 'rejected' ? 'badge-danger' : 'badge-info'
      }`;
      
      document.getElementById('dealViewDate').textContent = formatTimestamp(deal.createdAt);
      document.getElementById('dealViewParty').textContent = otherParty.name;
      document.getElementById('dealViewMessage').textContent = deal.message || 'No message provided';
      document.getElementById('dealViewOffer').textContent = `$${deal.offerAmount.toFixed(2)}`;
      
      const actionsContainer = document.getElementById('dealViewActions');
      
      if (deal.status === 'pending' && !isProposer) {
        actionsContainer.innerHTML = `
          <button class="btn btn-primary accept-view-deal-btn" data-id="${deal.id}">Accept Deal</button>
          <button class="btn btn-outline reject-view-deal-btn" data-id="${deal.id}">Reject Deal</button>
        `;
        
        document.querySelector('.accept-view-deal-btn').addEventListener('click', () => {
          respondToDeal(deal.id, true);
          document.getElementById('dealViewDialog').classList.remove('open');
        });
        
        document.querySelector('.reject-view-deal-btn').addEventListener('click', () => {
          respondToDeal(deal.id, false);
          document.getElementById('dealViewDialog').classList.remove('open');
        });
      } else if (deal.status === 'accepted') {
        actionsContainer.innerHTML = `
          <button class="btn btn-primary complete-deal-btn" data-id="${deal.id}">Mark as Completed</button>
        `;
        
        document.querySelector('.complete-deal-btn').addEventListener('click', () => {
          completeDeal(deal.id);
          document.getElementById('dealViewDialog').classList.remove('open');
        });
      } else {
        actionsContainer.innerHTML = '';
      }
      
      const commentsContainer = document.getElementById('dealComments');
      commentsContainer.innerHTML = '<div class="loader"></div>';
      
      const transaction = db.transaction(['comments'], 'readonly');
      const store = transaction.objectStore('comments');
      const index = store.index('dealId');
      const request = index.getAll(dealId);
      
      request.onsuccess = async () => {
        const comments = request.result || [];
        
        if (comments.length === 0) {
          commentsContainer.innerHTML = '<p class="text-center">No comments yet</p>';
          return;
        }
        
        comments.sort((a, b) => a.timestamp - b.timestamp);
        
        let html = '';
        
        for (const comment of comments) {
          const author = await getUserById(comment.authorId) || { name: 'Unknown' };
          const isCurrentUser = comment.authorId === currentUser.id;
          const timeString = formatTimestamp(comment.timestamp);
          
          html += `
            <div class="comment ${isCurrentUser ? 'comment-mine' : ''}">
              <div class="comment-header">
                <span class="comment-author">${author.name}</span>
                <span class="comment-time">${timeString}</span>
              </div>
              <div class="comment-body">
                ${comment.text}
              </div>
            </div>
          `;
        }
        
        commentsContainer.innerHTML = html;
      };
      
      request.onerror = () => {
        commentsContainer.innerHTML = '<p class="text-center">Failed to load comments</p>';
        console.error('Error loading comments:', request.error);
      };
    };
    
    request.onerror = () => {
      showToast('Error', 'Failed to load deal', 'error');
    };
  } catch (err) {
    console.error('Error opening deal dialog:', err);
    showToast('Error', 'An error occurred while opening the deal details', 'error');
  }
}

// Mark a deal as completed
async function completeDeal(dealId) {
  try {
    const transaction = db.transaction(['deals'], 'readwrite');
    const store = transaction.objectStore('deals');
    const request = store.get(dealId);
    
    request.onsuccess = () => {
      const deal = request.result;
      if (!deal) {
        showToast('Error', 'Deal not found', 'error');
        return;
      }
      
      deal.status = 'completed';
      deal.updatedAt = Date.now();
      
      const updateRequest = store.put(deal);
      
      updateRequest.onsuccess = () => {
        renderDeals();
        
        const otherPartyId = deal.proposerId === currentUser.id ? deal.receiverId : deal.proposerId;
        const connection = connections[otherPartyId];
        if (connection) {
          sendMessage(connection, {
            type: 'DEAL_RESPONSE',
            data: {
              dealId,
              status: 'completed',
              receiverId: currentUser.id
            }
          });
        }
        
        showToast('Deal Updated', 'Deal marked as completed', 'success');
      };
      
      updateRequest.onerror = () => {
        showToast('Error', 'Failed to update deal', 'error');
      };
    };
  } catch (err) {
    console.error('Error completing deal:', err);
    showToast('Error', 'An error occurred while completing the deal', 'error');
  }
}

// Load and display comments for a deal
async function loadDealComments(dealId) {
  try {
    const commentsContainer = document.getElementById('dealComments');
    commentsContainer.innerHTML = '<div class="loader"></div>';
    
    const transaction = db.transaction(['comments'], 'readonly');
    const store = transaction.objectStore('comments');
    const index = store.index('dealId');
    const request = index.getAll(dealId);
    
    request.onsuccess = async () => {
      const comments = request.result || [];
      
      if (comments.length === 0) {
        commentsContainer.innerHTML = '<p class="text-center">No comments yet</p>';
        return;
      }
      
      comments.sort((a, b) => a.timestamp - b.timestamp);
      
      let html = '';
      
      for (const comment of comments) {
        const author = await getUserById(comment.authorId) || { name: 'Unknown' };
        const isCurrentUser = comment.authorId === currentUser.id;
        const timeString = formatTimestamp(comment.timestamp);
        
        html += `
          <div class="comment ${isCurrentUser ? 'comment-mine' : ''}">
            <div class="comment-header">
              <span class="comment-author">${author.name}</span>
              <span class="comment-time">${timeString}</span>
            </div>
            <div class="comment-body">
              ${comment.text}
            </div>
          </div>
        `;
      }
      
      commentsContainer.innerHTML = html;
    };
    
    request.onerror = () => {
      commentsContainer.innerHTML = '<p class="text-center">Failed to load comments</p>';
      console.error('Error loading comments:', request.error);
    };
  } catch (err) {
    console.error('Error loading comments:', err);
    document.getElementById('dealComments').innerHTML = 
      '<p class="text-center">An error occurred while loading comments</p>';
  }
}

// Add a comment to a deal
async function addComment(dealId, text) {
  if (!text.trim()) {
    showToast('Error', 'Comment cannot be empty', 'error');
    return;
  }
  
  try {
    const comment = {
      id: generateUUID(),
      dealId,
      authorId: currentUser.id,
      text,
      timestamp: Date.now()
    };
    
    const transaction = db.transaction(['comments'], 'readwrite');
    const store = transaction.objectStore('comments');
    const request = store.add(comment);
    
    request.onsuccess = () => {
      document.getElementById('commentText').value = '';
      loadDealComments(dealId);
      
      const connection = connections[dealId];
      if (connection) {
        sendMessage(connection, {
          type: 'COMMENT_ADDED',
          data: { comment }
        });
      }
    };
    
    request.onerror = () => {
      showToast('Error', 'Failed to add comment', 'error');
    };
  } catch (err) {
    console.error('Error adding comment:', err);
    showToast('Error', 'An error occurred while adding the comment', 'error');
  }
}
