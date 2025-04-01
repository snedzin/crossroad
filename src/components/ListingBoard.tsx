
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useListingStore } from "@/stores/listingStore";
import { formatRelativeTime, getCategoryColor, getStatusColor } from "@/lib/utils";
import { ListingStatus, ListingCategory } from "@/lib/types";
import ListingDialog from "./ListingDialog";

const ListingBoard = () => {
  const { filteredListings, isLoading } = useListingStore();
  const [currentTab, setCurrentTab] = React.useState<string>("all");
  const [selectedListing, setSelectedListing] = React.useState<string | null>(null);
  
  const handleListingClick = (id: string) => {
    setSelectedListing(id);
  };
  
  const handleCloseDialog = () => {
    setSelectedListing(null);
  };
  
  // Filter listings based on the selected tab
  const displayListings = filteredListings.filter(listing => {
    if (currentTab === "all") return true;
    if (currentTab === "active") return listing.status === ListingStatus.ACTIVE;
    if (currentTab === "completed") return listing.status === ListingStatus.COMPLETED;
    return true;
  });
  
  return (
    <div className="space-y-6 max-w-full">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Listings</h2>
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-[400px]">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-gray-800 rounded-lg h-48"></div>
          ))}
        </div>
      ) : displayListings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-2">No listings found</p>
          <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayListings.map(listing => (
            <Card 
              key={listing.id} 
              className="bg-board-card text-gray-800 hover:shadow-md transition-all cursor-pointer overflow-hidden"
              onClick={() => handleListingClick(listing.id)}
            >
              <div className="h-32 bg-gray-200 relative overflow-hidden">
                {listing.images && listing.images.length > 0 ? (
                  <img 
                    src={listing.images[0]} 
                    alt={listing.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-board-primary/10">
                    <span className="text-board-primary opacity-70">No image</span>
                  </div>
                )}
                
                <div className="absolute top-2 right-2 flex space-x-2">
                  <Badge className={getStatusColor(listing.status)}>
                    {listing.status}
                  </Badge>
                </div>
              </div>
              
              <CardContent className="p-4">
                <Badge className={`${getCategoryColor(listing.category)} mb-2`}>
                  {listing.category}
                </Badge>
                <h3 className="font-semibold text-lg mb-1 truncate">{listing.title}</h3>
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">{listing.description}</p>
                
                <div className="flex justify-between items-center mt-2">
                  {listing.price ? (
                    <span className="font-bold text-board-primary">{listing.price}</span>
                  ) : (
                    <span className="text-gray-500">No price</span>
                  )}
                  <span className="text-xs text-gray-500">{formatRelativeTime(listing.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {selectedListing && (
        <ListingDialog 
          listingId={selectedListing} 
          open={!!selectedListing} 
          onOpenChange={handleCloseDialog} 
        />
      )}
    </div>
  );
};

export default ListingBoard;
