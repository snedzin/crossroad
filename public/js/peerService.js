
// P2P functionality - enhanced with "Crossroad" theme and styling
class PeerBoardP2P {
  constructor() {
    this.peer = null;
    this.peerId = null;
    this.connections = new Map();
    this.onPeerConnected = null;
    this.onPeerDisconnected = null;
    this.onListingReceived = null;
    this.onDealReceived = null;
    this.userId = this.generateId();
  }
  
  // Generate a random ID
  generateId() {
    return Math.random().toString(36).substring(2, 15);
  }
  
  // Initialize the peer connection
  initializePeer() {
    return new Promise((resolve, reject) => {
      try {
        // Close existing peer if any
        if (this.peer) {
          this.peer.destroy();
        }
        
        // Generate a new peer ID
        this.peerId = `crossroad-${this.generateId()}`;
        
        // Create a new Peer instance with reliable ICE servers
        this.peer = new Peer(this.peerId, {
          debug: 2, // Enable more verbose debugging
          config: {
            'iceServers': [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:stun2.l.google.com:19302' },
              { urls: 'stun:stun3.l.google.com:19302' },
              { urls: 'stun:stun4.l.google.com:19302' }
            ]
          }
        });
        
        // Handle connection events
        this.peer.on('open', (id) => {
          console.log('My peer ID is:', id);
          this.setupPeerEvents();
          resolve(id);
        });
        
        this.peer.on('error', (err) => {
          console.error('Peer error:', err);
          reject(err);
        });
      } catch (error) {
        console.error('Failed to initialize peer:', error);
        reject(error);
      }
    });
  }
  
  // Set up event handlers for peer
  setupPeerEvents() {
    if (!this.peer) return;
    
    this.peer.on('connection', (conn) => {
      console.log("Received connection attempt from:", conn.peer);
      this.handleConnection(conn);
    });
    
    this.peer.on('disconnected', () => {
      console.log('Peer disconnected');
    });
  }
  
  // Handle new connections
  handleConnection(conn) {
    console.log('Connected to:', conn.peer);
    
    // Store the connection
    this.connections.set(conn.peer, conn);
    
    // Set up message handling
    conn.on('open', () => {
      console.log("Connection opened with:", conn.peer);
      
      // Notify callback if exists
      if (this.onPeerConnected) {
        this.onPeerConnected(conn.peer);
      }
      
      // Send a hello message
      this.sendHello(conn.peer);
      
      // Request sync of all data
      this.requestDataSync(conn.peer);
    });
    
    conn.on('data', (data) => {
      console.log("Received data from:", conn.peer, data);
      this.handleMessage(data, conn);
    });
    
    conn.on('close', () => {
      console.log('Connection closed:', conn.peer);
      this.connections.delete(conn.peer);
      
      if (this.onPeerDisconnected) {
        this.onPeerDisconnected(conn.peer);
      }
    });
    
    conn.on('error', (err) => {
      console.error('Connection error:', conn.peer, err);
    });
  }
  
  // Connect to another peer
  connectToPeer(peerId) {
    return new Promise((resolve) => {
      if (!this.peer || peerId === this.peerId) {
        console.log("Cannot connect: Invalid peer conditions");
        resolve(false);
        return;
      }
      
      // Check if already connected
      if (this.connections.has(peerId)) {
        console.log("Already connected to:", peerId);
        resolve(true);
        return;
      }
      
      try {
        console.log("Attempting to connect to:", peerId);
        const conn = this.peer.connect(peerId, { 
          reliable: true,
          serialization: 'json',
          metadata: { sender: this.peerId }
        });
        
        conn.on('open', () => {
          console.log("Successfully opened connection to:", peerId);
          this.handleConnection(conn);
          resolve(true);
        });
        
        conn.on('error', (err) => {
          console.error('Connection error:', err);
          resolve(false);
        });
        
        // Set a timeout in case connection never opens
        setTimeout(() => {
          if (!this.connections.has(peerId)) {
            console.log("Connection timeout for:", peerId);
            resolve(false);
          }
        }, 15000); // 15 seconds timeout
      } catch (error) {
        console.error('Failed to connect:', error);
        resolve(false);
      }
    });
  }
  
  // Disconnect from a peer
  disconnectFromPeer(peerId) {
    const conn = this.connections.get(peerId);
    if (conn) {
      conn.close();
      this.connections.delete(peerId);
    }
  }
  
  // Send a message to a specific peer
  sendToPeer(peerId, message) {
    const conn = this.connections.get(peerId);
    if (conn) {
      console.log("Sending message to:", peerId, message);
      conn.send(message);
      return true;
    }
    console.log("Failed to send - no connection to:", peerId);
    return false;
  }
  
  // Broadcast a message to all connected peers
  broadcast(message) {
    console.log("Broadcasting message to all peers:", message);
    this.connections.forEach((conn) => {
      conn.send(message);
    });
  }
  
  // Handle incoming messages
  handleMessage(message, connection) {
    console.log('Received message:', message.type, "from:", connection.peer);
    
    switch (message.type) {
      case 'HELLO':
        this.handleHelloMessage(message, connection);
        break;
      case 'LISTING_BROADCAST':
        if (this.onListingReceived) {
          // Add authorship data
          message.listing.peerId = message.listing.peerId || message.senderId;
          this.onListingReceived(message.listing);
        }
        break;
      case 'DEAL_BROADCAST':
        if (this.onDealReceived) {
          // Add authorship data
          message.deal.peerId = message.deal.peerId || message.senderId;
          this.onDealReceived(message.deal);
        }
        break;
      case 'DATA_SYNC_REQUEST':
        this.handleDataSyncRequest(connection.peer);
        break;
      case 'DATA_SYNC_RESPONSE':
        this.handleDataSyncResponse(message, connection);
        break;
    }
  }
  
  // Handle hello messages
  handleHelloMessage(message, connection) {
    // Reply with hello
    console.log('Received hello from:', message.senderId);
    this.sendHello(connection.peer);
  }
  
  // Send hello to a peer
  sendHello(peerId) {
    const message = {
      type: 'HELLO',
      senderId: this.peerId,
      timestamp: Date.now(),
      messageId: this.generateId(),
    };
    
    console.log("Sending hello to:", peerId);
    return this.sendToPeer(peerId, message);
  }
  
  // Request full data sync from a peer
  requestDataSync(peerId) {
    const message = {
      type: 'DATA_SYNC_REQUEST',
      senderId: this.peerId,
      timestamp: Date.now(),
      messageId: this.generateId()
    };
    
    console.log("Requesting data sync from:", peerId);
    return this.sendToPeer(peerId, message);
  }
  
  // Handle data sync request from a peer
  handleDataSyncRequest(peerId) {
    // Send all our listings and deals
    const allListings = getAllListings();
    const allDeals = getAllDeals();
    
    const message = {
      type: 'DATA_SYNC_RESPONSE',
      senderId: this.peerId,
      timestamp: Date.now(),
      messageId: this.generateId(),
      data: {
        listings: allListings,
        deals: allDeals
      }
    };
    
    console.log("Sending data sync to:", peerId, message);
    return this.sendToPeer(peerId, message);
  }
  
  // Handle incoming data sync from a peer
  handleDataSyncResponse(message, connection) {
    console.log("Received data sync from:", connection.peer, message.data);
    
    // Process listings
    if (message.data.listings && Array.isArray(message.data.listings)) {
      message.data.listings.forEach(listing => {
        // Add peer ID if not present
        listing.peerId = listing.peerId || message.senderId;
        
        if (this.onListingReceived) {
          this.onListingReceived(listing);
        }
      });
    }
    
    // Process deals
    if (message.data.deals && Array.isArray(message.data.deals)) {
      message.data.deals.forEach(deal => {
        // Add peer ID if not present
        deal.peerId = deal.peerId || message.senderId;
        
        if (this.onDealReceived) {
          this.onDealReceived(deal);
        }
      });
    }
  }
  
  // Broadcast a listing to all peers
  broadcastListing(listing) {
    // Ensure listing has peerId
    listing.peerId = listing.peerId || this.peerId;
    
    const message = {
      type: 'LISTING_BROADCAST',
      senderId: this.peerId,
      timestamp: Date.now(),
      messageId: this.generateId(),
      listing: listing
    };
    
    this.broadcast(message);
  }
  
  // Broadcast a deal to all peers
  broadcastDeal(deal) {
    // Ensure deal has peerId
    deal.peerId = deal.peerId || this.peerId;
    
    const message = {
      type: 'DEAL_BROADCAST',
      senderId: this.peerId,
      timestamp: Date.now(),
      messageId: this.generateId(),
      deal: deal
    };
    
    this.broadcast(message);
  }
  
  // Get connected peers
  getConnectedPeers() {
    return Array.from(this.connections.keys());
  }
  
  // Destroy peer connection
  destroy() {
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
      this.connections.clear();
    }
  }
}
