
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import ListingBoard from "@/components/ListingBoard";
import CreateListingDialog from "@/components/CreateListingDialog";
import PeerManager from "@/components/PeerManager";
import { useToast } from "@/components/ui/use-toast";
import { usePeerStore } from "@/stores/peerStore";
import { useListingStore } from "@/stores/listingStore";
import { useUserStore } from "@/stores/userStore";
import { initializeDatabase } from "@/lib/db";

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const { loadAllListings } = useListingStore();
  const { loadUserProfile } = useUserStore();
  
  // Initialize the database and load data
  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeDatabase();
        await loadAllListings();
        await loadUserProfile();
      } catch (error) {
        console.error("Failed to initialize database:", error);
        toast({
          title: "Database Error",
          description: "Failed to initialize the database. Some features may not work.",
          variant: "destructive",
        });
      }
    };
    
    initialize();
  }, [loadAllListings, loadUserProfile, toast]);

  return (
    <div className="flex flex-col h-screen bg-board-bg text-white">
      <Header 
        onMenuClick={() => setSidebarOpen(true)} 
        onCreateClick={() => setCreateDialogOpen(true)} 
      />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <ListingBoard />
        </main>
      </div>

      <CreateListingDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
      />

      {/* Hidden component that manages P2P connections */}
      <PeerManager />
    </div>
  );
};

export default Index;
