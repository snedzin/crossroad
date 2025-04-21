
import { userService } from '../services/userService.js';
import { peerService } from '../services/peerService.js';
import { readPeersFromFile, imageToBase64 } from '../utils.js';
import { app } from '../app.js';

// Render the settings page
export function renderSettingsPage(container) {
  // Get current user
  const currentUser = userService.getCurrentUser();
  
  if (!currentUser) {
    container.innerHTML = `
      <div class="container text-center" style="padding-top: 4rem;">
        <h1>User Profile Not Found</h1>
        <p>There was a problem loading your user profile.</p>
        <button onclick="location.reload()">Try Again</button>
      </div>
    `;
    return;
  }
  
  // Get connected peers
  const connectedPeers = peerService.getConnectedPeers();
  const peerObjects = connectedPeers.map(peerId => {
    const user = userService.getUserByPeerId(peerId);
    return {
      peerId,
      name: user ? user.name : 'Unknown User',
      location: user ? user.location : '',
      source: 'direct' // TODO: Track source
    };
  });
  
  container.innerHTML = `
    <div class="container">
      <h1 class="mb-4">Settings</h1>
      
      <div class="card mb-4">
        <h2 class="mb-4">User Profile</h2>
        
        <form id="profile-form">
          <div class="form-group">
            <label for="user-name">Username</label>
            <input type="text" id="user-name" value="${currentUser.name}" required>
            <small>Your Peer ID will be generated from your username</small>
          </div>
          
          <div class="form-group">
            <label for="user-avatar">Avatar</label>
            <div class="flex items-center gap-4">
              <div style="
                width: 80px;
                height: 80px;
                border-radius: 50%;
                background-color: var(--primary-color);
                display: flex;
                justify-content: center;
                align-items: center;
                font-weight: bold;
                font-size: 36px;
                overflow: hidden;
              " id="avatar-preview">
                ${currentUser.avatar 
                  ? `<img src="${currentUser.avatar}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover;">` 
                  : currentUser.name.charAt(0).toUpperCase()}
              </div>
              <input type="file" id="user-avatar-input" accept="image/*" style="display: none;">
              <button type="button" id="select-avatar" class="secondary">Select Image</button>
            </div>
          </div>
          
          <div class="form-group">
            <label for="user-location">Location (City, Country)</label>
            <input type="text" id="user-location" value="${currentUser.location || ''}">
          </div>
          
          <div class="form-group">
            <label for="user-description">About Me</label>
            <textarea id="user-description" rows="3">${currentUser.description || ''}</textarea>
          </div>
          
          <div class="form-group">
            <label for="user-peer-id">Your Peer ID</label>
            <div class="flex gap-2">
              <input type="text" id="user-peer-id" value="${currentUser.peerId}" readonly>
              <button type="button" id="copy-peer-id" class="secondary">Copy</button>
            </div>
            <small>Share your Peer ID with others so they can connect to you</small>
          </div>
          
          <div class="text-right">
            <button type="submit">Save Profile</button>
          </div>
        </form>
      </div>
      
      <div class="card mb-4">
        <h2 class="mb-4">Connect to Peers</h2>
        
        <div class="form-group">
          <label for="connect-peer-id">Connect to Peer Directly</label>
          <div class="flex gap-2">
            <input type="text" id="connect-peer-id" placeholder="Enter Peer ID">
            <button id="connect-button" class="secondary">Connect</button>
          </div>
        </div>
        
        <div class="form-group">
          <label for="connect-from-file">Connect from File</label>
          <div class="flex gap-2">
            <input type="file" id="connect-from-file" accept=".txt">
            <button id="connect-file-button" class="secondary">Connect All</button>
          </div>
          <small>Upload a text file with one Peer ID per line</small>
        </div>
      </div>
      
      <div class="card">
        <h2 class="mb-4">Connected Peers</h2>
        
        ${peerObjects.length === 0 ? `
          <p>No peers connected. Connect to peers using the options above.</p>
        ` : `
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="text-align: left; padding: 0.5rem;">Username</th>
                  <th style="text-align: left; padding: 0.5rem;">Location</th>
                  <th style="text-align: left; padding: 0.5rem;">Source</th>
                  <th style="text-align: left; padding: 0.5rem;">Peer ID</th>
                  <th style="text-align: left; padding: 0.5rem;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${peerObjects.map(peer => `
                  <tr>
                    <td style="padding: 0.5rem;">${peer.name}</td>
                    <td style="padding: 0.5rem;">${peer.location || 'Unknown'}</td>
                    <td style="padding: 0.5rem;">${peer.source}</td>
                    <td style="padding: 0.5rem;">${peer.peerId}</td>
                    <td style="padding: 0.5rem;">
                      <button class="disconnect-peer secondary" data-peer-id="${peer.peerId}">Disconnect</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    </div>
  `;
  
  // Add event listeners
  
  // Profile form
  document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
      name: document.getElementById('user-name').value,
      location: document.getElementById('user-location').value,
      description: document.getElementById('user-description').value
    };
    
    try {
      await userService.updateUserProfile(formData);
      
      // Show success message
      alert('Profile updated successfully');
      
      // If the name changed, need to reset peer connection
      if (formData.name !== currentUser.name) {
        if (confirm('Username changed. This requires reconnecting to the network. Continue?')) {
          const newPeerId = `crossroad-${formData.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
          await app.state.resetPeerConnection(newPeerId);
          
          // Refresh the page
          app.refreshPage();
        }
      }
    } catch (error) {
      alert(`Failed to update profile: ${error.message}`);
    }
  });
  
  // Avatar selection
  document.getElementById('select-avatar').addEventListener('click', () => {
    document.getElementById('user-avatar-input').click();
  });
  
  document.getElementById('user-avatar-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const base64Image = await imageToBase64(file);
      
      // Preview the image
      const previewElem = document.getElementById('avatar-preview');
      previewElem.innerHTML = `<img src="${base64Image}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover;">`;
      
      // Update user profile
      await userService.updateUserProfile({ avatar: base64Image });
    } catch (error) {
      alert(`Failed to upload avatar: ${error.message}`);
    }
  });
  
  // Copy peer ID
  document.getElementById('copy-peer-id').addEventListener('click', () => {
    const peerIdInput = document.getElementById('user-peer-id');
    peerIdInput.select();
    document.execCommand('copy');
    
    // Show confirmation
    const copyButton = document.getElementById('copy-peer-id');
    const originalText = copyButton.textContent;
    copyButton.textContent = 'Copied!';
    setTimeout(() => {
      copyButton.textContent = originalText;
    }, 2000);
  });
  
  // Connect to peer
  document.getElementById('connect-button').addEventListener('click', async () => {
    const peerId = document.getElementById('connect-peer-id').value.trim();
    
    if (!peerId) {
      alert('Please enter a Peer ID');
      return;
    }
    
    try {
      const success = await peerService.connectToPeer(peerId);
      
      if (success) {
        alert('Connected successfully');
        // Refresh page to show the new peer
        app.refreshPage();
      } else {
        alert('Failed to connect to peer');
      }
    } catch (error) {
      alert(`Failed to connect: ${error.message}`);
    }
  });
  
  // Connect from file
  document.getElementById('connect-file-button').addEventListener('click', async () => {
    const fileInput = document.getElementById('connect-from-file');
    const file = fileInput.files[0];
    
    if (!file) {
      alert('Please select a file');
      return;
    }
    
    try {
      const peers = await readPeersFromFile(file);
      
      if (peers.length === 0) {
        alert('No valid peer IDs found in the file');
        return;
      }
      
      // Connect to all peers
      let successCount = 0;
      for (const peerId of peers) {
        const success = await peerService.connectToPeer(peerId);
        if (success) successCount++;
      }
      
      alert(`Connected to ${successCount} out of ${peers.length} peers`);
      
      // Refresh page to show new peers
      if (successCount > 0) {
        app.refreshPage();
      }
    } catch (error) {
      alert(`Failed to process file: ${error.message}`);
    }
  });
  
  // Disconnect peers
  document.querySelectorAll('.disconnect-peer').forEach(button => {
    button.addEventListener('click', () => {
      const peerId = button.getAttribute('data-peer-id');
      
      if (confirm(`Are you sure you want to disconnect from ${peerId}?`)) {
        peerService.disconnectFromPeer(peerId);
        app.refreshPage();
      }
    });
  });
}
