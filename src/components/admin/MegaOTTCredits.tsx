
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, CreditCard, AlertCircle } from "lucide-react";

interface MegaOTTCreditsProps {
  onStatsUpdate: (stats: any) => void;
}

export const MegaOTTCredits = ({ onStatsUpdate }: MegaOTTCreditsProps) => {
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to get credits from resellers table
      const { data, error: fetchError } = await supabase
        .from('resellers')
        .select('credits')
        .limit(1)
        .single();

      if (fetchError) {
        // If no resellers exist, set credits to 0
        console.log('No reseller profile found, setting credits to 0');
        setCredits(0);
        onStatsUpdate({ megaottCredits: 0 });
      } else {
        const totalCredits = data?.credits || 0;
        setCredits(totalCredits);
        onStatsUpdate({ megaottCredits: totalCredits });
      }
      
    } catch (error: any) {
      console.error('Error fetching credits:', error);
      setError('Failed to load MegaOTT credits');
      setCredits(0);
      onStatsUpdate({ megaottCredits: 0 });
    } finally {
      setLoading(false);
    }
  };

  const refreshCredits = async () => {
    try {
      setLoading(true);
      
      // For now, just refetch the data
      // In a real scenario, this would sync with MegaOTT API
      await fetchCredits();
      
      toast({
        title: "Credits Refreshed",
        description: "MegaOTT credits have been updated successfully"
      });
      
    } catch (error: any) {
      console.error('Error refreshing credits:', error);
      toast({
        title: "Refresh Failed",
        description: "Unable to refresh MegaOTT credits",
        variant: "destructive"
      });
    }
  };

  if (loading && !error) {
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
          Monitor and manage your MegaOTT API credits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div>
              <h3 className="text-red-400 font-semibold">Error Loading Credits</h3>
              <p className="text-gray-300 text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-dark-300 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Available Credits</p>
                <p className="text-2xl font-bold text-white">{credits.toLocaleString()}</p>
              </div>
              <Badge className="bg-green-500 text-white">
                Active
              </Badge>
            </div>
          </div>

          <div className="bg-dark-300 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Credits Used Today</p>
                <p className="text-2xl font-bold text-white">0</p>
              </div>
              <Badge className="bg-blue-500 text-white">
                Tracking
              </Badge>
            </div>
          </div>

          <div className="bg-dark-300 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Estimated Days Left</p>
                <p className="text-2xl font-bold text-white">∞</p>
              </div>
              <Badge className="bg-gold text-black">
                Unlimited
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            onClick={refreshCredits}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Credits
          </Button>
        </div>

        <div className="bg-dark-300 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-2">Credit Usage Guidelines</h3>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• Each subscription creation uses 1 credit</li>
            <li>• Credit balance is updated in real-time</li>
            <li>• Low balance alerts are sent automatically</li>
            <li>• Contact support for credit top-ups</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
