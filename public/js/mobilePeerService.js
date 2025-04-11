
// PeerJS Connection Management
let peer;
let connections = {};

// Initialize PeerJS
async function initPeer() {
  return new Promise((resolve, reject) => {
    // Create a new Peer with a random ID
    peer = new Peer(null, {
      debug: 2
    });

    peer.on('open', (id) => {
      console.log('My peer ID is: ' + id);
      document.getElementById('peerId').textContent = id;
      resolve(id);
    });

    peer.on('error', (err) => {
      console.error('PeerJS error:', err);
      showToast('Error', `Connection error: ${err.message}`, 'error');
      reject(err);
    });

    peer.on('connection', handleIncomingConnection);
  });
}

// Handle incoming peer connections
function handleIncomingConnection(conn) {
  console.log('Incoming connection from:', conn.peer);
  
  // Store the connection
  connections[conn.peer] = conn;
  
  // Set up connection event handlers
  setupConnectionHandlers(conn);
  
  // Send current user data to the new peer
  if (currentUser) {
    sendMessage(conn, {
      type: 'USER_INFO',
      data: { user: currentUser }
    });
    
    // Send all our listings to the new peer
    getUserListings(currentUser.id).then(listings => {
      listings.forEach(listing => {
        sendMessage(conn, {
          type: 'LISTING_BROADCAST',
          data: { listing }
        });
      });
    });
  }
  
  updateConnectionsList();
}

// Connect to another peer
function connectToPeer(peerId) {
  if (peerId === peer.id) {
    showToast('Error', 'You cannot connect to yourself', 'error');
    return;
  }
  
  if (connections[peerId]) {
    showToast('Info', 'Already connected to this peer', 'info');
    return;
  }
  
  const conn = peer.connect(peerId);
  connections[peerId] = conn;
  
  setupConnectionHandlers(conn);
  
  showToast('Connecting', `Connecting to peer: ${peerId}`, 'info');
}

// Set up event handlers for a connection
function setupConnectionHandlers(conn) {
  conn.on('open', () => {
    console.log('Connection established with:', conn.peer);
    showToast('Connected', `Connected to peer: ${conn.peer}`, 'success');
    
    // Send hello message with user info
    if (currentUser) {
      sendMessage(conn, {
        type: 'HELLO',
        data: { 
          senderId: peer.id,
          userData: currentUser
        }
      });
    }
    
    updateConnectionsList();
  });
  
  conn.on('data', (data) => {
    console.log('Received data:', data);
    handleMessage(data, conn);
  });
  
  conn.on('close', () => {
    console.log('Connection closed:', conn.peer);
    delete connections[conn.peer];
    updateConnectionsList();
    showToast('Disconnected', `Peer ${conn.peer} disconnected`, 'warning');
  });
  
  conn.on('error', (err) => {
    console.error('Connection error:', err);
    showToast('Error', `Connection error: ${err.message}`, 'error');
    delete connections[conn.peer];
    updateConnectionsList();
  });
}

// Send a message to a connection
function sendMessage(connection, message) {
  try {
    connection.send(message);
  } catch (err) {
    console.error('Error sending message:', err);
  }
}

// Broadcast a message to all connections
function broadcastMessage(message) {
  Object.values(connections).forEach(conn => {
    sendMessage(conn, message);
  });
}
