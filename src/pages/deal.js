
import { dealService } from '../services/dealService.js';
import { userService } from '../services/userService.js';
import { peerService } from '../services/peerService.js';
import { formatDate, formatRelativeTime, getUserInitial } from '../utils.js';
import { app } from '../app.js';

// Render a single deal page
export function renderDealPage(container, dealId) {
  // Get the deal
  const deal = dealService.getDealById(dealId);
  
  if (!deal) {
    container.innerHTML = `
      <div class="container text-center" style="padding-top: 4rem;">
        <h1>Deal Not Found</h1>
        <p>The deal you're looking for doesn't exist or has been removed.</p>
        <button onclick="window.location.hash = ''">Go Back</button>
      </div>
    `;
    return;
  }
  
  // Get deal creator
  const creator = userService.getUserById(deal.createdBy);
  const creatorName = creator ? creator.name : 'Unknown User';
  const creatorLocation = creator ? creator.location : '';
  
  // Get current user
  const currentUser = userService.getCurrentUser();
  
  // Check if user is the creator
  const isCreator = currentUser && creator && currentUser.id === creator.id;
  
  // Check if the deal is bookmarked
  const isBookmarked = dealService.isBookmarked(dealId);
  
  // Format the price
  const formattedPrice = typeof deal.price === 'number' 
    ? deal.price.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) 
    : deal.price;
  
  // Get messages
  const messages = dealService.getMessagesForDeal(dealId);
  
  container.innerHTML = `
    <div class="container">
      <div class="mb-4">
        <button onclick="window.location.hash = ''" class="secondary">
          ← Back to Deals
        </button>
      </div>
      
      <div class="card">
        <div class="flex justify-between items-center mb-4">
          <div>
            <span class="deal-category">${deal.category}</span>
            <h1 class="deal-title">${deal.title}</h1>
          </div>
          <div class="deal-price" style="font-size: 1.5rem;">
            ${formattedPrice}
          </div>
        </div>
        
        <div class="deal-location mb-4">
          <span>📍</span>
          <span>${deal.location}</span>
        </div>
        
        <div class="mb-4">
          <p>${deal.description}</p>
        </div>
        
        ${deal.expiresAt ? `
          <div class="mb-4">
            <p><strong>Available until:</strong> ${formatDate(deal.expiresAt)}</p>
          </div>
        ` : ''}
        
        <div class="mb-4">
          <p><strong>Posted:</strong> ${formatDate(deal.createdAt)}</p>
        </div>
        
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-2">
            <div style="
              width: 40px;
              height: 40px;
              border-radius: 50%;
              background-color: var(--primary-color);
              display: flex;
              justify-content: center;
              align-items: center;
              font-weight: bold;
              font-size: 20px;
            ">
              ${getUserInitial(creatorName)}
            </div>
            <div>
              <div><strong>${creatorName}</strong></div>
              ${creatorLocation ? `<div>${creatorLocation}</div>` : ''}
            </div>
          </div>
          
          <div class="flex gap-2">
            ${isCreator ? `
              <button id="edit-deal" class="secondary">Edit</button>
              <button id="delete-deal" class="danger">Delete</button>
            ` : `
              <button id="bookmark-deal" class="secondary">
                ${isBookmarked ? 'Unbookmark' : 'Bookmark'}
              </button>
              <button id="offer-price" class="secondary">Make Offer</button>
            `}
          </div>
        </div>
      </div>
      
      ${!isCreator ? `
        <div class="card mt-4">
          <h2 class="mb-4">Messages</h2>
          
          <div class="chat-container">
            <div class="chat-messages" id="message-container">
              ${messages.length === 0 ? `
                <div class="text-center" style="padding: 2rem 0; color: var(--text-secondary);">
                  No messages yet. Start the conversation!
                </div>
              ` : messages.map(message => renderChatMessage(message)).join('')}
            </div>
            
            <div class="chat-input">
              <input type="text" id="message-input" placeholder="Type a message...">
              <button id="send-message">Send</button>
            </div>
          </div>
        </div>
      ` : messages.length > 0 ? `
        <div class="card mt-4">
          <h2 class="mb-4">Messages</h2>
          
          <div class="chat-container">
            <div class="chat-messages" id="message-container">
              ${messages.map(message => renderChatMessage(message)).join('')}
            </div>
            
            <div class="chat-input">
              <input type="text" id="message-input" placeholder="Type a message...">
              <button id="send-message">Send</button>
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
  
  // Scroll to bottom of chat
  const messageContainer = document.getElementById('message-container');
  if (messageContainer) {
    messageContainer.scrollTop = messageContainer.scrollHeight;
  }
  
  // Add event listeners
  if (isCreator) {
    // Edit deal
    document.getElementById('edit-deal')?.addEventListener('click', () => {
      openEditDealDialog(deal);
    });
    
    // Delete deal
    document.getElementById('delete-deal')?.addEventListener('click', async () => {
      if (confirm('Are you sure you want to delete this deal?')) {
        try {
          await dealService.deleteDeal(dealId);
          window.location.hash = '';
        } catch (error) {
          alert(`Failed to delete deal: ${error.message}`);
        }
      }
    });
  } else {
    // Bookmark/unbookmark
    document.getElementById('bookmark-deal')?.addEventListener('click', async () => {
      try {
        if (isBookmarked) {
          await dealService.removeBookmark(dealId);
        } else {
          await dealService.addBookmark(dealId);
        }
        
        // Refresh the page
        app.refreshPage();
      } catch (error) {
        alert(`Failed to ${isBookmarked ? 'unbookmark' : 'bookmark'} deal: ${error.message}`);
      }
    });
    
    // Make offer
    document.getElementById('offer-price')?.addEventListener('click', () => {
      openOfferDialog(deal);
    });
  }
  
  // Send message
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-message');
  
  if (messageInput && sendButton) {
    const sendMessage = async () => {
      const content = messageInput.value.trim();
      
      if (!content) return;
      
      try {
        // Determine recipient
        let recipientId;
        
        if (isCreator) {
          // Find the other user by searching messages
          const otherMessage = messages.find(m => m.fromPeerId !== currentUser.peerId);
          recipientId = otherMessage ? otherMessage.fromPeerId : null;
        } else {
          // Send to creator
          recipientId = creator?.peerId;
        }
        
        if (!recipientId) {
          throw new Error('No recipient found');
        }
        
        await dealService.addMessage(dealId, content, recipientId);
        messageInput.value = '';
        
        // Refresh the message list
        app.refreshPage();
      } catch (error) {
        alert(`Failed to send message: ${error.message}`);
      }
    };
    
    sendButton.addEventListener('click', sendMessage);
    
    messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
  }
}

// Render a chat message
function renderChatMessage(message) {
  const currentUser = userService.getCurrentUser();
  const isMine = currentUser?.peerId === message.fromPeerId;
  
  // Get user from peer ID
  const user = isMine 
    ? currentUser 
    : userService.getUserByPeerId(message.fromPeerId);
  
  return `
    <div class="chat-message ${isMine ? 'sent' : 'received'}">
      ${message.isOffer ? `
        <strong>Price Offer: ${message.offerPrice.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</strong>
        <br>
      ` : ''}
      ${message.content}
      <div style="font-size: 0.75rem; opacity: 0.7; margin-top: 0.25rem; text-align: right;">
        ${user?.name || 'Unknown'} - ${formatRelativeTime(message.timestamp)}
      </div>
    </div>
  `;
}

// Open edit deal dialog
function openEditDealDialog(deal) {
  // Create modal overlay
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'modal-overlay';
  
  // Create modal content
  modalOverlay.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title">Edit Deal</h2>
        <button class="modal-close">&times;</button>
      </div>
      <form id="edit-deal-form">
        <div class="form-group">
          <label for="deal-title">Name</label>
          <input type="text" id="deal-title" value="${deal.title}" required>
        </div>
        <div class="form-group">
          <label for="deal-description">Description</label>
          <textarea id="deal-description" rows="4" required>${deal.description}</textarea>
        </div>
        <div class="form-group">
          <label for="deal-price">Price</label>
          <input type="number" id="deal-price" min="0" step="0.01" value="${deal.price}" required>
        </div>
        <div class="form-group">
          <label for="deal-category">Category</label>
          <select id="deal-category" required>
            <option value="goods" ${deal.category === 'goods' ? 'selected' : ''}>Goods</option>
            <option value="services" ${deal.category === 'services' ? 'selected' : ''}>Services</option>
            <option value="housing" ${deal.category === 'housing' ? 'selected' : ''}>Housing</option>
            <option value="jobs" ${deal.category === 'jobs' ? 'selected' : ''}>Jobs</option>
            <option value="community" ${deal.category === 'community' ? 'selected' : ''}>Community</option>
          </select>
        </div>
        <div class="form-group">
          <label for="deal-location">Location (City, Country)</label>
          <input type="text" id="deal-location" value="${deal.location}" required>
        </div>
        <div class="form-group">
          <label for="deal-expires">Offer Valid Until (Optional)</label>
          <input type="datetime-local" id="deal-expires" value="${deal.expiresAt ? new Date(deal.expiresAt).toISOString().slice(0, 16) : ''}">
        </div>
        <div class="modal-footer">
          <button type="button" class="secondary" id="cancel-edit">Cancel</button>
          <button type="submit">Save Changes</button>
        </div>
      </form>
    </div>
  `;
  
  // Add to DOM
  document.body.appendChild(modalOverlay);
  
  // Add event listeners
  document.querySelector('.modal-close').addEventListener('click', () => {
    document.body.removeChild(modalOverlay);
  });
  
  document.getElementById('cancel-edit').addEventListener('click', () => {
    document.body.removeChild(modalOverlay);
  });
  
  document.getElementById('edit-deal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
      title: document.getElementById('deal-title').value,
      description: document.getElementById('deal-description').value,
      price: parseFloat(document.getElementById('deal-price').value),
      category: document.getElementById('deal-category').value,
      location: document.getElementById('deal-location').value,
      expiresAt: document.getElementById('deal-expires').value 
        ? new Date(document.getElementById('deal-expires').value).getTime() 
        : null
    };
    
    try {
      await dealService.updateDeal(deal.id, formData);
      document.body.removeChild(modalOverlay);
      
      // Refresh the current page
      app.refreshPage();
    } catch (error) {
      alert(`Failed to update deal: ${error.message}`);
    }
  });
}

// Open price offer dialog
function openOfferDialog(deal) {
  // Create modal overlay
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'modal-overlay';
  
  // Create modal content
  modalOverlay.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title">Make an Offer</h2>
        <button class="modal-close">&times;</button>
      </div>
      <form id="offer-form">
        <div class="form-group">
          <label for="offer-price">Your Price Offer</label>
          <input type="number" id="offer-price" min="0" step="0.01" value="${deal.price}" required>
        </div>
        <div class="form-group">
          <label for="offer-comment">Comment (Optional)</label>
          <textarea id="offer-comment" rows="3" placeholder="Explain your offer..."></textarea>
        </div>
        <div class="modal-footer">
          <button type="button" class="secondary" id="cancel-offer">Cancel</button>
          <button type="submit">Send Offer</button>
        </div>
      </form>
    </div>
  `;
  
  // Add to DOM
  document.body.appendChild(modalOverlay);
  
  // Add event listeners
  document.querySelector('.modal-close').addEventListener('click', () => {
    document.body.removeChild(modalOverlay);
  });
  
  document.getElementById('cancel-offer').addEventListener('click', () => {
    document.body.removeChild(modalOverlay);
  });
  
  document.getElementById('offer-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const price = parseFloat(document.getElementById('offer-price').value);
    const comment = document.getElementById('offer-comment').value;
    
    try {
      await dealService.sendPriceOffer(deal.id, price, comment);
      document.body.removeChild(modalOverlay);
      
      // Refresh the current page
      app.refreshPage();
    } catch (error) {
      alert(`Failed to send offer: ${error.message}`);
    }
  });
}
