
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { usePeerStore } from "@/stores/peerStore";
import { Link } from "lucide-react";

const PeerConnectButton = () => {
  const [open, setOpen] = useState(false);
  const [peerId, setPeerId] = useState("");
  const [connecting, setConnecting] = useState(false);
  const { toast } = useToast();
  const { connectToPeer, myPeerId, connectedPeers } = usePeerStore();
  
  const handleConnect = async () => {
    if (!peerId.trim()) return;
    
    setConnecting(true);
    try {
      const success = await connectToPeer(peerId);
      
      if (success) {
        toast({
          title: "Connected successfully",
          description: "You are now connected to the peer",
        });
        setOpen(false);
        setPeerId("");
      } else {
        toast({
          title: "Connection failed",
          description: "Could not connect to the peer. Please check the ID and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to connect:", error);
      toast({
        title: "Connection error",
        description: "An error occurred while connecting to the peer",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };
  
  // Convert Map to array for rendering
  const connectedPeersArray = Array.from(connectedPeers.keys());
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center">
          <Link className="h-4 w-4 mr-2" /> Connect to Peer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect to Peer</DialogTitle>
          <DialogDescription>
            Connect to other peers to share deals and synchronize data
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {myPeerId && (
            <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
              <h3 className="text-sm font-semibold mb-1">Your Peer ID</h3>
              <p className="text-xs font-mono break-all select-all">{myPeerId}</p>
              <p className="text-xs text-gray-500 mt-1">Share this ID with others to let them connect to you</p>
            </div>
          )}
          
          {connectedPeersArray.length > 0 && (
            <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
              <h3 className="text-sm font-semibold mb-1">Connected Peers ({connectedPeersArray.length})</h3>
              <div className="max-h-24 overflow-y-auto">
                {connectedPeersArray.map((peerId, index) => (
                  <div key={index} className="text-xs font-mono break-all mb-1 flex items-center justify-between">
                    <span>{peerId.substring(0, 16)}...</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="peerId" className="text-right text-sm">
              Peer ID
            </label>
            <Input
              id="peerId"
              value={peerId}
              onChange={(e) => setPeerId(e.target.value)}
              placeholder="Enter peer ID to connect"
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            onClick={handleConnect} 
            disabled={!peerId.trim() || connecting} 
            className="bg-board-primary hover:bg-indigo-600"
          >
            {connecting ? "Connecting..." : "Connect"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PeerConnectButton;
