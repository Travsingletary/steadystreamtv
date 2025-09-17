import React from 'react';
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface AddCustomerProps {
  userId: string;
  onSuccess: () => void;
}

export const AddCustomer: React.FC<AddCustomerProps> = ({ userId, onSuccess }) => {
  return (
    <Card className="bg-dark-200 border-gray-800 p-6">
      <Alert className="border-orange-500 bg-orange-500/10">
        <Info className="h-4 w-4" />
        <AlertDescription>
          This feature is temporarily disabled during database cleanup. 
          Please check back later for customer management functionality.
        </AlertDescription>
      </Alert>
    </Card>
  );
};