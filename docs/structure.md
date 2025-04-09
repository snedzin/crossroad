
# Project Structure

## Directory Structure

```
src/
├── components/         # UI components
│   ├── ui/             # Shadcn UI components
│   └── ...             # Application-specific components
├── hooks/              # React hooks
├── lib/                # Utility functions, types, and services
├── pages/              # Page components
└── stores/             # State management (Zustand)
```

## Key Files

### Core Application Files

- `src/App.tsx`: Main application component with routing setup
- `src/main.tsx`: Application entry point
- `src/pages/Index.tsx`: Main page component

### Component Organization

- `src/components/Header.tsx`: Navigation header with search and user profile
- `src/components/Sidebar.tsx`: Application sidebar with peer connection UI
- `src/components/ListingBoard.tsx`: Main board displaying all listings
- `src/components/CreateListingDialog.tsx`: Dialog for creating new listings
- `src/components/ListingDialog.tsx`: Dialog for viewing listing details
- `src/components/UserProfileDialog.tsx`: Dialog for editing user profile
- `src/components/DealDialog.tsx`: Dialog for interacting with deals

### State Management

- `src/stores/userStore.ts`: User profile management
- `src/stores/listingStore.ts`: Listing data management
- `src/stores/dealStore.ts`: Deal and transaction management
- `src/stores/peerStore.ts`: Peer connection management

### Data and Services

- `src/lib/db.ts`: IndexedDB database handling
- `src/lib/peerService.ts`: PeerJS service for P2P communication
- `src/lib/types.ts`: TypeScript type definitions
- `src/lib/utils.ts`: Utility functions

## State Management Pattern

The application uses Zustand for state management with separate stores for different domains:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  userStore  │     │ listingStore │     │   dealStore │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────┬───────┴───────────┬──────┘
                   │                   │
            ┌──────▼──────┐     ┌──────▼──────┐
            │  peerStore  │     │     UI      │
            └─────────────┘     └─────────────┘
```

Each store is responsible for:
- Managing its own domain data
- Providing actions to update the data
- Persisting data to IndexedDB where appropriate
- Sharing data with peers where appropriate
