
import { create } from "zustand";
import { Deal, DealStatus, Message } from "@/lib/types";
import { STORES, addItem, getAllItems, getItemByKey, updateItem } from "@/lib/db";
import { generateId } from "@/lib/utils";
import { peerService } from "@/lib/peerService";
import { useUserStore } from "./userStore";

interface DealState {
  deals: Deal[];
  messages: Record<string, Message[]>; // Map of dealId to messages
  isLoading: boolean;
  loadAllDeals: () => Promise<Deal[]>;
  createDeal: (listingId: string, recipientId: string, terms?: string) => Promise<Deal>;
  updateDealStatus: (id: string, status: DealStatus) => Promise<Deal>;
  getDealById: (id: string) => Deal | undefined;
  getDealsByListingId: (listingId: string) => Deal[];
  getDealsByUserId: (userId: string) => Deal[];
  addMessage: (dealId: string, content: string, toPeerId: string) => Promise<Message>;
  getMessagesForDeal: (dealId: string) => Message[];
  addExternalDeal: (deal: Deal) => void;
  addExternalMessage: (message: Message) => void;
}

export const useDealStore = create<DealState>((set, get) => ({
  deals: [],
  messages: {},
  isLoading: false,

  // Load all deals from IndexedDB
  loadAllDeals: async () => {
    set({ isLoading: true });
    
    try {
      const deals = await getAllItems<Deal>(STORES.DEALS);
      const allMessages = await getAllItems<Message>(STORES.MESSAGES);
      
      // Group messages by deal ID
      const messages: Record<string, Message[]> = {};
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
      
      set({
        deals,
        messages,
        isLoading: false,
      });
      
      return deals;
    } catch (error) {
      console.error("Failed to load deals:", error);
      set({ isLoading: false });
      throw error;
    }
  },

  // Create a new deal
  createDeal: async (listingId: string, recipientId: string, terms?: string) => {
    try {
      const currentUser = useUserStore.getState().currentUser;
      
      if (!currentUser) {
        throw new Error("No user profile found");
      }
      
      const now = Date.now();
      
      const deal: Deal = {
        id: generateId(),
        listingId,
        initiatorId: currentUser.id,
        recipientId,
        status: DealStatus.PROPOSED,
        terms,
        createdAt: now,
        updatedAt: now,
      };
      
      await addItem(STORES.DEALS, deal);
      
      // If recipient has a peer ID, send them the proposal
      const recipient = useUserStore.getState().getUserById(recipientId);
      if (recipient && recipient.peerId) {
        peerService.sendDealProposal(recipient.peerId, deal);
      }
      
      set((state) => ({
        deals: [...state.deals, deal],
      }));
      
      return deal;
    } catch (error) {
      console.error("Failed to create deal:", error);
      throw error;
    }
  },

  // Update a deal's status
  updateDealStatus: async (id: string, status: DealStatus) => {
    try {
      const deal = await getItemByKey<Deal>(STORES.DEALS, id);
      
      if (!deal) {
        throw new Error(`Deal not found: ${id}`);
      }
      
      const currentUser = useUserStore.getState().currentUser;
      
      if (!currentUser || (deal.initiatorId !== currentUser.id && deal.recipientId !== currentUser.id)) {
        throw new Error("You don't have permission to update this deal");
      }
      
      const updatedDeal: Deal = {
        ...deal,
        status,
        updatedAt: Date.now(),
        completedAt: status === DealStatus.COMPLETED ? Date.now() : deal.completedAt,
      };
      
      await updateItem(STORES.DEALS, updatedDeal);
      
      // Notify the other party
      const otherUserId = currentUser.id === deal.initiatorId ? deal.recipientId : deal.initiatorId;
      const otherUser = useUserStore.getState().getUserById(otherUserId);
      
      if (otherUser && otherUser.peerId) {
        peerService.sendDealResponse(otherUser.peerId, id, status === DealStatus.ACCEPTED);
      }
      
      set((state) => ({
        deals: state.deals.map(d => d.id === id ? updatedDeal : d),
      }));
      
      return updatedDeal;
    } catch (error) {
      console.error("Failed to update deal status:", error);
      throw error;
    }
  },

  // Get a deal by ID
  getDealById: (id: string) => {
    return get().deals.find(deal => deal.id === id);
  },

  // Get deals by listing ID
  getDealsByListingId: (listingId: string) => {
    return get().deals.filter(deal => deal.listingId === listingId);
  },

  // Get deals by user ID
  getDealsByUserId: (userId: string) => {
    return get().deals.filter(deal => 
      deal.initiatorId === userId || deal.recipientId === userId
    );
  },

  // Add a message to a deal
  addMessage: async (dealId: string, content: string, toPeerId: string) => {
    try {
      const deal = get().getDealById(dealId);
      
      if (!deal) {
        throw new Error(`Deal not found: ${dealId}`);
      }
      
      const currentUser = useUserStore.getState().currentUser;
      
      if (!currentUser) {
        throw new Error("No user profile found");
      }
      
      const message: Message = {
        id: generateId(),
        dealId,
        fromPeerId: currentUser.peerId || "",
        toPeerId,
        content,
        timestamp: Date.now(),
        read: false,
      };
      
      await addItem(STORES.MESSAGES, message);
      
      // Send message to the recipient
      if (toPeerId) {
        peerService.sendChatMessage(toPeerId, message);
      }
      
      set((state) => {
        const dealMessages = state.messages[dealId] || [];
        
        return {
          messages: {
            ...state.messages,
            [dealId]: [...dealMessages, message],
          },
        };
      });
      
      return message;
    } catch (error) {
      console.error("Failed to add message:", error);
      throw error;
    }
  },

  // Get messages for a deal
  getMessagesForDeal: (dealId: string) => {
    const dealMessages = get().messages[dealId] || [];
    return dealMessages.sort((a, b) => a.timestamp - b.timestamp);
  },

  // Add an external deal from a peer
  addExternalDeal: (deal: Deal) => {
    set((state) => {
      // Check if we already have this deal
      const existingIndex = state.deals.findIndex(d => d.id === deal.id);
      
      if (existingIndex >= 0) {
        // Update the existing deal if it's older
        if (state.deals[existingIndex].updatedAt < deal.updatedAt) {
          const deals = [
            ...state.deals.slice(0, existingIndex),
            deal,
            ...state.deals.slice(existingIndex + 1)
          ];
          
          // Also update in IndexedDB
          updateItem(STORES.DEALS, deal)
            .catch(err => console.error("Failed to update external deal:", err));
          
          return { deals };
        }
        
        return state;
      } else {
        // Add the new deal
        const deals = [...state.deals, deal];
        
        // Also add to IndexedDB
        addItem(STORES.DEALS, deal)
          .catch(err => console.error("Failed to save external deal:", err));
        
        return { deals };
      }
    });
  },

  // Add an external message from a peer
  addExternalMessage: (message: Message) => {
    set((state) => {
      // Check if we already have this message
      const dealMessages = state.messages[message.dealId] || [];
      
      if (dealMessages.some(m => m.id === message.id)) {
        return state;
      }
      
      // Add the message
      const newDealMessages = [...dealMessages, message];
      
      // Sort by timestamp
      newDealMessages.sort((a, b) => a.timestamp - b.timestamp);
      
      // Also add to IndexedDB
      addItem(STORES.MESSAGES, message)
        .catch(err => console.error("Failed to save external message:", err));
      
      return {
        messages: {
          ...state.messages,
          [message.dealId]: newDealMessages,
        },
      };
    });
  },
}));
