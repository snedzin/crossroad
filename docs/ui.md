
# User Interface

## UI Components

The application uses a combination of custom components and components from the Shadcn UI library.

### Layout Components

- **Header**: Top navigation bar with search, user profile, and create button
- **Sidebar**: Left navigation panel with peer connection controls
- **ListingBoard**: Main content area displaying listings

### Dialog Components

- **CreateListingDialog**: Form for creating new listings
- **ListingDialog**: Detailed view of a specific listing
- **UserProfileDialog**: Edit user profile information
- **DealDialog**: Manage deals and communications

### UI Design System

The application uses Tailwind CSS with a custom theme:

```
colors: {
  "board-bg": "#1a1b23",
  "board-primary": "#6366f1",
  "board-secondary": "#8b5cf6",
  "board-accent": "#ec4899",
}
```

## Responsive Design

The application is fully responsive with specific layouts for:

- **Mobile**: Single column layout with collapsible sidebar
- **Tablet**: Two column layout with compact sidebar
- **Desktop**: Full layout with expanded sidebar

## Component Hierarchy

```
App
├── Header
│   ├── Search
│   ├── PeerStatus
│   ├── CreateButton
│   └── UserProfile
├── Sidebar
│   ├── PeerConnector
│   ├── CategoryFilter
│   └── StatusFilter
├── ListingBoard
│   ├── ListingCard
│   └── FilterControls
├── Dialogs
│   ├── CreateListingDialog
│   ├── ListingDialog
│   ├── UserProfileDialog
│   └── DealDialog
└── Toaster (notifications)
```

## State Management in UI

The UI components connect to Zustand stores to manage state:

- User profile from `userStore`
- Listings from `listingStore`
- Peer connections from `peerStore`
- Deals from `dealStore`

## Toast Notifications

The application uses toast notifications to inform users about:

- Successful actions (listing created, deal proposed)
- Errors (connection failures, database errors)
- System events (peer connected, new listing received)

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | Create new listing |
| `Esc` | Close dialog |
| `Ctrl+F` | Focus search |
