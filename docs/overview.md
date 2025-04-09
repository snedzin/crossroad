
# Project Overview

The P2P Bulletin Board is a decentralized application that allows users to post and view listings without relying on a central server. The application uses peer-to-peer (P2P) communication to share listings between users.

## Core Concepts

### Decentralized Architecture

Unlike traditional bulletin board systems that rely on a central server, this application:

- Stores data locally in the user's browser using IndexedDB
- Connects directly to other users via WebRTC using the PeerJS library
- Shares listings and user information directly between peers
- Functions offline for local use with synchronization when peers connect

### Key Technologies

- **React**: UI framework
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **PeerJS**: WebRTC abstraction layer for peer-to-peer connections
- **IndexedDB**: Browser-based database for local storage
- **Zustand**: Lightweight state management

## Application Flow

1. User opens the application and a local database is initialized
2. A user profile is created or loaded from local storage
3. Listings are loaded from local storage
4. (Optional) User can connect to peers to share and discover listings
5. User can create, view, and interact with listings

## Design Principles

- **Offline-First**: The application works without internet connection
- **Privacy-Focused**: No central server collects user data
- **Resilient**: Data is stored locally and shared peer-to-peer
- **Responsive**: Works on various device sizes
