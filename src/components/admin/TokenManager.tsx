
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { MegaOTTIntegrationService } from '@/services/megaOTTIntegrationService';
import { Package, Plus, RefreshCw, AlertTriangle } from 'lucide-react';

interface TokenInventory {
  basic: number;
  premium: number;
  vip: number;
}

export const TokenManager: React.FC = () => {
  const [inventory, setInventory] = useState<TokenInventory>({
    basic: 0,
    premium: 0,
    vip: 0
  });
  const [purchaseForm, setPurchaseForm] = useState({
    quantity: 10,
    duration: 30,
    packageType: 'basic' as 'basic' | 'premium' | 'vip'
  });
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  const service = new MegaOTTIntegrationService();

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const inventoryData = await service.monitorTokenInventory();
      setInventory(inventoryData);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const purchaseTokens = async () => {
    setPurchasing(true);
    try {
      await service.purchaseTokensBulk(purchaseForm);
      await loadInventory(); // Refresh inventory
      console.log('Tokens purchased successfully');
    } catch (error) {
      console.error('Error purchasing tokens:', error);
    } finally {
      setPurchasing(false);
    }
  };

  const getStatusColor = (count: number) => {
    if (count < 5) return 'bg-red-600';
    if (count < 10) return 'bg-yellow-600';
    return 'bg-green-600';
  };

  const getStatusText = (count: number) => {
    if (count < 5) return 'Low Stock';
    if (count < 10) return 'Medium Stock';
    return 'Good Stock';
  };

  return (
    <div className="space-y-6">
      
      {/* Current Inventory */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Package className="w-5 h-5" />
            Token Inventory
            <Button
              onClick={loadInventory}
              disabled={loading}
              size="sm"
              variant="outline"
              className="ml-auto"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {Object.entries(inventory).map(([type, count]) => (
              <Card key={type} className="bg-gray-700 border-gray-600">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-white capitalize">{type} Tokens</h3>
                    <Badge className={getStatusColor(count)}>
                      {getStatusText(count)}
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold text-white">{count}</p>
                  <p className="text-sm text-gray-400">Available tokens</p>
                  {count < 5 && (
                    <div className="flex items-center gap-2 mt-2 text-red-400">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-xs">Low stock warning!</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            
          </div>
        </CardContent>
      </Card>

      {/* Purchase New Tokens */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Purchase New Tokens
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Package Type
              </label>
              <Select
                value={purchaseForm.packageType}
                onValueChange={(value: 'basic' | 'premium' | 'vip') => 
                  setPurchaseForm(prev => ({ ...prev, packageType: value }))
                }
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic (Solo Plan)</SelectItem>
                  <SelectItem value="premium">Premium (Duo Plan)</SelectItem>
                  <SelectItem value="vip">VIP (Family Plan)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Quantity
              </label>
              <Input
                type="number"
                value={purchaseForm.quantity}
                onChange={(e) => setPurchaseForm(prev => ({ 
                  ...prev, 
                  quantity: parseInt(e.target.value) || 0 
                }))}
                className="bg-gray-700 border-gray-600 text-white"
                min="1"
                max="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Duration (Days)
              </label>
              <Input
                type="number"
                value={purchaseForm.duration}
                onChange={(e) => setPurchaseForm(prev => ({ 
                  ...prev, 
                  duration: parseInt(e.target.value) || 0 
                }))}
                className="bg-gray-700 border-gray-600 text-white"
                min="1"
                max="365"
              />
            </div>

          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-gray-400">
              <p>Estimated Cost: ${(purchaseForm.quantity * 2.5).toFixed(2)}</p>
              <p>Total Tokens: {purchaseForm.quantity}</p>
            </div>
            
            <Button
              onClick={purchaseTokens}
              disabled={purchasing || purchaseForm.quantity < 1}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {purchasing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Purchasing...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Purchase Tokens
                </>
              )}
            </Button>
          </div>
          
        </CardContent>
      </Card>
      
    </div>
  );
};
