
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Plus, Minus, RefreshCw } from "lucide-react";

interface Reseller {
  id: string;
  user_id: string;
  credits: number;
  username: string;
  panel_url: string;
  api_key: string;
  created_at: string;
}

interface MegaOTTCreditsProps {
  onStatsUpdate: (stats: any) => void;
}

export const MegaOTTCredits = ({ onStatsUpdate }: MegaOTTCreditsProps) => {
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchResellers();
  }, []);

  const fetchResellers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('resellers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setResellers(data || []);
      
      const totalCredits = data?.reduce((sum, reseller) => sum + (reseller.credits || 0), 0) || 0;
      onStatsUpdate({ megaottCredits: totalCredits });
      
    } catch (error: any) {
      console.error('Error fetching resellers:', error);
      toast({
        title: "Error",
        description: "Failed to load MegaOTT credits",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateCredits = async (resellerId: string, newCredits: number) => {
    try {
      setUpdating(resellerId);
      
      const { error } = await supabase
        .from('resellers')
        .update({ credits: newCredits })
        .eq('id', resellerId);

      if (error) throw error;

      setResellers(prev => 
        prev.map(reseller => 
          reseller.id === resellerId 
            ? { ...reseller, credits: newCredits }
            : reseller
        )
      );

      // Update total credits
      const totalCredits = resellers.reduce((sum, reseller) => 
        sum + (reseller.id === resellerId ? newCredits : reseller.credits || 0), 0
      );
      onStatsUpdate({ megaottCredits: totalCredits });

      toast({
        title: "Success",
        description: "Credits updated successfully",
      });
      
    } catch (error: any) {
      console.error('Error updating credits:', error);
      toast({
        title: "Error",
        description: "Failed to update credits",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleCreditChange = (resellerId: string, change: number) => {
    const reseller = resellers.find(r => r.id === resellerId);
    if (reseller) {
      const newCredits = Math.max(0, (reseller.credits || 0) + change);
      updateCredits(resellerId, newCredits);
    }
  };

  if (loading) {
    return (
      <Card className="bg-dark-200 border-gray-800">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-white">Loading MegaOTT credits...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-dark-200 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          MegaOTT Credits Management
        </CardTitle>
        <CardDescription className="text-gray-400">
          Monitor and manage reseller credits for MegaOTT services
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-6">
          <div className="text-white">
            <span className="text-lg font-semibold">Total Credits Available: </span>
            <span className="text-2xl font-bold text-gold">
              {resellers.reduce((sum, reseller) => sum + (reseller.credits || 0), 0)}
            </span>
          </div>
          <Button
            onClick={fetchResellers}
            variant="outline"
            className="border-gray-700 text-white hover:bg-gray-800"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="rounded-md border border-gray-700">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-gray-300">Username</TableHead>
                <TableHead className="text-gray-300">Panel URL</TableHead>
                <TableHead className="text-gray-300">Credits</TableHead>
                <TableHead className="text-gray-300">Actions</TableHead>
                <TableHead className="text-gray-300">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resellers.map((reseller) => (
                <TableRow key={reseller.id} className="border-gray-700">
                  <TableCell className="text-white">
                    {reseller.username || 'N/A'}
                  </TableCell>
                  <TableCell className="text-white">
                    {reseller.panel_url ? (
                      <a 
                        href={reseller.panel_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        {reseller.panel_url}
                      </a>
                    ) : 'N/A'}
                  </TableCell>
                  <TableCell className="text-white">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-gold">
                        {reseller.credits || 0}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCreditChange(reseller.id, -1)}
                        disabled={updating === reseller.id || (reseller.credits || 0) <= 0}
                        className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCreditChange(reseller.id, 1)}
                        disabled={updating === reseller.id}
                        className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-400">
                    {new Date(reseller.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {resellers.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No reseller accounts found.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
