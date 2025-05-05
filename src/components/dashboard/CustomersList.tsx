
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trash2, RotateCw, Eye, Edit, Copy } from "lucide-react";

interface CustomersListProps {
  resellerId: string;
  onUpdate: () => void;
}

export const CustomersList: React.FC<CustomersListProps> = ({ resellerId, onUpdate }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Demo data until we connect to Supabase
  const demoCustomers = [
    {
      id: "cust-1",
      name: "John Smith",
      email: "john@example.com",
      plan: "Basic",
      status: "active",
      username: "jsmith",
      password: "pass123",
      created_at: "2025-05-01",
      expiry_date: "2025-06-01"
    },
    {
      id: "cust-2",
      name: "Sarah Johnson",
      email: "sarah@example.com",
      plan: "Premium",
      status: "active",
      username: "sjohnson",
      password: "pass456",
      created_at: "2025-05-02",
      expiry_date: "2025-06-02"
    },
    {
      id: "cust-3",
      name: "Michael Brown",
      email: "michael@example.com",
      plan: "Ultimate",
      status: "expired",
      username: "mbrown",
      password: "pass789",
      created_at: "2025-04-03",
      expiry_date: "2025-05-03"
    }
  ];

  const handleCopyCredentials = (username: string, password: string) => {
    const text = `Username: ${username}\nPassword: ${password}`;
    navigator.clipboard.writeText(text);
    toast({
      title: "Credentials copied",
      description: "Customer login details copied to clipboard",
    });
  };

  const handleRenewSubscription = async (customerId: string) => {
    try {
      // Logic for renewing subscription
      toast({
        title: "Subscription renewed",
        description: "Customer subscription has been renewed for 30 days",
      });
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error renewing subscription",
        description: error.message,
      });
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm("Are you sure you want to delete this customer? This action cannot be undone.")) {
      return;
    }

    try {
      // Demo deletion for now
      toast({
        title: "Customer deleted",
        description: "Customer has been removed from your account",
      });
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error deleting customer",
        description: error.message,
      });
    }
  };

  if (loading) {
    return (
      <Card className="bg-dark-200 border-gray-800 p-6 text-center">
        <RotateCw className="h-10 w-10 animate-spin mx-auto text-gold" />
        <p className="mt-4">Loading customers...</p>
      </Card>
    );
  }

  if (demoCustomers.length === 0) {
    return (
      <Card className="bg-dark-200 border-gray-800 p-6 text-center">
        <h3 className="text-xl font-semibold mb-2">No Customers Yet</h3>
        <p className="text-gray-400 mb-4">
          You haven't added any customers to your reseller account.
        </p>
      </Card>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-dark-300 text-gray-400 text-xs">
            <th className="text-left py-3 px-4 rounded-tl-lg">CUSTOMER</th>
            <th className="text-left py-3 px-4">PLAN</th>
            <th className="text-left py-3 px-4">USERNAME</th>
            <th className="text-left py-3 px-4">STATUS</th>
            <th className="text-left py-3 px-4">EXPIRY</th>
            <th className="text-right py-3 px-4 rounded-tr-lg">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {demoCustomers.map((customer, index) => (
            <tr 
              key={customer.id} 
              className={`
                border-b border-gray-800 hover:bg-dark-300/50
                ${index === demoCustomers.length - 1 ? 'border-b-0' : ''}
              `}
            >
              <td className="py-4 px-4">
                <div>
                  <p className="font-medium">{customer.name}</p>
                  <p className="text-xs text-gray-400">{customer.email}</p>
                </div>
              </td>
              <td className="py-4 px-4">{customer.plan}</td>
              <td className="py-4 px-4">
                <div className="flex items-center">
                  <span className="font-mono">{customer.username}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleCopyCredentials(customer.username, customer.password)}
                    className="ml-1 h-6 w-6 text-gray-400 hover:text-white"
                  >
                    <Copy size={14} />
                  </Button>
                </div>
              </td>
              <td className="py-4 px-4">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  customer.status === 'active' 
                    ? 'bg-green-900/30 text-green-400' 
                    : 'bg-red-900/30 text-red-400'
                }`}>
                  {customer.status}
                </span>
              </td>
              <td className="py-4 px-4 text-gray-400">{customer.expiry_date}</td>
              <td className="py-4 px-4 text-right">
                <div className="flex justify-end space-x-1">
                  <Button variant="outline" size="icon" className="w-8 h-8">
                    <Eye size={14} />
                  </Button>
                  <Button variant="outline" size="icon" className="w-8 h-8">
                    <Edit size={14} />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="w-8 h-8"
                    onClick={() => handleRenewSubscription(customer.id)}
                  >
                    <RotateCw size={14} />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="w-8 h-8 text-red-500 hover:text-red-300"
                    onClick={() => handleDeleteCustomer(customer.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
