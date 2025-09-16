
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreditCard, PlusCircle, RefreshCw, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CreditsManagerProps {
  userData: {
    user: any;
    reseller: {
      credits: number;
      [key: string]: any;
    };
  };
  onUpdate: () => void;
}

export const CreditsManager: React.FC<CreditsManagerProps> = ({ userData, onUpdate }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [creditsAmount, setCreditsAmount] = useState('10');
  const [promoCode, setPromoCode] = useState('');

  const handlePurchase = () => {
    setLoading(true);
    
    // Simulate purchase process
    setTimeout(() => {
      toast({
        title: "Credits purchased successfully",
        description: `${creditsAmount} credits have been added to your account`
      });
      
      setLoading(false);
      onUpdate();
    }, 2000);
  };

  const creditPackages = [
    { amount: '10', price: '$50', discount: false },
    { amount: '25', price: '$100', discount: '20%' },
    { amount: '50', price: '$180', discount: '28%' },
    { amount: '100', price: '$300', discount: '40%' }
  ];

  // Recent transactions (example data)
  const transactions = [
    { id: 'tx-1', date: '2025-05-01', type: 'purchase', amount: 10, status: 'completed' },
    { id: 'tx-2', date: '2025-05-01', type: 'used', amount: -1, status: 'completed' },
    { id: 'tx-3', date: '2025-04-28', type: 'purchase', amount: 5, status: 'completed' },
    { id: 'tx-4', date: '2025-04-25', type: 'used', amount: -2, status: 'completed' }
  ];

  return (
    <div className="space-y-6">
      <Card className="bg-dark-200 border-gray-800 p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Your Credits</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={onUpdate}
                className="text-xs"
              >
                <RefreshCw size={14} className="mr-1" />
                Refresh
              </Button>
            </div>
            
            <div className="bg-dark-300 rounded-lg p-6 border border-gray-700 flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Available Credits</p>
                <p className="text-4xl font-bold">{userData.reseller.credits || 0}</p>
              </div>
              <CreditCard className="h-16 w-16 text-gold opacity-80" />
            </div>
            
            <div className="mt-4 bg-dark-300/50 rounded p-4 text-sm text-gray-400">
              <p>Each credit allows you to create one subscription for your customers. Credits never expire.</p>
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-4">Purchase Credits</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {creditPackages.map(pkg => (
                <div 
                  key={pkg.amount}
                  className={`
                    border rounded-lg p-4 cursor-pointer
                    ${creditsAmount === pkg.amount 
                      ? 'border-gold bg-gold/10' 
                      : 'border-gray-700 bg-dark-300 hover:border-gray-500'
                    }
                  `}
                  onClick={() => setCreditsAmount(pkg.amount)}
                >
                  <div className="flex justify-between">
                    <span className="font-bold">{pkg.amount}</span>
                    {pkg.discount && (
                      <span className="bg-green-900/30 text-green-400 text-xs px-2 rounded-full">
                        Save {pkg.discount}
                      </span>
                    )}
                  </div>
                  <p className="text-xl font-bold mt-1">{pkg.price}</p>
                </div>
              ))}
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input 
                  placeholder="Promo code (if any)" 
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="bg-dark-300 border-gray-700"
                />
                <Button 
                  variant="outline" 
                  className="whitespace-nowrap"
                  disabled={!promoCode}
                >
                  Apply
                </Button>
              </div>
              
              <Button 
                className="w-full bg-gold hover:bg-gold-dark text-black"
                onClick={handlePurchase}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Purchase {creditsAmount} Credits
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>
      
      <Card className="bg-dark-200 border-gray-800 p-6">
        <h3 className="text-xl font-semibold mb-4">Credit History</h3>
        
        <Tabs defaultValue="all">
          <TabsList className="mb-4 bg-dark-300">
            <TabsTrigger value="all">All Transactions</TabsTrigger>
            <TabsTrigger value="purchases">Purchases</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-800">
                    <th className="text-left py-2 px-4">DATE</th>
                    <th className="text-left py-2 px-4">TRANSACTION</th>
                    <th className="text-left py-2 px-4">CREDITS</th>
                    <th className="text-left py-2 px-4">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx.id} className="border-b border-gray-800 last:border-0">
                      <td className="py-3 px-4 text-sm">{tx.date}</td>
                      <td className="py-3 px-4">
                        <div className={`flex items-center gap-2 ${
                          tx.type === 'purchase' ? 'text-green-400' : 'text-gray-400'
                        }`}>
                          {tx.type === 'purchase' ? (
                            <PlusCircle size={16} />
                          ) : (
                            <CreditCard size={16} />
                          )}
                          <span className="capitalize">{tx.type}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <span className={tx.amount > 0 ? 'text-green-400' : 'text-gray-400'}>
                          {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded-full text-xs bg-green-900/30 text-green-400">
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
          
          <TabsContent value="purchases">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-800">
                    <th className="text-left py-2 px-4">DATE</th>
                    <th className="text-left py-2 px-4">TRANSACTION</th>
                    <th className="text-left py-2 px-4">CREDITS</th>
                    <th className="text-left py-2 px-4">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.filter(tx => tx.type === 'purchase').map(tx => (
                    <tr key={tx.id} className="border-b border-gray-800 last:border-0">
                      <td className="py-3 px-4 text-sm">{tx.date}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-green-400">
                          <PlusCircle size={16} />
                          <span>Purchase</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-green-400">+{tx.amount}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded-full text-xs bg-green-900/30 text-green-400">
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
          
          <TabsContent value="usage">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-800">
                    <th className="text-left py-2 px-4">DATE</th>
                    <th className="text-left py-2 px-4">CUSTOMER</th>
                    <th className="text-left py-2 px-4">CREDITS</th>
                    <th className="text-left py-2 px-4">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.filter(tx => tx.type === 'used').map(tx => (
                    <tr key={tx.id} className="border-b border-gray-800 last:border-0">
                      <td className="py-3 px-4 text-sm">{tx.date}</td>
                      <td className="py-3 px-4">
                        Customer Subscription
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-400">{tx.amount}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded-full text-xs bg-green-900/30 text-green-400">
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};
