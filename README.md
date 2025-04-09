
# P2P Bulletin Board

A decentralized peer-to-peer bulletin board system that works directly in your browser with no server required.

## Features

- Create and view listings without a central server
- Connect with peers to share and discover content
- Store data locally in your browser
- Search and filter listings by category
- Works offline

## Quick Start

1. **Open the Application**:
   - Simply open `public/index.html` in your browser, or
   - Serve it through any web server

2. **For Mobile Devices**:
   - Use `public/mobile.html` for a mobile-optimized experience

## How It Works

This application uses:
- PeerJS for WebRTC peer-to-peer connections
- LocalStorage for persistent data storage
- No frameworks, no build steps - just vanilla HTML, CSS, and JavaScript

## Documentation

For more detailed information, see the [documentation](docs/README.md).

## Deployment

### GitHub Pages

This repository is set up to automatically deploy to GitHub Pages when changes are pushed to the main branch.

### Other Hosting Options

The application can be hosted on any static file hosting service. Just upload the files from the `public` directory.

## License

MIT

## Project Structure

The essential files for this project are:

```
/
├── .github/workflows/  # GitHub Actions for deployment
├── docs/               # Documentation
└── public/             # Application files
    ├── index.html      # Main application
    └── mobile.html     # Mobile-optimized version
```
