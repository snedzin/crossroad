
import { STORES, getItemByKey, updateItem, addItem } from '../db.js';
import { generateId } from '../utils.js';

class UserService {
  constructor() {
    this.currentUser = null;
    this.users = new Map();
  }

  // Load the user profile from IndexedDB
  async loadUserProfile() {
    try {
      // Try to get existing user
      const existingUser = await getItemByKey(STORES.USERS, 'current-user');
      
      if (existingUser) {
        // Update lastSeen time
        existingUser.lastSeen = Date.now();
        await updateItem(STORES.USERS, existingUser);
        
        this.currentUser = existingUser;
        return existingUser;
      }
      
      // Create a new user if none exists
      const newUser = {
        id: 'current-user',
        peerId: '', // Will be set when peer is initialized
        name: 'Anonymous User',
        avatar: '', // Will store base64 image
        description: '',
        location: '',
        createdAt: Date.now(),
        lastSeen: Date.now(),
      };
      
      await addItem(STORES.USERS, newUser);
      this.currentUser = newUser;
      return newUser;
    } catch (error) {
      console.error('Failed to load user profile:', error);
      throw error;
    }
  }

  // Get the current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Update the user profile
  async updateUserProfile(updates) {
    try {
      if (!this.currentUser) {
        throw new Error('No current user to update');
      }
      
      const updatedUser = {
        ...this.currentUser,
        ...updates,
        lastSeen: Date.now(),
      };
      
      await updateItem(STORES.USERS, updatedUser);
      this.currentUser = updatedUser;
      return updatedUser;
    } catch (error) {
      console.error('Failed to update user profile:', error);
      throw error;
    }
  }

  // Add or update a user in the store
  addOrUpdateUser(user) {
    this.users.set(user.id, user);
    
    // Also save to IndexedDB if it's not the current user
    if (user.id !== 'current-user') {
      updateItem(STORES.USERS, user)
        .catch(err => console.error('Failed to save external user:', err));
    }
    
    return user;
  }

  // Get a user by ID
  getUserById(userId) {
    if (userId === 'current-user' && this.currentUser) {
      return this.currentUser;
    }
    
    return this.users.get(userId);
  }

  // Get a user by peer ID
  getUserByPeerId(peerId) {
    if (this.currentUser && this.currentUser.peerId === peerId) {
      return this.currentUser;
    }
    
    for (const user of this.users.values()) {
      if (user.peerId === peerId) {
        return user;
      }
    }
    
    return null;
  }
}

// Create singleton instance
export const userService = new UserService();
