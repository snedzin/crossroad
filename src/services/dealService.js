
import { STORES, addItem, getAllItems, getItemByKey, updateItem, deleteItem, getItemsByIndex } from '../db.js';
import { generateId } from '../utils.js';
import { peerService } from './peerService.js';
import { userService } from './userService.js';

class DealService {
  constructor() {
    this.deals = [];
    this.messages = {};
    this.bookmarks = [];
  }

  // Load all deals from IndexedDB
  async loadAllDeals() {
    try {
      const deals = await getAllItems(STORES.DEALS);
      const allMessages = await getAllItems(STORES.MESSAGES);
      const bookmarks = await getAllItems(STORES.BOOKMARKS);
      
      // Group messages by deal ID
      const messages = {};
      allMessages.forEach(message => {
        if (!messages[message.dealId]) {
          messages[message.dealId] = [];
        }
        messages[message.dealId].push(message);
      });
      
      // Sort messages by timestamp
      Object.values(messages).forEach(msgs => {
        msgs.sort((a, b) => a.timestamp - b.timestamp);
      });
      
      this.deals = deals;
      this.messages = messages;
      this.bookmarks = bookmarks;
      
      return deals;
    } catch (error) {
      console.error('Failed to load deals:', error);
      throw error;
    }
  }

  // Create a new deal
  async createDeal(dealData) {
    try {
      const currentUser = userService.getCurrentUser();
      
      if (!currentUser) {
        throw new Error('No user profile found');
      }
      
      const now = Date.now();
      
      const deal = {
        id: generateId(),
        title: dealData.title,
        description: dealData.description,
        price: dealData.price,
        category: dealData.category,
        location: dealData.location,
        images: dealData.images || [],
        createdBy: currentUser.id,
        createdAt: now,
        updatedAt: now,
        status: 'ACTIVE',
        expiresAt: dealData.expiresAt || null,
      };
      
      await addItem(STORES.DEALS, deal);
      
      // Broadcast the deal to connected peers
      peerService.broadcastDeal(deal);
      
      this.deals.push(deal);
      
      return deal;
    } catch (error) {
      console.error('Failed to create deal:', error);
      throw error;
    }
  }

  // Update an existing deal
  async updateDeal(id, updates) {
    try {
      const deal = await getItemByKey(STORES.DEALS, id);
      
      if (!deal) {
        throw new Error(`Deal not found: ${id}`);
      }
      
      const currentUser = userService.getCurrentUser();
      
      if (!currentUser || deal.createdBy !== currentUser.id) {
        throw new Error("You don't have permission to update this deal");
      }
      
      const updatedDeal = {
        ...deal,
        ...updates,
        updatedAt: Date.now(),
      };
      
      await updateItem(STORES.DEALS, updatedDeal);
      
      // Broadcast the updated deal
      peerService.broadcastDeal(updatedDeal);
      
      // Update local array
      const index = this.deals.findIndex(d => d.id === id);
      if (index !== -1) {
        this.deals[index] = updatedDeal;
      }
      
      return updatedDeal;
    } catch (error) {
      console.error('Failed to update deal:', error);
      throw error;
    }
  }

  // Delete a deal
  async deleteDeal(id) {
    try {
      const deal = await getItemByKey(STORES.DEALS, id);
      
      if (!deal) {
        throw new Error(`Deal not found: ${id}`);
      }
      
      const currentUser = userService.getCurrentUser();
      
      if (!currentUser || deal.createdBy !== currentUser.id) {
        throw new Error("You don't have permission to delete this deal");
      }
      
      // Mark the deal as deleted and broadcast the update
      const deletedDeal = {
        ...deal,
        status: 'DELETED',
        updatedAt: Date.now(),
      };
      
      await updateItem(STORES.DEALS, deletedDeal);
      
      // Broadcast the deleted deal
      peerService.broadcastDeal(deletedDeal);
      
      // Update local array
      const index = this.deals.findIndex(d => d.id === id);
      if (index !== -1) {
        this.deals[index] = deletedDeal;
      }
      
      return deletedDeal;
    } catch (error) {
      console.error('Failed to delete deal:', error);
      throw error;
    }
  }

  // Get a specific deal by ID
  getDealById(id) {
    return this.deals.find(deal => deal.id === id);
  }

  // Get deals by category
  getDealsByCategory(category) {
    return this.deals.filter(deal => 
      deal.category === category && deal.status !== 'DELETED'
    );
  }

  // Get deals by created user
  getDealsByUser(userId) {
    return this.deals.filter(deal => 
      deal.createdBy === userId && deal.status !== 'DELETED'
    );
  }

  // Get all active deals
  getActiveDeals() {
    return this.deals.filter(deal => deal.status === 'ACTIVE');
  }

  // Search deals by query
  searchDeals(query) {
    if (!query) return this.getActiveDeals();
    
    const lowerQuery = query.toLowerCase();
    
    return this.deals.filter(deal => 
      deal.status === 'ACTIVE' && (
        deal.title.toLowerCase().includes(lowerQuery) ||
        deal.description.toLowerCase().includes(lowerQuery) ||
        deal.location.toLowerCase().includes(lowerQuery)
      )
    );
  }

  // Add a message to a deal
  async addMessage(dealId, content, toPeerId) {
    try {
      const deal = this.getDealById(dealId);
      
      if (!deal) {
        throw new Error(`Deal not found: ${dealId}`);
      }
      
      const currentUser = userService.getCurrentUser();
      
      if (!currentUser) {
        throw new Error('No user profile found');
      }
      
      // Try to send the message via peer service
      const chatMessage = peerService.sendChatMessage(toPeerId, dealId, content);
      
      if (!chatMessage) {
        throw new Error('Failed to send message');
      }
      
      // Save to local database
      await addItem(STORES.MESSAGES, chatMessage);
      
      // Add to local cache
      if (!this.messages[dealId]) {
        this.messages[dealId] = [];
      }
      
      this.messages[dealId].push(chatMessage);
      
      return chatMessage;
    } catch (error) {
      console.error('Failed to add message:', error);
      throw error;
    }
  }

  // Get messages for a deal
  getMessagesForDeal(dealId) {
    return this.messages[dealId] || [];
  }

  // Add a bookmark
  async addBookmark(dealId) {
    try {
      const currentUser = userService.getCurrentUser();
      
      if (!currentUser) {
        throw new Error('No user profile found');
      }
      
      const bookmark = {
        id: generateId(),
        userId: currentUser.id,
        dealId,
        createdAt: Date.now()
      };
      
      await addItem(STORES.BOOKMARKS, bookmark);
      this.bookmarks.push(bookmark);
      
      return bookmark;
    } catch (error) {
      console.error('Failed to add bookmark:', error);
      throw error;
    }
  }

  // Remove a bookmark
  async removeBookmark(dealId) {
    try {
      const currentUser = userService.getCurrentUser();
      
      if (!currentUser) {
        throw new Error('No user profile found');
      }
      
      const bookmark = this.bookmarks.find(
        b => b.dealId === dealId && b.userId === currentUser.id
      );
      
      if (bookmark) {
        await deleteItem(STORES.BOOKMARKS, bookmark.id);
        
        // Remove from local array
        const index = this.bookmarks.findIndex(b => b.id === bookmark.id);
        if (index !== -1) {
          this.bookmarks.splice(index, 1);
        }
      }
    } catch (error) {
      console.error('Failed to remove bookmark:', error);
      throw error;
    }
  }

  // Check if a deal is bookmarked
  isBookmarked(dealId) {
    const currentUser = userService.getCurrentUser();
    
    if (!currentUser) {
      return false;
    }
    
    return this.bookmarks.some(
      b => b.dealId === dealId && b.userId === currentUser.id
    );
  }

  // Get bookmarked deals
  getBookmarkedDeals() {
    const currentUser = userService.getCurrentUser();
    
    if (!currentUser) {
      return [];
    }
    
    const userBookmarks = this.bookmarks.filter(b => b.userId === currentUser.id);
    
    return userBookmarks.map(bookmark => 
      this.getDealById(bookmark.dealId)
    ).filter(Boolean);
  }

  // Send a price offer for a deal
  async sendPriceOffer(dealId, price, comment) {
    try {
      const deal = this.getDealById(dealId);
      
      if (!deal) {
        throw new Error(`Deal not found: ${dealId}`);
      }
      
      const currentUser = userService.getCurrentUser();
      
      if (!currentUser) {
        throw new Error('No user profile found');
      }
      
      // Find the peer to send to (deal creator)
      const creatorUser = userService.getUserById(deal.createdBy);
      
      if (!creatorUser || !creatorUser.peerId) {
        throw new Error('Cannot send offer: Deal creator not connected');
      }
      
      // Send the offer
      const success = peerService.sendPriceOffer(
        creatorUser.peerId, 
        dealId, 
        price, 
        comment || 'New price offer'
      );
      
      if (!success) {
        throw new Error('Failed to send price offer');
      }
      
      // Add a message about the offer
      const message = {
        id: generateId(),
        dealId,
        fromPeerId: currentUser.peerId,
        toPeerId: creatorUser.peerId,
        content: `I offer ${price} for this deal. ${comment ? comment : ''}`,
        timestamp: Date.now(),
        isOffer: true,
        offerPrice: price,
        read: false,
      };
      
      // Save message
      await addItem(STORES.MESSAGES, message);
      
      // Add to local cache
      if (!this.messages[dealId]) {
        this.messages[dealId] = [];
      }
      
      this.messages[dealId].push(message);
      
      return message;
    } catch (error) {
      console.error('Failed to send price offer:', error);
      throw error;
    }
  }

  // Add an external deal from a peer
  addExternalDeal(deal) {
    // Check if we already have this deal
    const existingIndex = this.deals.findIndex(d => d.id === deal.id);
    
    if (existingIndex >= 0) {
      // Update the existing deal if it's older
      if (this.deals[existingIndex].updatedAt < deal.updatedAt) {
        this.deals[existingIndex] = deal;
        
        // Also update in IndexedDB
        updateItem(STORES.DEALS, deal)
          .catch(err => console.error('Failed to update external deal:', err));
      }
    } else {
      // Add the new deal
      this.deals.push(deal);
      
      // Also add to IndexedDB
      addItem(STORES.DEALS, deal)
        .catch(err => console.error('Failed to save external deal:', err));
    }
    
    return deal;
  }

  // Add an external message from a peer
  addExternalMessage(message) {
    // Check if we already have this message
    const dealMessages = this.messages[message.dealId] || [];
    
    if (dealMessages.some(m => m.id === message.id)) {
      return message;
    }
    
    // Add the message
    if (!this.messages[message.dealId]) {
      this.messages[message.dealId] = [];
    }
    
    this.messages[message.dealId].push(message);
    
    // Sort by timestamp
    this.messages[message.dealId].sort((a, b) => a.timestamp - b.timestamp);
    
    // Also add to IndexedDB
    addItem(STORES.MESSAGES, message)
      .catch(err => console.error('Failed to save external message:', err));
    
    return message;
  }

  // Broadcast all deals to a new peer
  broadcastDeals(peerId) {
    // Only broadcast deals created by the current user
    const currentUser = userService.getCurrentUser();
    
    if (!currentUser) {
      return;
    }
    
    const myDeals = this.deals.filter(deal => deal.createdBy === currentUser.id);
    
    myDeals.forEach(deal => {
      peerService.sendDeal(peerId, deal);
    });
  }
}

// Create singleton instance
export const dealService = new DealService();
