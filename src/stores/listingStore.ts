
import { create } from "zustand";
import { Listing, ListingFilter, ListingStatus, ListingCategory } from "@/lib/types";
import { STORES, addItem, getAllItems, getItemByKey, updateItem, deleteItem } from "@/lib/db";
import { generateId, filterListings } from "@/lib/utils";
import { peerService } from "@/lib/peerService";
import { useUserStore } from "./userStore";

interface ListingState {
  listings: Listing[];
  filteredListings: Listing[];
  currentFilter: ListingFilter;
  isLoading: boolean;
  loadAllListings: () => Promise<Listing[]>;
  createListing: (listing: Partial<Listing>) => Promise<Listing>;
  updateListing: (id: string, updates: Partial<Listing>) => Promise<Listing>;
  deleteListing: (id: string) => Promise<void>;
  getListingById: (id: string) => Listing | undefined;
  setFilter: (filter: Partial<ListingFilter>) => void;
  addExternalListing: (listing: Listing) => void;
}

export const useListingStore = create<ListingState>((set, get) => ({
  listings: [],
  filteredListings: [],
  currentFilter: {},
  isLoading: false,

  // Load all listings from IndexedDB
  loadAllListings: async () => {
    set({ isLoading: true });
    
    try {
      const listings = await getAllItems<Listing>(STORES.LISTINGS);
      
      set({
        listings,
        filteredListings: filterListings(listings, get().currentFilter),
        isLoading: false,
      });
      
      return listings;
    } catch (error) {
      console.error("Failed to load listings:", error);
      set({ isLoading: false });
      throw error;
    }
  },

  // Create a new listing
  createListing: async (listingData: Partial<Listing>) => {
    try {
      const currentUser = useUserStore.getState().currentUser;
      
      if (!currentUser) {
        throw new Error("No user profile found");
      }
      
      const now = Date.now();
      
      const listing: Listing = {
        id: generateId(),
        title: listingData.title || "Untitled Listing",
        description: listingData.description || "",
        category: listingData.category || ListingCategory.OTHER,
        price: listingData.price,
        location: listingData.location,
        images: listingData.images || [],
        tags: listingData.tags || [],
        createdBy: currentUser.id,
        createdAt: now,
        updatedAt: now,
        status: ListingStatus.ACTIVE,
        expiresAt: now + (30 * 24 * 60 * 60 * 1000), // 30 days in the future
      };
      
      await addItem(STORES.LISTINGS, listing);
      
      // Broadcast the listing to connected peers
      peerService.broadcastListing(listing);
      
      set((state) => {
        const listings = [...state.listings, listing];
        return {
          listings,
          filteredListings: filterListings(listings, state.currentFilter),
        };
      });
      
      return listing;
    } catch (error) {
      console.error("Failed to create listing:", error);
      throw error;
    }
  },

  // Update an existing listing
  updateListing: async (id: string, updates: Partial<Listing>) => {
    try {
      const listing = await getItemByKey<Listing>(STORES.LISTINGS, id);
      
      if (!listing) {
        throw new Error(`Listing not found: ${id}`);
      }
      
      const currentUser = useUserStore.getState().currentUser;
      
      if (!currentUser || listing.createdBy !== currentUser.id) {
        throw new Error("You don't have permission to update this listing");
      }
      
      const updatedListing: Listing = {
        ...listing,
        ...updates,
        updatedAt: Date.now(),
      };
      
      await updateItem(STORES.LISTINGS, updatedListing);
      
      // Broadcast the updated listing
      peerService.broadcastListing(updatedListing);
      
      set((state) => {
        const listings = state.listings.map(l => 
          l.id === id ? updatedListing : l
        );
        
        return {
          listings,
          filteredListings: filterListings(listings, state.currentFilter),
        };
      });
      
      return updatedListing;
    } catch (error) {
      console.error("Failed to update listing:", error);
      throw error;
    }
  },

  // Delete a listing
  deleteListing: async (id: string) => {
    try {
      const listing = await getItemByKey<Listing>(STORES.LISTINGS, id);
      
      if (!listing) {
        throw new Error(`Listing not found: ${id}`);
      }
      
      const currentUser = useUserStore.getState().currentUser;
      
      if (!currentUser || listing.createdBy !== currentUser.id) {
        throw new Error("You don't have permission to delete this listing");
      }
      
      await deleteItem(STORES.LISTINGS, id);
      
      // Update the local store
      set((state) => {
        const listings = state.listings.filter(l => l.id !== id);
        
        return {
          listings,
          filteredListings: filterListings(listings, state.currentFilter),
        };
      });
    } catch (error) {
      console.error("Failed to delete listing:", error);
      throw error;
    }
  },

  // Get a specific listing by ID
  getListingById: (id: string) => {
    return get().listings.find(listing => listing.id === id);
  },

  // Set filter and update filtered listings
  setFilter: (filter: Partial<ListingFilter>) => {
    set((state) => {
      const newFilter = { ...state.currentFilter, ...filter };
      
      return {
        currentFilter: newFilter,
        filteredListings: filterListings(state.listings, newFilter),
      };
    });
  },

  // Add a listing from another peer
  addExternalListing: (listing: Listing) => {
    set((state) => {
      // Check if we already have this listing
      const existingIndex = state.listings.findIndex(l => l.id === listing.id);
      
      let listings;
      if (existingIndex >= 0) {
        // Update the existing listing if it's older
        if (state.listings[existingIndex].updatedAt < listing.updatedAt) {
          listings = [
            ...state.listings.slice(0, existingIndex),
            listing,
            ...state.listings.slice(existingIndex + 1)
          ];
        } else {
          listings = state.listings;
        }
      } else {
        // Add the new listing
        listings = [...state.listings, listing];
        
        // Also add to IndexedDB in the background
        addItem(STORES.LISTINGS, listing)
          .catch(err => console.error("Failed to save external listing:", err));
      }
      
      return {
        listings,
        filteredListings: filterListings(listings, state.currentFilter),
      };
    });
  },
}));
