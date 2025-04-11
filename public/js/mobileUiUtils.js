
// UI utility functions

// Generate user initials for avatar
function getInitials(name) {
  if (!name) return '?';
  return name.split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

// Update the connections list in the UI
async function updateConnectionsList() {
  const container = document.getElementById('connectedPeers');
  
  if (Object.keys(connections).length === 0) {
    container.innerHTML = '<p>No connections yet</p>';
    return;
  }
  
  let html = '';
  
  for (const peerId in connections) {
    const user = await getUserById(peerId) || { id: peerId, name: 'Unknown User' };
    html += `
      <div class="connection-item">
        <div class="connection-avatar">${getInitials(user.name)}</div>
        <div class="connection-details">
          <div class="connection-name">${user.name}</div>
          <div class="connection-id">${peerId}</div>
        </div>
        <span class="peer-badge badge-connected">Connected</span>
      </div>
    `;
  }
  
  container.innerHTML = html;
}

// Create and display a toast notification
function showToast(title, message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const iconMap = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };
  
  toast.innerHTML = `
    <div class="toast-icon">${iconMap[type] || 'ℹ'}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close">&times;</button>
  `;
  
  container.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => {
    toast.classList.add('visible');
  }, 10);
  
  // Auto-dismiss after 5 seconds
  const timeout = setTimeout(() => {
    dismissToast(toast);
  }, 5000);
  
  // Click to dismiss
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    clearTimeout(timeout);
    dismissToast(toast);
  });
}

// Dismiss a toast notification
function dismissToast(toast) {
  toast.classList.remove('visible');
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 300);
}

// Helper function to generate a UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, 
          v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Handle incoming messages
async function handleMessage(message, connection) {
  try {
    switch (message.type) {
      case 'HELLO':
        if (message.data && message.data.userData) {
          const userData = message.data.userData;
          await saveUser(userData);
          updateConnectionsList();
        }
        break;
        
      case 'USER_INFO':
        if (message.data && message.data.user) {
          const userData = message.data.user;
          await saveUser(userData);
          updateConnectionsList();
        }
        break;
        
      case 'LISTING_BROADCAST':
        if (message.data && message.data.listing) {
          const listing = message.data.listing;
          await saveListing(listing);
          renderListings();
          showToast('New Listing', `New listing: ${listing.title}`, 'info');
        }
        break;
        
      case 'DEAL_PROPOSAL':
        if (message.data && message.data.deal) {
          const deal = message.data.deal;
          await saveDeal(deal);
          renderDeals();
          showToast('New Deal', 'You received a new deal proposal', 'success');
        }
        break;
        
      case 'DEAL_RESPONSE':
        if (message.data) {
          const { dealId, accepted } = message.data;
          showToast(
            'Deal Update', 
            accepted ? 'Your deal was accepted!' : 'Your deal was rejected', 
            accepted ? 'success' : 'error'
          );
        }
        break;
        
      default:
        console.log('Unknown message type:', message.type);
    }
  } catch (err) {
    console.error('Error handling message:', err);
  }
}
