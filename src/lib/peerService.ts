
import Peer, { DataConnection } from "peerjs";
import { 
  P2PMessage, 
  MessageType, 
  HelloMessage,
  PeerInfo,
  PeerConnectionStatus,
  User,
  Listing,
  ListingBroadcastMessage,
  UserInfoMessage,
  Deal,
  DealProposalMessage,
  Message,
  ChatMessage,
  ListingRequestMessage,
  DealResponseMessage,
  PeerListMessage
} from "./types";
import { generateId } from "./utils";

export class PeerService {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private peerId: string | null = null;
  private userId: string | null = null;
  private messageHandlers: Map<MessageType, ((message: any, connection: DataConnection) => void)[]> = new Map();
  private connectionListeners: ((peerId: string, status: PeerConnectionStatus) => void)[] = [];

  // Initialize the peer service
  async initialize(userId: string, customPeerId?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        this.userId = userId;
        
        // Use custom peer ID if provided, otherwise generate one
        this.peerId = customPeerId || `p2p-board-${generateId()}`;
        
        // Fix: Create a new Peer instance without passing options
        this.peer = new Peer(this.peerId);
        
        this.peer.on('open', (id) => {
          console.log('My peer ID is: ' + id);
          this.setupPeerEvents();
          resolve(id);
        });
        
        this.peer.on('error', (err) => {
          console.error('Peer error:', err);
          
          // If the ID is already taken, try again with a different ID
          if (err.type === 'unavailable-id' && customPeerId) {
            console.log('Peer ID already taken, generating a new one');
            const newPeerId = `${customPeerId}-${generateId(4)}`;
            this.peerId = newPeerId;
            
            // Fix: Create a new Peer instance without passing options
            this.peer = new Peer(newPeerId);
            
            this.peer.on('open', (id) => {
              console.log('New peer ID is: ' + id);
              this.setupPeerEvents();
              resolve(id);
            });
            
            this.peer.on('error', (newErr) => {
              console.error('Second peer error:', newErr);
              reject(newErr);
            });
          } else {
            reject(err);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  // Get the peer ID
  getPeerId(): string | null {
    return this.peerId;
  }

  // Set up peer event listeners
  private setupPeerEvents(): void {
    if (!this.peer) return;
    
    this.peer.on('connection', (conn) => {
      this.handleConnection(conn);
    });
    
    this.peer.on('disconnected', () => {
      console.log('Peer disconnected');
      this.notifyConnectionListeners(this.peerId || '', PeerConnectionStatus.DISCONNECTED);
    });
    
    this.peer.on('close', () => {
      console.log('Peer connection closed');
      this.connections.clear();
    });
  }

  // Handle a new connection
  private handleConnection(conn: DataConnection): void {
    console.log('Connected to:', conn.peer);
    
    // Store the connection
    this.connections.set(conn.peer, conn);
    
    // Notify connection listeners
    this.notifyConnectionListeners(conn.peer, PeerConnectionStatus.CONNECTED);
    
    // Set up connection events
    conn.on('data', (data) => {
      this.handleMessage(data as P2PMessage, conn);
    });
    
    conn.on('close', () => {
      console.log('Connection closed:', conn.peer);
      this.connections.delete(conn.peer);
      this.notifyConnectionListeners(conn.peer, PeerConnectionStatus.DISCONNECTED);
    });
    
    conn.on('error', (err) => {
      console.error('Connection error:', err);
      this.notifyConnectionListeners(conn.peer, PeerConnectionStatus.ERROR);
    });
  }

  // Connect to a peer
  async connectToPeer(peerId: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.peer || this.connections.has(peerId) || peerId === this.peerId) {
        resolve(false);
        return;
      }
      
      // Notify that we're connecting
      this.notifyConnectionListeners(peerId, PeerConnectionStatus.CONNECTING);
      
      const conn = this.peer.connect(peerId, { reliable: true });
      
      conn.on('open', () => {
        this.handleConnection(conn);
        resolve(true);
      });
      
      conn.on('error', () => {
        this.notifyConnectionListeners(peerId, PeerConnectionStatus.ERROR);
        resolve(false);
      });
      
      // Set a timeout in case the connection never opens
      setTimeout(() => {
        if (!this.connections.has(peerId)) {
          this.notifyConnectionListeners(peerId, PeerConnectionStatus.ERROR);
          resolve(false);
        }
      }, 10000);
    });
  }

  // Disconnect from a specific peer
  disconnectFromPeer(peerId: string): void {
    const conn = this.connections.get(peerId);
    if (conn) {
      conn.close();
      this.connections.delete(peerId);
      this.notifyConnectionListeners(peerId, PeerConnectionStatus.DISCONNECTED);
    }
  }

  // Send a message to a specific peer
  sendToPeer<T extends P2PMessage>(peerId: string, message: T): boolean {
    const conn = this.connections.get(peerId);
    if (conn) {
      conn.send(message);
      return true;
    }
    return false;
  }

  // Broadcast a message to all connected peers
  broadcast<T extends P2PMessage>(message: T): void {
    this.connections.forEach((conn) => {
      conn.send(message);
    });
  }

  // Handle incoming messages
  private handleMessage(message: P2PMessage, connection: DataConnection): void {
    const handlers = this.messageHandlers.get(message.type) || [];
    handlers.forEach(handler => handler(message, connection));
  }

  // Add a message handler
  addMessageHandler<T extends P2PMessage>(type: MessageType, handler: (message: T, connection: DataConnection) => void): void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)?.push(handler as any);
  }

  // Remove a message handler
  removeMessageHandler<T extends P2PMessage>(type: MessageType, handler: (message: T, connection: DataConnection) => void): void {
    const handlers = this.messageHandlers.get(type) || [];
    const index = handlers.findIndex(h => h === handler);
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }

  // Add a connection listener
  addConnectionListener(listener: (peerId: string, status: PeerConnectionStatus) => void): void {
    this.connectionListeners.push(listener);
  }

  // Remove a connection listener
  removeConnectionListener(listener: (peerId: string, status: PeerConnectionStatus) => void): void {
    const index = this.connectionListeners.findIndex(l => l === listener);
    if (index !== -1) {
      this.connectionListeners.splice(index, 1);
    }
  }

  // Notify all connection listeners
  private notifyConnectionListeners(peerId: string, status: PeerConnectionStatus): void {
    this.connectionListeners.forEach(listener => listener(peerId, status));
  }

  // Get all connected peers
  getConnectedPeers(): string[] {
    return Array.from(this.connections.keys());
  }

  // Send a hello message to a peer
  sendHello(peerId: string, userData: User): boolean {
    const message: HelloMessage = {
      type: MessageType.HELLO,
      senderId: this.peerId || '',
      timestamp: Date.now(),
      messageId: generateId(),
      userData
    };
    return this.sendToPeer(peerId, message);
  }

  // Broadcast a new listing
  broadcastListing(listing: Listing): void {
    const message: ListingBroadcastMessage = {
      type: MessageType.LISTING_BROADCAST,
      senderId: this.peerId || '',
      timestamp: Date.now(),
      messageId: generateId(),
      listing
    };
    this.broadcast(message);
  }

  // Request a specific listing from a peer
  requestListing(peerId: string, listingId: string): boolean {
    const message: ListingRequestMessage = {
      type: MessageType.LISTING_REQUEST,
      senderId: this.peerId || '',
      timestamp: Date.now(),
      messageId: generateId(),
      listingId
    };
    return this.sendToPeer(peerId, message);
  }

  // Send a deal proposal to a peer
  sendDealProposal(peerId: string, deal: Deal): boolean {
    const message: DealProposalMessage = {
      type: MessageType.DEAL_PROPOSAL,
      senderId: this.peerId || '',
      timestamp: Date.now(),
      messageId: generateId(),
      deal
    };
    return this.sendToPeer(peerId, message);
  }

  // Send a deal response to a peer
  sendDealResponse(peerId: string, dealId: string, accepted: boolean, responseMessage?: string): boolean {
    const message: DealResponseMessage = {
      type: MessageType.DEAL_RESPONSE,
      senderId: this.peerId || '',
      timestamp: Date.now(),
      messageId: generateId(),
      dealId,
      accepted,
      message: responseMessage
    };
    return this.sendToPeer(peerId, message);
  }

  // Send a chat message for a deal
  sendChatMessage(peerId: string, chatMessage: Message): boolean {
    const message: ChatMessage = {
      type: MessageType.CHAT_MESSAGE,
      senderId: this.peerId || '',
      timestamp: Date.now(),
      messageId: generateId(),
      dealId: chatMessage.dealId,
      message: chatMessage
    };
    return this.sendToPeer(peerId, message);
  }

  // Share user info with a peer
  shareUserInfo(peerId: string, user: User): boolean {
    const message: UserInfoMessage = {
      type: MessageType.USER_INFO,
      senderId: this.peerId || '',
      timestamp: Date.now(),
      messageId: generateId(),
      user
    };
    return this.sendToPeer(peerId, message);
  }

  // Share known peers with a peer
  sharePeers(peerId: string): boolean {
    const message: PeerListMessage = {
      type: MessageType.PEER_LIST,
      senderId: this.peerId || '',
      timestamp: Date.now(),
      messageId: generateId(),
      peers: this.getConnectedPeers().filter(p => p !== peerId)
    };
    return this.sendToPeer(peerId, message);
  }

  // Destroy the peer connection
  destroy(): void {
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
      this.connections.clear();
      this.peerId = null;
    }
  }
}

// Create a singleton instance
export const peerService = new PeerService();
