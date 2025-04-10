
// Types for the P2P bulletin board application

// User profile
export interface User {
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

// Listing categories
export enum ListingCategory {
  GOODS = "goods",
  SERVICES = "services",
  HOUSING = "housing",
  JOBS = "jobs",
  COMMUNITY = "community",
  OTHER = "other",
}

// Listing status
export enum ListingStatus {
  ACTIVE = "active",
  PENDING = "pending",
  COMPLETED = "completed",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
}

// Listing item model
export interface Listing {
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

// Deal status
export enum DealStatus {
  PROPOSED = "proposed",
  ACCEPTED = "accepted",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  DISPUTED = "disputed",
}

// Deal model
export interface Deal {
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
  opened?: boolean; // New field to track if the deal has been opened
  openedBy?: string[]; // Array of user IDs who have opened the deal
  lastOpenedAt?: number; // Timestamp when the deal was last opened
}

// Message model for deal communications
export interface Message {
  id: string;
  dealId: string;
  fromPeerId: string;
  toPeerId: string;
  content: string;
  timestamp: number;
  read: boolean;
}

// Peer connection status
export enum PeerConnectionStatus {
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  ERROR = "error",
}

// Peer info
export interface PeerInfo {
  id: string; // PeerJS ID
  userId?: string; // Associated user ID once identified
  lastSeen: number;
  status: PeerConnectionStatus;
}

// Message types for P2P communication
export enum MessageType {
  HELLO = "hello", // Initial connection
  LISTING_BROADCAST = "listing_broadcast", // Share a new listing
  LISTING_REQUEST = "listing_request", // Request a specific listing
  DEAL_PROPOSAL = "deal_proposal", // Propose a deal
  DEAL_RESPONSE = "deal_response", // Respond to a deal proposal
  CHAT_MESSAGE = "chat_message", // Send a chat message
  USER_INFO = "user_info", // Share user info
  PEER_LIST = "peer_list", // Share list of known peers
}

// Base P2P message
export interface P2PMessage {
  type: MessageType;
  senderId: string;
  timestamp: number;
  messageId: string;
}

// Hello message to establish connection
export interface HelloMessage extends P2PMessage {
  type: MessageType.HELLO;
  userData: User;
}

// Listing broadcast message
export interface ListingBroadcastMessage extends P2PMessage {
  type: MessageType.LISTING_BROADCAST;
  listing: Listing;
}

// Listing request message
export interface ListingRequestMessage extends P2PMessage {
  type: MessageType.LISTING_REQUEST;
  listingId: string;
}

// Deal proposal message
export interface DealProposalMessage extends P2PMessage {
  type: MessageType.DEAL_PROPOSAL;
  deal: Deal;
}

// Deal response message
export interface DealResponseMessage extends P2PMessage {
  type: MessageType.DEAL_RESPONSE;
  dealId: string;
  accepted: boolean;
  message?: string;
}

// Chat message for deals
export interface ChatMessage extends P2PMessage {
  type: MessageType.CHAT_MESSAGE;
  dealId: string;
  message: Message;
}

// User info message
export interface UserInfoMessage extends P2PMessage {
  type: MessageType.USER_INFO;
  user: User;
}

// Peer list message
export interface PeerListMessage extends P2PMessage {
  type: MessageType.PEER_LIST;
  peers: string[]; // List of peer IDs
}

// Filter criteria for listings
export interface ListingFilter {
  search?: string;
  category?: ListingCategory;
  priceMin?: number;
  priceMax?: number;
  status?: ListingStatus;
  createdBy?: string;
  sortBy?: 'newest' | 'oldest' | 'price_low' | 'price_high';
}
