
import React, { useState } from "react";
import { Deal, DealStatus } from "@/lib/types";
import { useDealStore } from "@/stores/dealStore";
import { useUserStore } from "@/stores/userStore";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  formatDate, 
  formatRelativeTime, 
  getStatusColor, 
  getOpenedStatusColor 
} from "@/lib/utils";
import { MessageCircle, BookOpen, Link } from "lucide-react";
import DealDialog from "./DealDialog";

interface DealsListProps {
  userId?: string; // Optional, to filter deals for a specific user
  listingId?: string; // Optional, to filter deals for a specific listing
  limit?: number; // Optional, to limit the number of deals shown
}

const DealsList = ({ userId, listingId, limit }: DealsListProps) => {
  const { deals, getDealsByUserId, getDealsByListingId } = useDealStore();
  const { currentUser, getUserById } = useUserStore();
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  
  // Get filtered deals based on props
  const getFilteredDeals = () => {
    let filteredDeals: Deal[] = [];
    
    if (userId) {
      filteredDeals = getDealsByUserId(userId);
    } else if (listingId) {
      filteredDeals = getDealsByListingId(listingId);
    } else if (currentUser) {
      filteredDeals = getDealsByUserId(currentUser.id);
    } else {
      filteredDeals = deals;
    }
    
    // Sort by most recent first
    filteredDeals.sort((a, b) => b.updatedAt - a.updatedAt);
    
    // Apply limit if specified
    if (limit && limit > 0) {
      filteredDeals = filteredDeals.slice(0, limit);
    }
    
    return filteredDeals;
  };
  
  const filteredDeals = getFilteredDeals();
  
  // Check if the current user has opened a specific deal
  const hasOpenedDeal = (deal: Deal) => {
    if (!currentUser || !deal.openedBy) return false;
    return deal.openedBy.includes(currentUser.id);
  };
  
  // Handle clicking on a deal
  const handleDealClick = (dealId: string) => {
    setSelectedDealId(dealId);
  };
  
  // Handle closing the deal dialog
  const handleDialogClose = () => {
    setSelectedDealId(null);
  };
  
  // Find the selected deal if any
  const selectedDeal = selectedDealId 
    ? deals.find(deal => deal.id === selectedDealId) 
    : null;
  
  if (filteredDeals.length === 0) {
    return <p className="text-center text-gray-500 py-4">No deals found</p>;
  }
  
  return (
    <div className="space-y-3">
      {filteredDeals.map((deal) => {
        const isOpened = Boolean(deal.opened);
        const openedByCurrentUser = hasOpenedDeal(deal);
        
        // Get user information for display
        const author = getUserById(deal.initiatorId);
        const authorPeerId = author?.peerId || "Unknown";
        
        return (
          <Card 
            key={deal.id} 
            className="hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => handleDealClick(deal.id)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="font-medium">
                    Deal #{deal.id.substring(0, 8)}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Created {formatRelativeTime(deal.createdAt)}
                  </p>
                </div>
                
                <div className="flex gap-2 items-center">
                  <Badge className={getOpenedStatusColor(isOpened, openedByCurrentUser)}>
                    {isOpened ? (
                      <><BookOpen className="h-3 w-3 mr-1" /> Opened</>
                    ) : (
                      "Unopened"
                    )}
                  </Badge>
                  <Badge className={getStatusColor(deal.status)}>
                    {deal.status}
                  </Badge>
                </div>
              </div>
              
              {deal.terms && (
                <p className="mt-2 text-sm line-clamp-2 text-gray-700">
                  {deal.terms}
                </p>
              )}
              
              <div className="mt-3 flex justify-between items-center">
                <div className="flex items-center text-xs text-gray-500">
                  <Link className="h-3 w-3 mr-1" />
                  Peer: {authorPeerId.substring(0, 10)}...
                </div>
                
                <div className="flex items-center">
                  <span className="text-xs text-gray-500 mr-3">
                    {formatDate(deal.createdAt, true)}
                  </span>
                  
                  {deal.messages && deal.messages.length > 0 && (
                    <div className="flex items-center text-xs text-gray-500">
                      <MessageCircle className="h-3 w-3 mr-1" />
                      {deal.messages.length} message{deal.messages.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      
      {selectedDeal && (
        <DealDialog
          deal={selectedDeal}
          open={!!selectedDealId}
          onOpenChange={handleDialogClose}
        />
      )}
    </div>
  );
};

export default DealsList;
