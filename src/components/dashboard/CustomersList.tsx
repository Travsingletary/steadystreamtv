
import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trash2, RotateCw, Eye, Edit, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from '@/integrations/supabase/types';

type Customer = Database['public']['Tables']['customers']['Row'];

interface CustomersListProps {
  resellerId: string;
  onUpdate: () => void;
}

export const CustomersList: React.FC<CustomersListProps> = ({ resellerId, onUpdate }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('reseller_id', resellerId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setCustomers(data || []);
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error loading customers",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [resellerId]);

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
      setLoading(true);
      // Add 30 days to expiry_date
      const { data: customer } = await supabase
        .from('customers')
        .select('expiry_date')
        .eq('id', customerId)
        .single();
      
      if (!customer) throw new Error("Customer not found");
      
      const currentExpiry = new Date(customer.expiry_date);
      const newExpiry = new Date(currentExpiry);
      newExpiry.setDate(newExpiry.getDate() + 30);
      
      const { error } = await supabase
        .from('customers')
        .update({
          expiry_date: newExpiry.toISOString(),
          status: 'active'
        })
        .eq('id', customerId);
      
      if (error) throw error;
      
      toast({
        title: "Subscription renewed",
        description: "Customer subscription has been renewed for 30 days",
      });
      fetchCustomers();
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error renewing subscription",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm("Are you sure you want to delete this customer? This action cannot be undone.")) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);
      
      if (error) throw error;
      
      toast({
        title: "Customer deleted",
        description: "Customer has been removed from your account",
      });
      fetchCustomers();
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error deleting customer",
        description: error.message,
      });
    } finally {
      setLoading(false);
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

  if (customers.length === 0) {
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
          {customers.map((customer, index) => (
            <tr 
              key={customer.id} 
              className={`
                border-b border-gray-800 hover:bg-dark-300/50
                ${index === customers.length - 1 ? 'border-b-0' : ''}
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
              <td className="py-4 px-4 text-gray-400">
                {new Date(customer.expiry_date).toLocaleDateString()}
              </td>
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
