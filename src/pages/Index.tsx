
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
  const [initError, setInitError] = useState<string | null>(null);
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
        setInitError("Failed to initialize the application. If you're opening this file directly from your computer, please try using a web server instead.");
        toast({
          title: "Database Error",
          description: "Failed to initialize the database. Some features may not work.",
          variant: "destructive",
        });
      }
    };
    
    initialize();
  }, [loadAllListings, loadUserProfile, toast]);

  // Display helpful message if there's an initialization error
  if (initError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-board-bg text-white p-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">Application Error</h1>
          <p>{initError}</p>
          <div className="bg-gray-800 p-4 rounded-lg text-left text-sm">
            <p className="font-semibold mb-2">To run this application:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Use a local development server: <code className="bg-gray-900 px-1 rounded">npm run dev</code> (requires Node.js)</li>
              <li>Use Python's built-in server: <code className="bg-gray-900 px-1 rounded">python -m http.server</code></li>
              <li>Or use any other web server</li>
            </ol>
          </div>
          <p className="text-sm text-gray-400">
            Web applications like this one need to be served via HTTP to function properly.
          </p>
        </div>
      </div>
    );
  }

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
