
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { useUserStore } from "@/stores/userStore";
import { usePeerStore } from "@/stores/peerStore";
import { getInitials } from "@/lib/utils";

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserProfileDialog = ({ open, onOpenChange }: UserProfileDialogProps) => {
  const { currentUser, updateUserProfile } = useUserStore();
  const { myPeerId, initializePeer, isInitializing } = usePeerStore();
  const { toast } = useToast();
  
  const [name, setName] = React.useState(currentUser?.name || "");
  const [bio, setBio] = React.useState(currentUser?.bio || "");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  // Update form when currentUser changes
  React.useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
      setBio(currentUser.bio || "");
    }
  }, [currentUser]);
  
  const handleInitializePeer = async () => {
    try {
      await initializePeer();
      
      toast({
        title: "Peer Initialized",
        description: "You are now connected to the P2P network.",
      });
    } catch (error) {
      console.error("Failed to initialize peer:", error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to the P2P network. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a display name.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await updateUserProfile({ name, bio });
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
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
          <DialogTitle className="text-xl font-bold">Your Profile</DialogTitle>
        </DialogHeader>
        
        <div className="flex items-center space-x-4 mb-4">
          <Avatar className="h-16 w-16 text-xl bg-board-secondary">
            <span>{getInitials(name || "Anonymous")}</span>
          </Avatar>
          
          <div>
            <h3 className="font-semibold text-lg">{name || "Anonymous User"}</h3>
            <p className="text-sm text-gray-500">ID: {currentUser?.id || "Not set"}</p>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Peer Connection</h3>
            {!myPeerId && (
              <Button
                onClick={handleInitializePeer}
                disabled={isInitializing}
                size="sm"
                className="bg-board-primary hover:bg-indigo-600 text-xs"
              >
                {isInitializing ? "Connecting..." : "Connect"}
              </Button>
            )}
          </div>
          
          {myPeerId ? (
            <div className="mt-1">
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                <p className="text-sm text-gray-600">Connected</p>
              </div>
              <code className="block mt-1 text-xs bg-gray-100 p-1 rounded overflow-hidden overflow-ellipsis">
                {myPeerId}
              </code>
            </div>
          ) : (
            <p className="text-sm text-gray-500 mt-1">
              {isInitializing ? "Connecting to P2P network..." : "Not connected to P2P network"}
            </p>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bio">Bio (optional)</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others about yourself..."
              className="min-h-[80px]"
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
              {isSubmitting ? "Saving..." : "Save Profile"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileDialog;
