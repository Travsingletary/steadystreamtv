import React from 'react';
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface ResellerStatsProps {
  userData: {
    user: any;
    reseller: {
      credits: number;
      total_customers: number;
      active_customers: number;
      id: string;
      [key: string]: any;
    };
  };
}

export const ResellerStats: React.FC<ResellerStatsProps> = ({ userData }) => {
  return (
    <Card className="bg-dark-200 border-gray-800 p-6">
      <Alert className="border-orange-500 bg-orange-500/10">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Reseller statistics are temporarily disabled during database cleanup. 
          Please check back later for stats functionality.
        </AlertDescription>
      </Alert>
    </Card>
  );
};