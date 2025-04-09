
# P2P Bulletin Board Documentation

This documentation provides a comprehensive overview of the P2P Bulletin Board application, including its structure, features, and implementation details.

## Table of Contents

- [Project Overview](overview.md)
- [Project Structure](structure.md)
- [Features](features.md)
- [Peer-to-Peer Communication](p2p.md)
- [Data Models](models.md)
- [User Interface](ui.md)
- [Getting Started](getting-started.md)

## Quick Start

To run the application locally:

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

## Important Note

This project uses IndexedDB for local storage and PeerJS for peer-to-peer communication. When running directly from a file system, you may encounter errors related to IndexedDB access. Always serve the application through a web server.
