
import React from 'react';
import ListingBoard from '@/components/ListingBoard';
import DashboardWidgets from '@/components/DashboardWidgets';

const Index = () => {
  return (
    <div className="container mx-auto p-4">
      <DashboardWidgets />
      <ListingBoard />
    </div>
  );
};

export default Index;
