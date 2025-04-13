
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { useUserStore } from "@/stores/userStore";
import { usePeerStore } from "@/stores/peerStore";
import { getInitials } from "@/lib/utils";

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const USER_AVATARS = [
  '/placeholder.svg',
  'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=150&h=150&fit=crop',
  'https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?w=150&h=150&fit=crop',
  'https://images.unsplash.com/photo-1482562124811-c09040d0a901?w=150&h=150&fit=crop',
];

const UserProfileDialog = ({ open, onOpenChange }: UserProfileDialogProps) => {
  const { currentUser, updateUserProfile } = useUserStore();
  const { myPeerId, initializePeer, isInitializing, resetPeerConnection } = usePeerStore();
  const { toast } = useToast();
  
  const [name, setName] = useState(currentUser?.name || "");
  const [bio, setBio] = useState(currentUser?.bio || "");
  const [avatar, setAvatar] = useState(currentUser?.avatar || USER_AVATARS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  
  // Update form when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
      setBio(currentUser.bio || "");
      setAvatar(currentUser.avatar || USER_AVATARS[0]);
    }
  }, [currentUser]);
  
  const generatePeerIdFromUsername = (username: string) => {
    // Remove special characters and spaces
    const sanitized = username.replace(/[^\w]/g, '').toLowerCase();
    // Add a random suffix to avoid collisions
    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `peer-${sanitized}-${randomSuffix}`;
  };
  
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
  
  const handleResetPeerConnection = async () => {
    if (!showConfirmReset) {
      setShowConfirmReset(true);
      return;
    }
    
    try {
      // First update user profile to generate new peerId
      const updatedUser = await updateUserProfile({ 
        name, 
        bio, 
        avatar,
        peerId: generatePeerIdFromUsername(name)
      });
      
      // Then reset the peer connection
      await resetPeerConnection(updatedUser.peerId);
      
      toast({
        title: "Peer Connection Reset",
        description: "Your peer connection has been reset with a new ID based on your username.",
      });
      
      setShowConfirmReset(false);
    } catch (error) {
      console.error("Failed to reset peer connection:", error);
      toast({
        title: "Reset Error",
        description: "Failed to reset peer connection. Please try again.",
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
      await updateUserProfile({ name, bio, avatar });
      
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
      <DialogContent className="bg-background text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Your Profile</DialogTitle>
        </DialogHeader>
        
        <div className="flex items-center space-x-4 mb-4">
          <Avatar className="h-16 w-16 text-xl bg-muted">
            <AvatarImage src={avatar} alt={name || "User"} />
            <AvatarFallback>{getInitials(name || "Anonymous")}</AvatarFallback>
          </Avatar>
          
          <div>
            <h3 className="font-semibold text-lg">{name || "Anonymous User"}</h3>
            <p className="text-sm text-muted-foreground">ID: {currentUser?.id || "Not set"}</p>
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
                className="bg-primary hover:bg-primary/90 text-xs"
              >
                {isInitializing ? "Connecting..." : "Connect"}
              </Button>
            )}
          </div>
          
          {myPeerId ? (
            <div className="mt-1">
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                <p className="text-sm text-muted-foreground">Connected</p>
              </div>
              <code className="block mt-1 text-xs bg-muted p-1 rounded overflow-hidden overflow-ellipsis">
                {myPeerId}
              </code>
              <Button
                onClick={handleResetPeerConnection}
                variant="outline"
                size="sm"
                className="mt-2 text-xs"
              >
                {showConfirmReset ? "Confirm Reset" : "Reset Peer ID (Based on Username)"}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-1">
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
          
          <div className="space-y-2">
            <Label>Avatar</Label>
            <div className="grid grid-cols-4 gap-2">
              {USER_AVATARS.map((src, index) => (
                <Avatar 
                  key={index}
                  className={`cursor-pointer h-14 w-14 ${avatar === src ? 'ring-2 ring-primary' : 'opacity-70 hover:opacity-100'}`}
                  onClick={() => setAvatar(src)}
                >
                  <AvatarImage src={src} alt={`Avatar option ${index + 1}`} />
                  <AvatarFallback>{index + 1}</AvatarFallback>
                </Avatar>
              ))}
            </div>
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
              className="bg-primary hover:bg-primary/90"
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
