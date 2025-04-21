
import { renderHomePage } from './pages/home.js';
import { renderSettingsPage } from './pages/settings.js';
import { renderDealPage } from './pages/deal.js';
import { peerService } from './services/peerService.js';
import { userService } from './services/userService.js';
import { dealService } from './services/dealService.js';

// Declare application state
const appState = {
  currentPage: 'home',
  currentDealId: null,
  searchQuery: '',
  selectedCategory: null,
  isConnected: false,
  isInitializing: false
};

// Initialize the application
export async function initializeApp() {
  // Get the app container
  const appContainer = document.getElementById('app');
  
  // First, load user profile
  await userService.loadUserProfile();
  
  // Then, initialize the peer service
  appState.isInitializing = true;
  try {
    const user = userService.getCurrentUser();
    const peerId = await peerService.initialize(user.id, `crossroad-${user.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`);
    
    // Update the user profile with peer ID if necessary
    if (user.peerId !== peerId) {
      await userService.updateUserProfile({ peerId });
    }
    
    appState.isConnected = true;
    console.log(`Connected with peer ID: ${peerId}`);
  } catch (error) {
    console.error('Failed to connect to P2P network:', error);
    appState.isConnected = false;
  } finally {
    appState.isInitializing = false;
  }
  
  // Load all existing deals
  await dealService.loadAllDeals();
  
  // Setup message handlers
  setupMessageHandlers();
  
  // Setup route handling
  window.addEventListener('hashchange', handleRouteChange);
  
  // Render the application header
  renderHeader();
  
  // Render the initial page
  handleRouteChange();
}

// Render the application header
function renderHeader() {
  const header = document.createElement('header');
  
  header.innerHTML = `
    <div class="container header-content">
      <a href="#" class="logo">
        <span class="logo-icon">🔄</span>
        <span>Crossroad</span>
      </a>
      <nav>
        <ul>
          <li><a href="#" id="nav-home">Deals</a></li>
          <li><a href="#settings" id="nav-settings">Settings</a></li>
          <li>
            <button id="create-deal" class="secondary">
              + New Deal
            </button>
          </li>
        </ul>
      </nav>
    </div>
  `;
  
  const appContainer = document.getElementById('app');
  appContainer.prepend(header);
  
  // Add event listener for new deal button
  document.getElementById('create-deal').addEventListener('click', openCreateDealDialog);
  
  // Highlight active nav item
  updateActiveNavItem();
}

// Update the active nav item based on current page
function updateActiveNavItem() {
  const navItems = document.querySelectorAll('nav a');
  navItems.forEach(item => {
    item.classList.remove('active');
    
    if (item.id === `nav-${appState.currentPage}`) {
      item.classList.add('active');
    }
  });
}

// Handle route changes
function handleRouteChange() {
  const hash = window.location.hash.substring(1) || 'home';
  
  if (hash.startsWith('deal/')) {
    appState.currentDealId = hash.split('/')[1];
    appState.currentPage = 'deal';
  } else {
    appState.currentPage = hash || 'home';
    appState.currentDealId = null;
  }
  
  renderCurrentPage();
  updateActiveNavItem();
}

// Render the current page based on route
function renderCurrentPage() {
  const mainContent = document.querySelector('main') || document.createElement('main');
  
  // Clear main content if it already exists
  if (mainContent.parentNode) {
    mainContent.innerHTML = '';
  } else {
    document.getElementById('app').appendChild(mainContent);
  }
  
  // Render the appropriate page
  switch (appState.currentPage) {
    case 'home':
      renderHomePage(mainContent, {
        onDealClick: (dealId) => {
          window.location.hash = `deal/${dealId}`;
        },
        searchQuery: appState.searchQuery,
        selectedCategory: appState.selectedCategory,
        setSearchQuery: (query) => {
          appState.searchQuery = query;
          renderCurrentPage();
        },
        setSelectedCategory: (category) => {
          appState.selectedCategory = category;
          renderCurrentPage();
        }
      });
      break;
    case 'settings':
      renderSettingsPage(mainContent);
      break;
    case 'deal':
      if (appState.currentDealId) {
        renderDealPage(mainContent, appState.currentDealId);
      } else {
        window.location.hash = '';
      }
      break;
    default:
      renderNotFoundPage(mainContent);
      break;
  }
}

// Render a 404 page
function renderNotFoundPage(container) {
  container.innerHTML = `
    <div class="container text-center" style="padding-top: 4rem;">
      <h1>Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <button onclick="window.location.hash = ''">Go Home</button>
    </div>
  `;
}

// Setup message handlers for P2P communication
function setupMessageHandlers() {
  // Handle incoming deals
  peerService.addMessageHandler('LISTING_BROADCAST', (message) => {
    dealService.addExternalDeal(message.listing);
  });
  
  // Handle incoming messages
  peerService.addMessageHandler('CHAT_MESSAGE', (message) => {
    dealService.addExternalMessage(message.message);
  });
  
  // Handle user information
  peerService.addMessageHandler('USER_INFO', (message) => {
    userService.addOrUpdateUser(message.user);
  });
  
  // Handle hello messages
  peerService.addMessageHandler('HELLO', (message) => {
    userService.addOrUpdateUser(message.userData);
    
    // Share our details in response
    const currentUser = userService.getCurrentUser();
    if (currentUser) {
      peerService.sendUserInfo(message.senderId, currentUser);
      peerService.sharePeers(message.senderId);
    }
    
    // Broadcast our deals to the new peer
    dealService.broadcastDeals(message.senderId);
  });
  
  // Handle deal proposals
  peerService.addMessageHandler('DEAL_PROPOSAL', (message) => {
    dealService.addExternalDeal(message.deal);
  });
}

// Open create deal dialog
function openCreateDealDialog() {
  // Create modal overlay
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'modal-overlay';
  
  // Create modal content
  modalOverlay.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title">Create New Deal</h2>
        <button class="modal-close">&times;</button>
      </div>
      <form id="create-deal-form">
        <div class="form-group">
          <label for="deal-title">Name</label>
          <input type="text" id="deal-title" required>
        </div>
        <div class="form-group">
          <label for="deal-description">Description</label>
          <textarea id="deal-description" rows="4" required></textarea>
        </div>
        <div class="form-group">
          <label for="deal-price">Price</label>
          <input type="number" id="deal-price" min="0" step="0.01" required>
        </div>
        <div class="form-group">
          <label for="deal-category">Category</label>
          <select id="deal-category" required>
            <option value="goods">Goods</option>
            <option value="services">Services</option>
            <option value="housing">Housing</option>
            <option value="jobs">Jobs</option>
            <option value="community">Community</option>
          </select>
        </div>
        <div class="form-group">
          <label for="deal-location">Location (City, Country)</label>
          <input type="text" id="deal-location" required>
        </div>
        <div class="form-group">
          <label for="deal-expires">Offer Valid Until (Optional)</label>
          <input type="datetime-local" id="deal-expires">
        </div>
        <div class="modal-footer">
          <button type="button" class="secondary" id="cancel-deal">Cancel</button>
          <button type="submit">Create Deal</button>
        </div>
      </form>
    </div>
  `;
  
  // Add to DOM
  document.body.appendChild(modalOverlay);
  
  // Add event listeners
  document.querySelector('.modal-close').addEventListener('click', () => {
    document.body.removeChild(modalOverlay);
  });
  
  document.getElementById('cancel-deal').addEventListener('click', () => {
    document.body.removeChild(modalOverlay);
  });
  
  document.getElementById('create-deal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
      title: document.getElementById('deal-title').value,
      description: document.getElementById('deal-description').value,
      price: parseFloat(document.getElementById('deal-price').value),
      category: document.getElementById('deal-category').value,
      location: document.getElementById('deal-location').value,
      expiresAt: document.getElementById('deal-expires').value 
        ? new Date(document.getElementById('deal-expires').value).getTime() 
        : null
    };
    
    try {
      const newDeal = await dealService.createDeal(formData);
      document.body.removeChild(modalOverlay);
      
      // Refresh the current page to show the new deal
      renderCurrentPage();
      
      // Navigate to the new deal
      window.location.hash = `deal/${newDeal.id}`;
    } catch (error) {
      console.error('Failed to create deal:', error);
      alert(`Failed to create deal: ${error.message}`);
    }
  });
}

// Export app state and functions that might be needed by other modules
export const app = {
  state: appState,
  refreshPage: renderCurrentPage,
  navigate: (path) => {
    window.location.hash = path;
  }
};
