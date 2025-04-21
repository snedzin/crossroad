
import { DataConnection } from 'peerjs';
import { MessageType, P2PMessage } from './types';

export class PeerService {
  private messageHandlers: Map<MessageType, ((message: P2PMessage, connection: DataConnection) => void)[]>;

  constructor() {
    this.messageHandlers = new Map();
  }

  // Add a message handler
  addMessageHandler<T extends P2PMessage>(
    type: MessageType,
    handler: (message: T, connection: DataConnection) => void
  ): void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.push(handler as (message: P2PMessage, connection: DataConnection) => void);
    }
  }
}

export const peerService = new PeerService();
