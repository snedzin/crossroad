
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "@/stores/userStore";
import { useDealStore } from "@/stores/dealStore";
import DealsList from "./DealsList";

const RecentDealsWidget = () => {
  const navigate = useNavigate();
  const { currentUser } = useUserStore();
  const { getUnreadDealsCount } = useDealStore();
  
  if (!currentUser) return null;
  
  const unreadCount = getUnreadDealsCount(currentUser.id);
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">
          Recent Deals
          {unreadCount > 0 && (
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-board-primary text-white">
              {unreadCount} new
            </span>
          )}
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0"
          onClick={() => navigate('/deals')}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <DealsList userId={currentUser.id} limit={3} />
      </CardContent>
    </Card>
  );
};

export default RecentDealsWidget;
