
# Peer-to-Peer Communication

The P2P Bulletin Board uses the PeerJS library to establish direct peer-to-peer connections between users over WebRTC.

## Architecture

```
┌─────────────┐                           ┌─────────────┐
│             │                           │             │
│   User A    │◄─────WebRTC Connection────►   User B    │
│             │                           │             │
└──────┬──────┘                           └──────┬──────┘
       │                                         │
       │                                         │
┌──────▼──────┐                           ┌──────▼──────┐
│             │                           │             │
│ IndexedDB A │                           │ IndexedDB B │
│             │                           │             │
└─────────────┘                           └─────────────┘
```

## PeerJS Service Implementation

The P2P functionality is implemented in `src/lib/peerService.ts` and includes:

- Establishing WebRTC connections
- Managing peer connections
- Sending and receiving messages
- Handling various message types

## Message Types

The system supports multiple message types for different purposes:

| Message Type | Purpose |
|--------------|---------|
| `HELLO` | Initial connection handshake |
| `LISTING_BROADCAST` | Share a new listing |
| `LISTING_REQUEST` | Request a specific listing |
| `DEAL_PROPOSAL` | Propose a deal |
| `DEAL_RESPONSE` | Respond to a deal proposal |
| `CHAT_MESSAGE` | Send a chat message |
| `USER_INFO` | Share user information |
| `PEER_LIST` | Share known peers |

## Data Synchronization

When peers connect:

1. They exchange `HELLO` messages with user profiles
2. They share their listings via `LISTING_BROADCAST` messages
3. They share their known peers via `PEER_LIST` messages
4. Ongoing changes are broadcast to all connected peers

## Peer Store

The `peerStore.ts` manages the peer connection state:

- Tracks connected peers
- Provides connection status
- Handles peer initialization
- Manages connection and disconnection

## Connection Flow

```
┌─────────────┐  1. initializePeer()  ┌─────────────┐
│             │────────────────────►  │             │
│   User      │                       │  PeerJS     │
│             │  2. peerId            │  Server     │
│             │◄─────────────────────  │             │
└──────┬──────┘                       └─────────────┘
       │
       │  3. connectToPeer(peerId)
       ▼
┌─────────────┐  4. WebRTC Connection  ┌─────────────┐
│             │────────────────────►  │             │
│  Peer A     │                       │  Peer B     │
│             │  5. Data Exchange     │             │
│             │◄────────────────────  │             │
└─────────────┘                       └─────────────┘
```

## Security Considerations

- All connections are direct peer-to-peer
- No central server stores user data
- Future versions may implement data encryption
