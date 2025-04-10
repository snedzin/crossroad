import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ListingCategory, ListingStatus, DealStatus } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

export function getInitials(name: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

export function formatDate(timestamp: number, includeTime: boolean = false) {
  const date = new Date(timestamp);
  
  if (includeTime) {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

export function formatRelativeTime(timestamp: number) {
  const now = Date.now();
  const diffMs = now - timestamp;
  
  // Convert to seconds
  const diffSec = Math.floor(diffMs / 1000);
  
  if (diffSec < 60) {
    return "just now";
  }
  
  // Convert to minutes
  const diffMin = Math.floor(diffSec / 60);
  
  if (diffMin < 60) {
    return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  }
  
  // Convert to hours
  const diffHour = Math.floor(diffMin / 60);
  
  if (diffHour < 24) {
    return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
  }
  
  // Convert to days
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffDay < 30) {
    return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
  }
  
  // Convert to months
  const diffMonth = Math.floor(diffDay / 30);
  
  if (diffMonth < 12) {
    return `${diffMonth} month${diffMonth === 1 ? '' : 's'} ago`;
  }
  
  // Convert to years
  const diffYear = Math.floor(diffMonth / 12);
  return `${diffYear} year${diffYear === 1 ? '' : 's'} ago`;
}

export function getCategoryColor(category: ListingCategory) {
  switch (category) {
    case ListingCategory.GOODS:
      return "bg-blue-500 text-white";
    case ListingCategory.SERVICES:
      return "bg-purple-500 text-white";
    case ListingCategory.HOUSING:
      return "bg-green-500 text-white";
    case ListingCategory.JOBS:
      return "bg-yellow-500 text-black";
    case ListingCategory.COMMUNITY:
      return "bg-orange-500 text-white";
    default:
      return "bg-gray-500 text-white";
  }
}

export function getStatusColor(status: ListingStatus | DealStatus) {
  switch (status) {
    case ListingStatus.ACTIVE:
    case DealStatus.ACCEPTED:
      return "bg-green-500 text-white";
    case ListingStatus.PENDING:
    case DealStatus.PROPOSED:
      return "bg-yellow-500 text-black";
    case ListingStatus.COMPLETED:
    case DealStatus.COMPLETED:
      return "bg-blue-500 text-white";
    case ListingStatus.EXPIRED:
    case DealStatus.CANCELLED:
      return "bg-red-500 text-white";
    case DealStatus.DISPUTED:
      return "bg-orange-500 text-white";
    default:
      return "bg-gray-500 text-white";
  }
}

export function getOpenedStatusColor(opened: boolean, openedByCurrentUser: boolean) {
  if (!opened) {
    return "bg-gray-200 text-gray-800";
  }
  
  if (openedByCurrentUser) {
    return "bg-board-primary text-white";
  }
  
  return "bg-purple-400 text-white";
}

export function getCategoryName(category: ListingCategory): string {
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

export function validateListing(data: any): string | null {
  if (!data.title || data.title.trim().length < 3) {
    return "Title must be at least 3 characters long";
  }
  
  if (!data.description || data.description.trim().length < 10) {
    return "Description must be at least 10 characters long";
  }
  
  if (!data.category) {
    return "Category is required";
  }
  
  return null; // No validation errors
}

export function filterListings(listings: any[], filters: any) {
  return listings.filter(listing => {
    // Filter by category if specified
    if (filters.category && listing.category !== filters.category) {
      return false;
    }
    
    // Filter by search term if specified
    if (filters.searchTerm && filters.searchTerm.trim() !== '') {
      const searchTermLower = filters.searchTerm.toLowerCase();
      const titleMatch = listing.title.toLowerCase().includes(searchTermLower);
      const descMatch = listing.description.toLowerCase().includes(searchTermLower);
      const tagsMatch = listing.tags && listing.tags.some((tag: string) => 
        tag.toLowerCase().includes(searchTermLower)
      );
      
      if (!titleMatch && !descMatch && !tagsMatch) {
        return false;
      }
    }
    
    // Filter by creator if specified
    if (filters.createdBy && listing.createdBy !== filters.createdBy) {
      return false;
    }
    
    // Filter by status if specified
    if (filters.status && listing.status !== filters.status) {
      return false;
    }
    
    return true;
  });
}
