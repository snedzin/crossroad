
import React from "react";
import { useUserStore } from "@/stores/userStore";
import RecentDealsWidget from "./RecentDealsWidget";
import PeerConnectButton from "./PeerConnectButton";

const DashboardWidgets = () => {
  const { currentUser } = useUserStore();
  
  if (!currentUser) {
    return null;
  }
  
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Dashboard</h2>
        <PeerConnectButton />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RecentDealsWidget />
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
          <h3 className="text-lg font-semibold mb-3">Connected Peers</h3>
          <div className="text-sm text-muted-foreground">
            Connect with other peers to discover more deals and share your own.
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardWidgets;
