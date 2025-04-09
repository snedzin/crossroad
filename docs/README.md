
# P2P Bulletin Board Documentation

This documentation provides a comprehensive overview of the P2P Bulletin Board standalone application, a decentralized peer-to-peer bulletin board system.

## Table of Contents

- [Project Overview](overview.md)
- [Features](features.md)
- [Peer-to-Peer Communication](p2p.md)
- [Getting Started](getting-started.md)

## Quick Start

To run the standalone application:

1. Simply open the `public/index.html` file in your browser
2. Alternatively, serve it via any web server:

```bash
# Using Python's simple HTTP server
python -m http.server

# Or using any static file server
npx serve
```

## Important Note

This application uses PeerJS for peer-to-peer communication. For the best experience, always run the application through a web server rather than directly from the file system.
