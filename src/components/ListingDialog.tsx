
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useListingStore } from "@/stores/listingStore";
import { useUserStore } from "@/stores/userStore";
import { useDealStore } from "@/stores/dealStore";
import { formatDate, getCategoryColor, getStatusColor, getInitials } from "@/lib/utils";
import { MessageCircle, ExternalLink, Heart, Flag, Share } from "lucide-react";
import DealDialog from "./DealDialog";

interface ListingDialogProps {
  listingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ListingDialog = ({ listingId, open, onOpenChange }: ListingDialogProps) => {
  const { getListingById } = useListingStore();
  const { getUserById, currentUser } = useUserStore();
  const { createDeal } = useDealStore();
  
  const [dealDialogOpen, setDealDialogOpen] = React.useState(false);
  
  const listing = getListingById(listingId);
  const creator = listing ? getUserById(listing.createdBy) : undefined;
  
  const isOwnListing = listing?.createdBy === currentUser?.id;
  
  const handleContactSeller = () => {
    if (!listing) return;
    setDealDialogOpen(true);
  };
  
  if (!listing) {
    return null;
  }
  
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-board-card text-gray-800 max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{listing.title}</DialogTitle>
          </DialogHeader>
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-2">
              <Badge className={getCategoryColor(listing.category)}>
                {listing.category}
              </Badge>
              <Badge className={getStatusColor(listing.status)}>
                {listing.status}
              </Badge>
            </div>
            
            {listing.price && (
              <div className="text-xl font-bold text-board-primary">{listing.price}</div>
            )}
          </div>
          
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-4">
              {listing.images && listing.images.length > 0 ? (
                <div className="aspect-video bg-gray-100 rounded-md overflow-hidden">
                  <img 
                    src={listing.images[0]} 
                    alt={listing.title} 
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-board-primary/10 rounded-md flex items-center justify-center">
                  <span className="text-board-primary opacity-70">No image</span>
                </div>
              )}
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="whitespace-pre-wrap">{listing.description}</p>
              </div>
              
              {listing.location && (
                <div>
                  <h3 className="text-lg font-semibold mb-1">Location</h3>
                  <p>{listing.location}</p>
                </div>
              )}
              
              {listing.tags && listing.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {listing.tags.map(tag => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <span>{getInitials(creator?.name || 'Unknown')}</span>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{creator?.name || 'Unknown User'}</p>
                    <p className="text-xs text-gray-500">Posted on {formatDate(listing.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
          
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <Button variant="outline" size="icon">
                <Heart className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Share className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Flag className="h-4 w-4" />
              </Button>
            </div>
            
            {!isOwnListing && (
              <Button onClick={handleContactSeller} className="bg-board-primary hover:bg-indigo-600">
                <MessageCircle className="h-4 w-4 mr-2" /> Contact
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {dealDialogOpen && listing && (
        <DealDialog 
          listing={listing} 
          open={dealDialogOpen} 
          onOpenChange={setDealDialogOpen} 
        />
      )}
    </>
  );
};

export default ListingDialog;
