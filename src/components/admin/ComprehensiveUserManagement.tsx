
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagement } from "./UserManagement";
import { ManualAccountCreation } from "./ManualAccountCreation";
import { EdgeFunctionMonitor } from "./EdgeFunctionMonitor";
import { UserPlus, Users, Settings, Activity } from "lucide-react";
import { ErrorBoundary } from "../ErrorBoundary";

interface ComprehensiveUserManagementProps {
  onStatsUpdate: (stats: any) => void;
}

export const ComprehensiveUserManagement = ({ onStatsUpdate }: ComprehensiveUserManagementProps) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleAccountCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <Tabs defaultValue="manage" className="w-full">
          <TabsList className="bg-dark-200 border-gray-800 grid w-full grid-cols-3">
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
            <TabsTrigger 
              value="monitor" 
              className="data-[state=active]:bg-dark-100 data-[state=active]:text-white text-gray-400"
            >
              <Activity className="h-4 w-4 mr-2" />
              System Health
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

          <TabsContent value="monitor" className="mt-6">
            <EdgeFunctionMonitor />
          </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundary>
  );
};
