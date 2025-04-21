
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
      // Use type assertion to handle generic type
      handlers.push(handler as (message: P2PMessage, connection: DataConnection) => void);
    }
  }
