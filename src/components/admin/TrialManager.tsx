
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Clock, UserPlus, Gift } from "lucide-react";

export const TrialManager = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const { toast } = useToast();

  const handleCreateTrial = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter an email address for the trial",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Create a trial account with 24-hour access
      const trialEndDate = new Date();
      trialEndDate.setHours(trialEndDate.getHours() + 24);

      // First, create or update the profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          email,
          subscription_tier: 'trial',
          subscription_status: 'active',
          subscription_start_date: new Date().toISOString(),
          subscription_end_date: trialEndDate.toISOString(),
          trial_end_date: trialEndDate.toISOString()
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Generate temporary credentials
      const username = `trial_${Date.now()}`;
      const password = Math.random().toString(36).substring(2, 15);

      // Update with trial credentials
      await supabase
        .from('profiles')
        .update({
          xtream_username: username,
          xtream_password: password
        })
        .eq('email', email);

      toast({
        title: "24-Hour Trial Created",
        description: `Trial account created for ${email} - expires in 24 hours`,
      });

      console.log('🎁 Trial created:', { email, username, expires: trialEndDate });
      setEmail('');
    } catch (error: any) {
      console.error('Trial creation error:', error);
      toast({
        title: "Trial Creation Failed",
        description: error.message || "Failed to create trial account",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExtendAllTrials = async () => {
    setLoading(true);
    try {
      const newEndDate = new Date();
      newEndDate.setHours(newEndDate.getHours() + 24);

      const { data, error } = await supabase
        .from('profiles')
        .update({
          trial_end_date: newEndDate.toISOString(),
          subscription_end_date: newEndDate.toISOString()
        })
        .eq('subscription_tier', 'trial')
        .select();

      if (error) throw error;

      toast({
        title: "Trials Extended",
        description: `Extended ${data?.length || 0} trial accounts by 24 hours`,
      });

      console.log('⏰ Extended trials:', data);
    } catch (error: any) {
      toast({
        title: "Extension Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-dark-200 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Clock className="h-5 w-5" />
          24-Hour Trial Manager
        </CardTitle>
        <CardDescription className="text-gray-400">
          Create and manage 24-hour trial accounts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Input
            type="email"
            placeholder="Enter email for trial account"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-dark-300 border-gray-700 text-white"
          />
          <Button
            onClick={handleCreateTrial}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            <Gift className="h-4 w-4 mr-2" />
            Create Trial
          </Button>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleExtendAllTrials}
            disabled={loading}
            variant="outline"
            className="border-gray-600 hover:bg-dark-300"
          >
            <Clock className="h-4 w-4 mr-2" />
            Extend All Trials (+24h)
          </Button>
        </div>

        <div className="text-sm text-gray-400 mt-4">
          <p>• Trial accounts automatically expire after 24 hours</p>
          <p>• Users get temporary streaming credentials</p>
          <p>• Perfect for demos and customer testing</p>
        </div>
      </CardContent>
    </Card>
  );
};
