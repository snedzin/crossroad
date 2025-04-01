
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ListingCategory, ListingStatus, DealStatus, Listing, ListingFilter } from "./types";

// Merge class names
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generate a unique ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Format a timestamp to a readable date
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

// Format a timestamp to a relative time (e.g. "3 days ago")
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
}

// Get color for listing category
export function getCategoryColor(category: ListingCategory): string {
  switch (category) {
    case ListingCategory.GOODS:
      return "bg-blue-500";
    case ListingCategory.SERVICES:
      return "bg-green-500";
    case ListingCategory.HOUSING:
      return "bg-purple-500";
    case ListingCategory.JOBS:
      return "bg-yellow-500";
    case ListingCategory.COMMUNITY:
      return "bg-pink-500";
    case ListingCategory.OTHER:
      return "bg-gray-500";
    default:
      return "bg-gray-500";
  }
}

// Get readable name for listing category
export function getCategoryName(category: ListingCategory): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

// Get color for listing status
export function getStatusColor(status: ListingStatus): string {
  switch (status) {
    case ListingStatus.ACTIVE:
      return "bg-board-success text-white";
    case ListingStatus.PENDING:
      return "bg-board-warning text-black";
    case ListingStatus.COMPLETED:
      return "bg-gray-500 text-white";
    case ListingStatus.EXPIRED:
      return "bg-gray-400 text-black";
    case ListingStatus.CANCELLED:
      return "bg-board-danger text-white";
    default:
      return "bg-gray-500 text-white";
  }
}

// Get color for deal status
export function getDealStatusColor(status: DealStatus): string {
  switch (status) {
    case DealStatus.PROPOSED:
      return "bg-blue-500 text-white";
    case DealStatus.ACCEPTED:
      return "bg-yellow-500 text-black";
    case DealStatus.COMPLETED:
      return "bg-green-500 text-white";
    case DealStatus.CANCELLED:
      return "bg-red-500 text-white";
    case DealStatus.DISPUTED:
      return "bg-purple-500 text-white";
    default:
      return "bg-gray-500 text-white";
  }
}

// Filter listings based on search criteria
export function filterListings(listings: Listing[], filter: ListingFilter): Listing[] {
  return listings.filter((listing) => {
    // Filter by search term
    if (filter.search && !listing.title.toLowerCase().includes(filter.search.toLowerCase()) && 
        !listing.description.toLowerCase().includes(filter.search.toLowerCase())) {
      return false;
    }
    
    // Filter by category
    if (filter.category && listing.category !== filter.category) {
      return false;
    }
    
    // Filter by price
    if (filter.priceMin && parseFloat(listing.price || "0") < filter.priceMin) {
      return false;
    }
    
    if (filter.priceMax && parseFloat(listing.price || "0") > filter.priceMax) {
      return false;
    }
    
    // Filter by status
    if (filter.status && listing.status !== filter.status) {
      return false;
    }
    
    // Filter by creator
    if (filter.createdBy && listing.createdBy !== filter.createdBy) {
      return false;
    }
    
    return true;
  }).sort((a, b) => {
    if (!filter.sortBy || filter.sortBy === 'newest') {
      return b.createdAt - a.createdAt;
    } else if (filter.sortBy === 'oldest') {
      return a.createdAt - b.createdAt;
    } else if (filter.sortBy === 'price_low') {
      return parseFloat(a.price || "0") - parseFloat(b.price || "0");
    } else if (filter.sortBy === 'price_high') {
      return parseFloat(b.price || "0") - parseFloat(a.price || "0");
    }
    return 0;
  });
}

// Convert a file to base64 for storage
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

// Truncate text to a specific length
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Basic data validation
export function validateListing(listing: Partial<Listing>): string | null {
  if (!listing.title || listing.title.trim().length < 3) {
    return "Title must be at least 3 characters long";
  }
  
  if (!listing.description || listing.description.trim().length < 10) {
    return "Description must be at least 10 characters long";
  }
  
  if (!listing.category) {
    return "Category is required";
  }
  
  return null;
}

// Generate initials from a name
export function getInitials(name: string): string {
  if (!name) return "?";
  
  const names = name.trim().split(' ');
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  } else {
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  }
}
