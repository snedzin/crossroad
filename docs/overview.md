
# Project Overview

The P2P Bulletin Board is a decentralized application that allows users to post and view listings without relying on a central server. The application uses peer-to-peer (P2P) communication to share listings between users.

## Core Concepts

### Decentralized Architecture

Unlike traditional bulletin board systems that rely on a central server, this application:

- Stores data locally in the user's browser using localStorage
- Connects directly to other users via WebRTC using the PeerJS library
- Shares listings and user information directly between peers
- Functions offline for local use with synchronization when peers connect

### Key Technologies

- **HTML/CSS/JavaScript**: Core web technologies
- **PeerJS**: WebRTC abstraction layer for peer-to-peer connections
- **LocalStorage**: Browser-based storage for persistent data
- **Vanilla JS**: No frameworks, just plain JavaScript

## Application Flow

1. User opens the HTML file in a browser
2. Listings are loaded from local storage
3. (Optional) User can connect to peers to share and discover listings
4. User can create, view, and interact with listings

## Design Principles

- **Offline-First**: The application works without internet connection
- **Privacy-Focused**: No central server collects user data
- **Resilient**: Data is stored locally and shared peer-to-peer
- **Responsive**: Works on various device sizes
- **Standalone**: No build process or framework dependencies
- **Self-Contained**: Everything needed is in a single HTML file
