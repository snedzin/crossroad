
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useDealStore } from "@/stores/dealStore";
import { useUserStore } from "@/stores/userStore";
import { usePeerStore } from "@/stores/peerStore";
import { formatDate, getStatusColor } from "@/lib/utils";
import { Deal, DealStatus, Listing } from "@/lib/types";
import { MessageCircle, Check, X, BookOpen, Link, Share } from "lucide-react";
import DealCommentsSection from "./DealCommentsSection";
import ChatDialog from "./ChatDialog";

interface DealDialogProps {
  listing?: Listing;
  deal?: Deal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DealDialog = ({ listing, deal, open, onOpenChange }: DealDialogProps) => {
  const { toast } = useToast();
  const { createDeal, updateDealStatus, markDealAsOpened } = useDealStore();
  const { currentUser, getUserById } = useUserStore();
  const { connectToPeer } = usePeerStore();
  
  const [loading, setLoading] = useState(false);
  const [terms, setTerms] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);
  
  // If we have a deal, use it; otherwise create a new one
  const existingDeal = deal;
  const isNewDeal = !existingDeal;
  
  // Mark deal as opened when dialog opens
  useEffect(() => {
    if (open && existingDeal && currentUser) {
      const openedBy = existingDeal.openedBy || [];
      if (!openedBy.includes(currentUser.id)) {
        markDealAsOpened(existingDeal.id).catch(err => 
          console.error("Failed to mark deal as opened:", err)
        );
      }
    }
  }, [open, existingDeal, currentUser, markDealAsOpened]);
  
  // Get the other party in the deal
  const otherPartyId = existingDeal 
    ? (currentUser?.id === existingDeal.initiatorId 
        ? existingDeal.recipientId 
        : existingDeal.initiatorId) 
    : (listing?.createdBy || "");
  
  const otherParty = getUserById(otherPartyId);
  
  // Determine if the current user can update the deal status
  const canAccept = existingDeal?.status === DealStatus.PROPOSED && 
    existingDeal.recipientId === currentUser?.id;
  
  const canCancel = existingDeal?.status !== DealStatus.CANCELLED && 
    existingDeal?.status !== DealStatus.COMPLETED;
  
  const canComplete = (existingDeal?.status === DealStatus.ACCEPTED) && 
    (existingDeal.initiatorId === currentUser?.id || existingDeal.recipientId === currentUser?.id);
  
  const handleCreateDeal = async () => {
    if (!listing || !currentUser || !terms.trim()) return;
    
    setLoading(true);
    try {
      const newDeal = await createDeal(listing.id, listing.createdBy, terms);
      toast({
        title: "Deal proposed",
        description: "Your proposal has been sent to the seller",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create deal:", error);
      toast({
        title: "Failed to create deal",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateStatus = async (status: DealStatus) => {
    if (!existingDeal || !currentUser) return;
    
    setLoading(true);
    try {
      await updateDealStatus(existingDeal.id, status);
      
      const statusMessages = {
        [DealStatus.ACCEPTED]: "Deal accepted",
        [DealStatus.COMPLETED]: "Deal marked as completed",
        [DealStatus.CANCELLED]: "Deal cancelled",
        [DealStatus.DISPUTED]: "Deal marked as disputed",
      };
      
      toast({
        title: statusMessages[status] || "Deal updated",
        description: "The deal status has been updated",
      });
    } catch (error) {
      console.error("Failed to update deal:", error);
      toast({
        title: "Failed to update deal",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleConnectToPeer = async () => {
    if (!otherParty?.peerId) return;
    
    setConnecting(true);
    try {
      const connected = await connectToPeer(otherParty.peerId);
      
      if (connected) {
        toast({
          title: "Connected to peer",
          description: `Successfully connected to ${otherParty.name || 'peer'}'s instance`,
        });
      } else {
        toast({
          title: "Connection failed",
          description: "Could not connect to peer. They might be offline.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to connect to peer:", error);
      toast({
        title: "Connection error",
        description: "An error occurred while connecting to peer",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };
  
  const renderDealActions = () => {
    return (
      <div className="flex flex-wrap gap-2 mt-4">
        {canAccept && (
          <>
            <Button 
              onClick={() => handleUpdateStatus(DealStatus.ACCEPTED)}
              className="bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              <Check className="h-4 w-4 mr-2" /> Accept Deal
            </Button>
            <Button 
              onClick={() => handleUpdateStatus(DealStatus.CANCELLED)}
              variant="destructive"
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" /> Decline
            </Button>
          </>
        )}
        
        {canComplete && (
          <Button 
            onClick={() => handleUpdateStatus(DealStatus.COMPLETED)}
            className="bg-board-primary hover:bg-indigo-600"
            disabled={loading}
          >
            Mark as Completed
          </Button>
        )}
        
        {canCancel && existingDeal?.status !== DealStatus.PROPOSED && (
          <Button 
            onClick={() => handleUpdateStatus(DealStatus.CANCELLED)}
            variant="destructive"
            disabled={loading}
          >
            Cancel Deal
          </Button>
        )}
        
        {otherParty && otherParty.peerId && (
          <Button 
            onClick={handleConnectToPeer}
            variant="outline"
            disabled={connecting}
            className="ml-auto"
          >
            <Link className="h-4 w-4 mr-2" /> Connect
          </Button>
        )}
        
        {existingDeal && otherParty && (
          <Button 
            onClick={() => setChatOpen(true)} 
            variant="outline"
          >
            <MessageCircle className="h-4 w-4 mr-2" /> Chat
          </Button>
        )}
      </div>
    );
  };
  
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-board-card text-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {isNewDeal ? "Propose a Deal" : "Deal Details"}
              {existingDeal?.opened && (
                <Badge className="ml-2 bg-board-primary">
                  <BookOpen className="h-3 w-3 mr-1" /> Opened
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {listing && (
            <div className="mb-4">
              <h3 className="font-semibold">Listing: {listing.title}</h3>
              {listing.price && (
                <p className="text-board-primary font-medium">{listing.price}</p>
              )}
            </div>
          )}
          
          {existingDeal && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Badge className={getStatusColor(existingDeal.status)}>
                  {existingDeal.status}
                </Badge>
                <span className="text-sm text-gray-500">
                  Created on {formatDate(existingDeal.createdAt)}
                </span>
              </div>
              
              {otherParty && (
                <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                  <h3 className="text-sm font-medium mb-1">Deal Partner</h3>
                  <div className="flex items-center justify-between">
                    <span>{otherParty.name || "Unknown User"}</span>
                    {otherParty.peerId && (
                      <div className="flex items-center text-xs bg-gray-100 px-2 py-1 rounded">
                        <Link className="h-3 w-3 mr-1" />
                        <span className="font-mono">PeerID: {otherParty.peerId}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <Separator />
              
              <div>
                <h3 className="font-semibold mb-2">Terms</h3>
                <p className="whitespace-pre-wrap bg-gray-50 p-3 rounded-md border border-gray-200">
                  {existingDeal.terms || "No specific terms"}
                </p>
              </div>
              
              {renderDealActions()}
              
              {/* Add comments section for existing deals */}
              {existingDeal && (
                <DealCommentsSection 
                  dealId={existingDeal.id} 
                  recipientId={otherPartyId} 
                />
              )}
            </div>
          )}
          
          {isNewDeal && (
            <div className="space-y-4">
              <div>
                <label htmlFor="terms" className="block font-medium mb-1">
                  Proposed Terms
                </label>
                <textarea 
                  id="terms"
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md h-32"
                  placeholder="Describe your offer, conditions, or any specific details..."
                />
              </div>
              
              <div className="flex justify-end">
                <Button
                  onClick={handleCreateDeal}
                  className="bg-board-primary hover:bg-indigo-600"
                  disabled={!terms.trim() || loading}
                >
                  Send Proposal
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {existingDeal && otherParty && (
        <ChatDialog 
          dealId={existingDeal.id}
          recipientId={otherPartyId}
          open={chatOpen}
          onOpenChange={setChatOpen}
        />
      )}
    </>
  );
};

export default DealDialog;
