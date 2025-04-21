
import { dealService } from '../services/dealService.js';
import { userService } from '../services/userService.js';
import { formatRelativeTime, getUserInitial, truncateText } from '../utils.js';

// Render the home page
export function renderHomePage(container, props) {
  const { 
    onDealClick, 
    searchQuery, 
    selectedCategory,
    setSearchQuery,
    setSelectedCategory
  } = props;
  
  // Get all active deals
  let deals;
  
  if (searchQuery) {
    // Search deals
    deals = dealService.searchDeals(searchQuery);
  } else if (selectedCategory) {
    // Filter by category
    deals = dealService.getDealsByCategory(selectedCategory);
  } else {
    // Get all active deals
    deals = dealService.getActiveDeals();
  }
  
  // Sort deals by creation date (newest first)
  deals.sort((a, b) => b.createdAt - a.createdAt);
  
  // Create container element
  container.innerHTML = `
    <div class="container">
      <div class="flex justify-between items-center mb-4">
        <h1>Available Deals</h1>
        <div class="flex gap-2">
          <input 
            type="text" 
            id="search-deals" 
            placeholder="Search deals..." 
            value="${searchQuery || ''}"
            style="max-width: 200px;"
          >
        </div>
      </div>
      
      <div class="mb-4">
        <div class="flex gap-2 flex-wrap">
          <button id="filter-all" class="secondary ${!selectedCategory ? 'primary' : 'secondary'}">All</button>
          <button id="filter-goods" class="secondary ${selectedCategory === 'goods' ? 'primary' : 'secondary'}">Goods</button>
          <button id="filter-services" class="secondary ${selectedCategory === 'services' ? 'primary' : 'secondary'}">Services</button>
          <button id="filter-housing" class="secondary ${selectedCategory === 'housing' ? 'primary' : 'secondary'}">Housing</button>
          <button id="filter-jobs" class="secondary ${selectedCategory === 'jobs' ? 'primary' : 'secondary'}">Jobs</button>
          <button id="filter-community" class="secondary ${selectedCategory === 'community' ? 'primary' : 'secondary'}">Community</button>
        </div>
      </div>
      
      ${deals.length === 0 ? `
        <div class="text-center" style="padding: 3rem 0;">
          <h2>No deals found</h2>
          <p>Try a different search or category filter, or create a new deal.</p>
        </div>
      ` : `
        <div class="deals-grid">
          ${deals.map(deal => renderDealCard(deal)).join('')}
        </div>
      `}
    </div>
  `;
  
  // Add event listeners for deal cards
  deals.forEach(deal => {
    const card = document.getElementById(`deal-${deal.id}`);
    if (card) {
      card.addEventListener('click', () => onDealClick(deal.id));
    }
  });
  
  // Add event listener for search
  const searchInput = document.getElementById('search-deals');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      setSearchQuery(e.target.value);
    });
  }
  
  // Add event listeners for category filters
  document.getElementById('filter-all').addEventListener('click', () => setSelectedCategory(null));
  document.getElementById('filter-goods').addEventListener('click', () => setSelectedCategory('goods'));
  document.getElementById('filter-services').addEventListener('click', () => setSelectedCategory('services'));
  document.getElementById('filter-housing').addEventListener('click', () => setSelectedCategory('housing'));
  document.getElementById('filter-jobs').addEventListener('click', () => setSelectedCategory('jobs'));
  document.getElementById('filter-community').addEventListener('click', () => setSelectedCategory('community'));
}

// Render a deal card
function renderDealCard(deal) {
  // Get deal creator
  const creator = userService.getUserById(deal.createdBy);
  const creatorName = creator ? creator.name : 'Unknown User';
  
  // Format the price
  const formattedPrice = typeof deal.price === 'number' 
    ? deal.price.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) 
    : deal.price;
  
  return `
    <div id="deal-${deal.id}" class="card deal-card">
      <div class="deal-header">
        <span class="deal-category">${deal.category}</span>
        <span class="deal-price">${formattedPrice}</span>
      </div>
      <h3 class="deal-title">${deal.title}</h3>
      <div class="deal-location">
        <span>📍</span>
        <span>${deal.location}</span>
      </div>
      <p class="deal-description">${truncateText(deal.description, 100)}</p>
      <div class="deal-footer">
        <div class="flex items-center gap-1">
          <div style="
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background-color: var(--primary-color);
            display: flex;
            justify-content: center;
            align-items: center;
            font-weight: bold;
          ">
            ${getUserInitial(creatorName)}
          </div>
          <span>${creatorName}</span>
        </div>
        <span>${formatRelativeTime(deal.createdAt)}</span>
      </div>
    </div>
  `;
}
