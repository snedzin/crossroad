
import { create } from "zustand";
import { User } from "@/lib/types";
import { generateId } from "@/lib/utils";
import { STORES, addItem, getItemByKey, updateItem } from "@/lib/db";

interface UserState {
  currentUser: User | null;
  users: Map<string, User>;
  loadUserProfile: () => Promise<User>;
  updateUserProfile: (updates: Partial<User>) => Promise<User>;
  addOrUpdateUser: (user: User) => void;
  getUserById: (userId: string) => User | undefined;
  getUserByPeerId: (peerId: string) => User | undefined;
}

export const useUserStore = create<UserState>((set, get) => ({
  currentUser: null,
  users: new Map(),

  // Load the user profile from IndexedDB
  loadUserProfile: async () => {
    try {
      // Try to get existing user
      const existingUser = await getItemByKey<User>(STORES.USERS, "current-user");
      
      if (existingUser) {
        // Update lastSeen time
        existingUser.lastSeen = Date.now();
        await updateItem(STORES.USERS, existingUser);
        
        set({ currentUser: existingUser });
        return existingUser;
      }
      
      // Create a new user if none exists
      const newUser: User = {
        id: "current-user",
        peerId: "", // Will be set when peer is initialized
        name: "Anonymous User",
        createdAt: Date.now(),
        lastSeen: Date.now(),
        reputation: 0,
      };
      
      await addItem(STORES.USERS, newUser);
      set({ currentUser: newUser });
      return newUser;
    } catch (error) {
      console.error("Failed to load user profile:", error);
      throw error;
    }
  },

  // Update the user profile
  updateUserProfile: async (updates: Partial<User>) => {
    try {
      const { currentUser } = get();
      if (!currentUser) {
        throw new Error("No current user to update");
      }
      
      const updatedUser = {
        ...currentUser,
        ...updates,
        lastSeen: Date.now(),
      };
      
      await updateItem(STORES.USERS, updatedUser);
      set({ currentUser: updatedUser });
      return updatedUser;
    } catch (error) {
      console.error("Failed to update user profile:", error);
      throw error;
    }
  },

  // Add or update a user in the store
  addOrUpdateUser: (user: User) => {
    set((state) => {
      const users = new Map(state.users);
      users.set(user.id, user);
      return { users };
    });
  },

  // Get a user by ID
  getUserById: (userId: string) => {
    const { users, currentUser } = get();
    
    if (userId === "current-user" && currentUser) {
      return currentUser;
    }
    
    return users.get(userId);
  },

  // Get a user by peer ID
  getUserByPeerId: (peerId: string) => {
    const { users, currentUser } = get();
    
    if (currentUser && currentUser.peerId === peerId) {
      return currentUser;
    }
    
    for (const user of users.values()) {
      if (user.peerId === peerId) {
        return user;
      }
    }
    
    return undefined;
  },
}));
