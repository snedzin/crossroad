
import React from "react";
import { useUserStore } from "@/stores/userStore";
import RecentDealsWidget from "./RecentDealsWidget";

const DashboardWidgets = () => {
  const { currentUser } = useUserStore();
  
  if (!currentUser) {
    return null;
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      <RecentDealsWidget />
      {/* Additional dashboard widgets can be added here */}
    </div>
  );
};

export default DashboardWidgets;
