
# Getting Started

## Prerequisites

- Node.js 16.x or higher
- npm 7.x or higher
- Modern web browser (Chrome, Firefox, Edge, Safari)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/p2p-bulletin-board.git
cd p2p-bulletin-board
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open the application in your browser:

```
http://localhost:5173
```

## Building for Production

1. Create a production build:

```bash
npm run build
```

2. Preview the production build:

```bash
npm run preview
```

## Deployment Options

### Static Site Hosting

The application can be deployed to any static site hosting service:

- GitHub Pages
- Netlify
- Vercel
- Firebase Hosting

Example GitHub Pages deployment:

```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add deploy script to package.json
# "deploy": "gh-pages -d dist"

# Build and deploy
npm run build
npm run deploy
```

### Local Deployment

For local networks, you can use any simple HTTP server:

```bash
# Using Python
python -m http.server -d dist

# Using npm serve package
npx serve dist
```

## Configuration

No server-side configuration is required since the application uses:

- Browser IndexedDB for storage
- WebRTC for peer-to-peer communication
- PeerJS servers for connection brokering only

## Development Workflow

1. Make changes to the code
2. Run the development server (`npm run dev`)
3. Test changes in the browser
4. Build for production (`npm run build`)
5. Deploy to your hosting platform of choice
