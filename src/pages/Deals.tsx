
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserStore } from "@/stores/userStore";
import DealsList from "@/components/DealsList";

const DealsPage = () => {
  const { currentUser } = useUserStore();
  
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Please sign in to view your deals</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 h-full overflow-y-auto">
      <h1 className="text-2xl font-bold mb-6">Your Deals</h1>
      
      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Deals</TabsTrigger>
          <TabsTrigger value="proposed">Proposed</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Deals</CardTitle>
            </CardHeader>
            <CardContent>
              <DealsList userId={currentUser.id} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="proposed">
          <Card>
            <CardHeader>
              <CardTitle>Proposed Deals</CardTitle>
            </CardHeader>
            <CardContent>
              <DealsList userId={currentUser.id} />
              {/* We'll add filtering by status in a future update */}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="accepted">
          <Card>
            <CardHeader>
              <CardTitle>Accepted Deals</CardTitle>
            </CardHeader>
            <CardContent>
              <DealsList userId={currentUser.id} />
              {/* We'll add filtering by status in a future update */}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Completed Deals</CardTitle>
            </CardHeader>
            <CardContent>
              <DealsList userId={currentUser.id} />
              {/* We'll add filtering by status in a future update */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DealsPage;
