
import React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, MessageCircle, Tag, UserPlus, X } from "lucide-react";
import { usePeerStore } from "@/stores/peerStore";
import { useUserStore } from "@/stores/userStore";
import { useListingStore } from "@/stores/listingStore";
import { useDealStore } from "@/stores/dealStore";
import { ListingCategory } from "@/lib/types";
import { getCategoryName } from "@/lib/utils";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const Sidebar = ({ open, onClose }: SidebarProps) => {
  const { myPeerId, connectedPeers, connectToPeer } = usePeerStore();
  const { setFilter, currentFilter } = useListingStore();
  const [newPeerId, setNewPeerId] = React.useState("");

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPeerId && newPeerId !== myPeerId) {
      connectToPeer(newPeerId);
      setNewPeerId("");
    }
  };

  const handleCategoryClick = (category: ListingCategory | undefined) => {
    setFilter({ category });
    onClose();
  };

  return (
    <>
      {/* Mobile sidebar */}
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="left" className="w-[300px] p-0 bg-board-bg text-white border-r border-gray-800">
          <div className="p-4 flex items-center justify-between border-b border-gray-800">
            <h2 className="text-lg font-semibold">Menu</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <SidebarContent onClose={onClose} />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden md:block w-[250px] border-r border-gray-800 bg-gray-900 shrink-0 overflow-auto">
        <div className="p-4">
          <h2 className="text-lg font-semibold text-white mb-4">Categories</h2>
          <SidebarContent onClose={onClose} />
        </div>
      </div>
    </>
  );
};

const SidebarContent = ({ onClose }: { onClose: () => void }) => {
  const { myPeerId, connectedPeers, connectToPeer } = usePeerStore();
  const { currentUser } = useUserStore();
  const { setFilter } = useListingStore();
  const [newPeerId, setNewPeerId] = React.useState("");

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPeerId && newPeerId !== myPeerId) {
      connectToPeer(newPeerId);
      setNewPeerId("");
    }
  };

  const handleCategoryClick = (category: ListingCategory | undefined) => {
    setFilter({ category });
    onClose();
  };

  const categoryList = Object.values(ListingCategory);

  return (
    <Tabs defaultValue="browse" className="w-full">
      <div className="px-4 pt-4">
        <TabsList className="grid grid-cols-2 w-full bg-gray-800">
          <TabsTrigger value="browse">Browse</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="browse" className="mt-0 p-4">
        <div className="space-y-1">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-white hover:text-white hover:bg-gray-800"
            onClick={() => handleCategoryClick(undefined)}
          >
            All Listings
          </Button>
          
          {categoryList.map((category) => (
            <Button 
              key={category} 
              variant="ghost" 
              className="w-full justify-start text-white hover:text-white hover:bg-gray-800"
              onClick={() => handleCategoryClick(category)}
            >
              {getCategoryName(category)}
            </Button>
          ))}
        </div>
        
        <Separator className="my-4 bg-gray-700" />
        
        <div className="space-y-1">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-white hover:text-white hover:bg-gray-800"
            onClick={() => {
              setFilter({ createdBy: currentUser?.id });
              onClose();
            }}
          >
            <User className="h-4 w-4 mr-2" />
            My Listings
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="network" className="mt-0 p-4">
        <div className="space-y-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">Your Peer ID</p>
            <div className="flex items-center">
              <code className="bg-gray-800 px-2 py-1 rounded text-sm overflow-hidden overflow-ellipsis flex-1">
                {myPeerId || "Connecting..."}
              </code>
            </div>
          </div>

          <form onSubmit={handleConnect}>
            <div className="space-y-2">
              <Label htmlFor="peerId">Connect to peer</Label>
              <div className="flex space-x-2">
                <Input
                  id="peerId"
                  placeholder="Peer ID"
                  value={newPeerId}
                  onChange={(e) => setNewPeerId(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
                <Button type="submit" variant="secondary">Connect</Button>
              </div>
            </div>
          </form>

          <div>
            <h3 className="text-sm font-medium mb-2">Connected Peers ({connectedPeers.size})</h3>
            <ScrollArea className="h-[120px]">
              {connectedPeers.size === 0 ? (
                <p className="text-sm text-gray-400">No connected peers</p>
              ) : (
                <div className="space-y-2">
                  {Array.from(connectedPeers.entries()).map(([peerId, info]) => (
                    <div key={peerId} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        <span className="text-sm truncate w-40">{peerId}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default Sidebar;
