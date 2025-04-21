
import { initializeApp } from './app.js';
import { initializeDatabase } from './db.js';

// Initialize the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Initialize database first
    await initializeDatabase();
    
    // Then initialize the application
    initializeApp();
    
    console.log('Crossroad application started successfully');
  } catch (error) {
    console.error('Failed to initialize application:', error);
    document.getElementById('app').innerHTML = `
      <div class="container text-center" style="padding-top: 4rem;">
        <h1>Error Starting Crossroad</h1>
        <p>There was a problem initializing the application: ${error.message}</p>
        <button onclick="location.reload()">Try Again</button>
      </div>
    `;
  }
});
