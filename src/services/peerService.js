
import { generateId } from '../utils.js';

export class PeerService {
  constructor() {
    this.peer = null;
    this.connections = new Map();
    this.peerId = null;
    this.userId = null;
    this.messageHandlers = new Map();
    this.connectionListeners = [];
  }

  // Initialize the peer service
  async initialize(userId, customPeerId) {
    return new Promise((resolve, reject) => {
      try {
        this.userId = userId;
        
        // Load PeerJS from CDN if not already loaded
        if (!window.Peer) {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js';
          script.async = true;
          
          script.onload = () => {
            this.initializePeer(customPeerId, resolve, reject);
          };
          
          script.onerror = (err) => {
            reject(new Error('Failed to load PeerJS library'));
          };
          
          document.head.appendChild(script);
        } else {
          this.initializePeer(customPeerId, resolve, reject);
        }
      } catch (error) {
        reject(error);
      }
    });
  }
  
  // Initialize the Peer object
  initializePeer(customPeerId, resolve, reject) {
    // Use custom peer ID if provided, otherwise generate one
    this.peerId = customPeerId || `crossroad-${generateId()}`;
    
    // Create a new Peer instance
    this.peer = new Peer();
    
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
        
        // Create a new Peer instance without passing an argument
        this.peer = new Peer();
        
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
  }

  // Get the peer ID
  getPeerId() {
    return this.peerId;
  }

  // Set up peer event listeners
  setupPeerEvents() {
    if (!this.peer) return;
    
    this.peer.on('connection', (conn) => {
      this.handleConnection(conn);
    });
    
    this.peer.on('disconnected', () => {
      console.log('Peer disconnected');
      this.notifyConnectionListeners(this.peerId, 'DISCONNECTED');
    });
    
    this.peer.on('close', () => {
      console.log('Peer connection closed');
      this.connections.clear();
    });
  }

  // Handle a new connection
  handleConnection(conn) {
    console.log('Connected to:', conn.peer);
    
    // Store the connection
    this.connections.set(conn.peer, conn);
    
    // Notify connection listeners
    this.notifyConnectionListeners(conn.peer, 'CONNECTED');
    
    // Set up connection events
    conn.on('data', (data) => {
      this.handleMessage(data, conn);
    });
    
    conn.on('close', () => {
      console.log('Connection closed:', conn.peer);
      this.connections.delete(conn.peer);
      this.notifyConnectionListeners(conn.peer, 'DISCONNECTED');
    });
    
    conn.on('error', (err) => {
      console.error('Connection error:', err);
      this.notifyConnectionListeners(conn.peer, 'ERROR');
    });
  }

  // Connect to a peer
  async connectToPeer(peerId) {
    return new Promise((resolve) => {
      if (!this.peer || this.connections.has(peerId) || peerId === this.peerId) {
        resolve(false);
        return;
      }
      
      // Notify that we're connecting
      this.notifyConnectionListeners(peerId, 'CONNECTING');
      
      const conn = this.peer.connect(peerId, { reliable: true });
      
      conn.on('open', () => {
        this.handleConnection(conn);
        resolve(true);
      });
      
      conn.on('error', () => {
        this.notifyConnectionListeners(peerId, 'ERROR');
        resolve(false);
      });
      
      // Set a timeout in case the connection never opens
      setTimeout(() => {
        if (!this.connections.has(peerId)) {
          this.notifyConnectionListeners(peerId, 'ERROR');
          resolve(false);
        }
      }, 10000);
    });
  }

  // Disconnect from a specific peer
  disconnectFromPeer(peerId) {
    const conn = this.connections.get(peerId);
    if (conn) {
      conn.close();
      this.connections.delete(peerId);
      this.notifyConnectionListeners(peerId, 'DISCONNECTED');
    }
  }

  // Send a message to a specific peer
  sendToPeer(peerId, message) {
    const conn = this.connections.get(peerId);
    if (conn) {
      conn.send(message);
      return true;
    }
    return false;
  }

  // Broadcast a message to all connected peers
  broadcast(message) {
    this.connections.forEach((conn) => {
      conn.send(message);
    });
  }

  // Handle incoming messages
  handleMessage(message, connection) {
    const handlers = this.messageHandlers.get(message.type) || [];
    handlers.forEach(handler => handler(message, connection));
  }

  // Add a message handler
  addMessageHandler(type, handler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type).push(handler);
  }

  // Remove a message handler
  removeMessageHandler(type, handler) {
    const handlers = this.messageHandlers.get(type) || [];
    const index = handlers.findIndex(h => h === handler);
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }

  // Add a connection listener
  addConnectionListener(listener) {
    this.connectionListeners.push(listener);
  }

  // Remove a connection listener
  removeConnectionListener(listener) {
    const index = this.connectionListeners.findIndex(l => l === listener);
    if (index !== -1) {
      this.connectionListeners.splice(index, 1);
    }
  }

  // Notify all connection listeners
  notifyConnectionListeners(peerId, status) {
    this.connectionListeners.forEach(listener => listener(peerId, status));
  }

  // Get all connected peers
  getConnectedPeers() {
    return Array.from(this.connections.keys());
  }

  // Send a hello message to a peer
  sendHello(peerId, userData) {
    const message = {
      type: 'HELLO',
      senderId: this.peerId,
      timestamp: Date.now(),
      messageId: generateId(),
      userData
    };
    return this.sendToPeer(peerId, message);
  }

  // Send user info to a peer
  sendUserInfo(peerId, user) {
    const message = {
      type: 'USER_INFO',
      senderId: this.peerId,
      timestamp: Date.now(),
      messageId: generateId(),
      user
    };
    return this.sendToPeer(peerId, message);
  }

  // Share known peers with a peer
  sharePeers(peerId) {
    const message = {
      type: 'PEER_LIST',
      senderId: this.peerId,
      timestamp: Date.now(),
      messageId: generateId(),
      peers: this.getConnectedPeers().filter(p => p !== peerId)
    };
    return this.sendToPeer(peerId, message);
  }

  // Send a deal message
  sendDeal(peerId, deal) {
    const message = {
      type: 'LISTING_BROADCAST',
      senderId: this.peerId,
      timestamp: Date.now(),
      messageId: generateId(),
      listing: deal
    };
    return this.sendToPeer(peerId, message);
  }

  // Broadcast a deal
  broadcastDeal(deal) {
    const message = {
      type: 'LISTING_BROADCAST',
      senderId: this.peerId,
      timestamp: Date.now(),
      messageId: generateId(),
      listing: deal
    };
    this.broadcast(message);
  }

  // Send a chat message
  sendChatMessage(peerId, dealId, content) {
    const chatMessage = {
      id: generateId(),
      dealId,
      fromPeerId: this.peerId,
      toPeerId: peerId,
      content,
      timestamp: Date.now(),
      read: false,
    };
    
    const message = {
      type: 'CHAT_MESSAGE',
      senderId: this.peerId,
      timestamp: Date.now(),
      messageId: generateId(),
      dealId,
      message: chatMessage
    };
    
    return this.sendToPeer(peerId, message) ? chatMessage : null;
  }

  // Send a deal proposal
  sendDealProposal(peerId, deal) {
    const message = {
      type: 'DEAL_PROPOSAL',
      senderId: this.peerId,
      timestamp: Date.now(),
      messageId: generateId(),
      deal
    };
    return this.sendToPeer(peerId, message);
  }

  // Send a price offer
  sendPriceOffer(peerId, dealId, price, comment) {
    const message = {
      type: 'PRICE_OFFER',
      senderId: this.peerId,
      timestamp: Date.now(),
      messageId: generateId(),
      dealId,
      price,
      comment
    };
    return this.sendToPeer(peerId, message);
  }

  // Destroy the peer connection
  destroy() {
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
