
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagement } from "./UserManagement";
import { ManualAccountCreation } from "./ManualAccountCreation";
import { UserPlus, Users, Settings } from "lucide-react";

interface ComprehensiveUserManagementProps {
  onStatsUpdate: (stats: any) => void;
}

export const ComprehensiveUserManagement = ({ onStatsUpdate }: ComprehensiveUserManagementProps) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleAccountCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="manage" className="w-full">
        <TabsList className="bg-dark-200 border-gray-800 grid w-full grid-cols-2">
          <TabsTrigger 
            value="manage" 
            className="data-[state=active]:bg-dark-100 data-[state=active]:text-white text-gray-400"
          >
            <Users className="h-4 w-4 mr-2" />
            Manage Users
          </TabsTrigger>
          <TabsTrigger 
            value="create" 
            className="data-[state=active]:bg-dark-100 data-[state=active]:text-white text-gray-400"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Create Account
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manage" className="mt-6">
          <UserManagement 
            key={refreshTrigger}
            onStatsUpdate={onStatsUpdate} 
          />
        </TabsContent>

        <TabsContent value="create" className="mt-6">
          <ManualAccountCreation onAccountCreated={handleAccountCreated} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
