
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useDealStore } from "@/stores/dealStore";
import { Listing } from "@/lib/types";

interface DealDialogProps {
  listing: Listing;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DealDialog = ({ listing, open, onOpenChange }: DealDialogProps) => {
  const [message, setMessage] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const { createDeal } = useDealStore();
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message to the listing creator.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await createDeal(listing.id, listing.createdBy, message);
      
      toast({
        title: "Deal Proposed",
        description: "Your message has been sent to the listing creator.",
      });
      
      setMessage("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating deal:", error);
      toast({
        title: "Error",
        description: "Failed to propose deal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-board-card text-gray-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Contact About Listing</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-sm text-gray-600">
            <p>You're contacting the owner about:</p>
            <p className="font-semibold mt-1">{listing.title}</p>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="message" className="block text-sm font-medium">
              Your Message
            </label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi, I'm interested in your listing..."
              className="min-h-[100px]"
              required
            />
          </div>
          
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="bg-board-primary hover:bg-indigo-600"
            >
              {isSubmitting ? "Sending..." : "Send Message"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DealDialog;
