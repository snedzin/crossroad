
# Data Models

## Core Models

### User

```typescript
interface User {
  id: string;
  peerId: string;
  name: string;
  avatar?: string;
  publicKey?: string; // For future encryption support
  createdAt: number;
  lastSeen: number;
  reputation?: number;
  bio?: string;
}
```

### Listing

```typescript
interface Listing {
  id: string;
  title: string;
  description: string;
  category: ListingCategory;
  price?: string;
  location?: string;
  images?: string[]; // Base64 encoded images
  tags?: string[];
  createdBy: string; // User ID
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
  status: ListingStatus;
  expiresAt?: number; // Unix timestamp
}
```

### Deal

```typescript
interface Deal {
  id: string;
  listingId: string;
  initiatorId: string; // User ID who initiated the deal
  recipientId: string; // User ID who owns the listing
  status: DealStatus;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  terms?: string;
  messages?: Message[];
}
```

### Message

```typescript
interface Message {
  id: string;
  dealId: string;
  fromPeerId: string;
  toPeerId: string;
  content: string;
  timestamp: number;
  read: boolean;
}
```

## Enums

### Listing Categories

```typescript
enum ListingCategory {
  GOODS = "goods",
  SERVICES = "services",
  HOUSING = "housing",
  JOBS = "jobs",
  COMMUNITY = "community",
  OTHER = "other",
}
```

### Listing Status

```typescript
enum ListingStatus {
  ACTIVE = "active",
  PENDING = "pending",
  COMPLETED = "completed",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
}
```

### Deal Status

```typescript
enum DealStatus {
  PROPOSED = "proposed",
  ACCEPTED = "accepted",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  DISPUTED = "disputed",
}
```

### Peer Connection Status

```typescript
enum PeerConnectionStatus {
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  ERROR = "error",
}
```

## P2P Message Models

All P2P messages extend a base message type:

```typescript
interface P2PMessage {
  type: MessageType;
  senderId: string;
  timestamp: number;
  messageId: string;
}
```

Specific message types include:
- `HelloMessage`
- `ListingBroadcastMessage`
- `ListingRequestMessage`
- `DealProposalMessage`
- `DealResponseMessage`
- `ChatMessage`
- `UserInfoMessage`
- `PeerListMessage`

## Database Schema

The IndexedDB database includes the following object stores:

- `users`: Stores user profiles
- `listings`: Stores listing data
- `deals`: Stores deal information
- `messages`: Stores chat messages
