
# Crossroad - P2P Bulletin Board

A decentralized peer-to-peer bulletin board system inspired by the concept of "deals with the Devil at the crossroads" - get anything you desire through this direct, serverless marketplace.

## Features

- Create and view listings with no central server
- Connect with other users directly through peer-to-peer technology
- Store data locally in your browser
- Search and filter listings by category
- Works offline with sync when peers connect
- Retro-digital, old-school Americana aesthetic with a devil-themed design

## Quick Start

1. **Open the Application**:
   - Simply open `public/standalone.html` in your browser, or
   - Serve it through any web server

2. **For Mobile Devices**:
   - The interface is fully responsive for mobile devices

## How It Works

This application uses:
- PeerJS for WebRTC peer-to-peer connections
- LocalStorage for persistent data storage
- No frameworks, no build steps - just vanilla HTML, CSS, and JavaScript
- Themed with a "crossroad" design that evokes the aesthetic of devil's deals

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
    ├── standalone.html # Main application (standalone version)
    └── mobile.html     # Mobile-optimized version
```
