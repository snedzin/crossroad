
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
