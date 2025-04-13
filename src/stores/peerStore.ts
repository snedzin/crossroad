
import { create } from "zustand";
import { PeerInfo, PeerConnectionStatus } from "@/lib/types";
import { peerService } from "@/lib/peerService";
import { useUserStore } from "./userStore";

interface PeerState {
  myPeerId: string | null;
  connectedPeers: Map<string, PeerInfo>;
  connectionStatus: PeerConnectionStatus;
  isInitializing: boolean;
  initializePeer: () => Promise<string>;
  connectToPeer: (peerId: string) => Promise<boolean>;
  disconnectFromPeer: (peerId: string) => void;
  updatePeerStatus: (peerId: string, status: PeerConnectionStatus) => void;
  resetPeerConnection: (newPeerId?: string) => Promise<string>;
}

export const usePeerStore = create<PeerState>((set, get) => ({
  myPeerId: null,
  connectedPeers: new Map(),
  connectionStatus: PeerConnectionStatus.DISCONNECTED,
  isInitializing: false,

  // Initialize peer connection
  initializePeer: async () => {
    set({ isInitializing: true });
    
    try {
      const currentUser = useUserStore.getState().currentUser;
      
      if (!currentUser) {
        throw new Error("No user profile found");
      }
      
      // Use username-based peer ID if user has one
      const peerId = await peerService.initialize(currentUser.id, currentUser.peerId);
      
      // Update the user profile with the peer ID if it changed
      if (currentUser.peerId !== peerId) {
        await useUserStore.getState().updateUserProfile({ peerId });
      }
      
      // Set up connection listener
      peerService.addConnectionListener((peerId, status) => {
        get().updatePeerStatus(peerId, status);
      });
      
      set({ 
        myPeerId: peerId, 
        connectionStatus: PeerConnectionStatus.CONNECTED,
        isInitializing: false 
      });
      
      return peerId;
    } catch (error) {
      console.error("Failed to initialize peer:", error);
      set({ 
        connectionStatus: PeerConnectionStatus.ERROR,
        isInitializing: false 
      });
      throw error;
    }
  },

  // Reset and reinitialize peer connection with a new ID
  resetPeerConnection: async (newPeerId) => {
    set({ isInitializing: true });
    
    try {
      // First destroy the existing connection
      peerService.destroy();
      
      const currentUser = useUserStore.getState().currentUser;
      
      if (!currentUser) {
        throw new Error("No user profile found");
      }
      
      // Initialize with the new peer ID
      const peerId = await peerService.initialize(currentUser.id, newPeerId);
      
      // Update the user profile with the new peer ID
      await useUserStore.getState().updateUserProfile({ peerId });
      
      set({ 
        myPeerId: peerId, 
        connectedPeers: new Map(),
        connectionStatus: PeerConnectionStatus.CONNECTED,
        isInitializing: false 
      });
      
      return peerId;
    } catch (error) {
      console.error("Failed to reset peer connection:", error);
      set({ 
        connectionStatus: PeerConnectionStatus.ERROR,
        isInitializing: false 
      });
      throw error;
    }
  },

  // Connect to another peer
  connectToPeer: async (peerId: string) => {
    try {
      const success = await peerService.connectToPeer(peerId);
      
      if (success) {
        const currentUser = useUserStore.getState().currentUser;
        if (currentUser) {
          // Send hello message
          peerService.sendHello(peerId, currentUser);
        }
      }
      
      return success;
    } catch (error) {
      console.error("Failed to connect to peer:", error);
      return false;
    }
  },

  // Disconnect from a peer
  disconnectFromPeer: (peerId: string) => {
    peerService.disconnectFromPeer(peerId);
  },

  // Update a peer's status
  updatePeerStatus: (peerId: string, status: PeerConnectionStatus) => {
    set((state) => {
      const connectedPeers = new Map(state.connectedPeers);
      
      if (status === PeerConnectionStatus.DISCONNECTED) {
        connectedPeers.delete(peerId);
      } else {
        const existing = connectedPeers.get(peerId);
        connectedPeers.set(peerId, {
          id: peerId,
          lastSeen: Date.now(),
          status,
          userId: existing?.userId,
        });
      }
      
      return { connectedPeers };
    });
  },
}));
