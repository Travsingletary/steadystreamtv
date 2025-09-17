import React from 'react';
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface CustomersListProps {
  resellerId: string;
  onUpdate: () => void;
}

export const CustomersList: React.FC<CustomersListProps> = ({ resellerId, onUpdate }) => {
  return (
    <Card className="bg-dark-200 border-gray-800 p-6">
      <Alert className="border-orange-500 bg-orange-500/10">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Customer management is temporarily disabled during database cleanup. 
          Please check back later for customer list functionality.
        </AlertDescription>
      </Alert>
    </Card>
  );
};