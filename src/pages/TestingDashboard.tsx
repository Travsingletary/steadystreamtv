import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, CreditCard, Calendar, AlertCircle, CheckCircle, Clock, RefreshCw } from "lucide-react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Navbar from "@/components/Navbar";
import { EdgeFunctionMonitor } from "@/components/admin/EdgeFunctionMonitor";

interface Registration {
  id: string;
  name: string;
  email: string;
  plan: string;
  subscription_status: string;
  subscription_tier: string;
  xtream_username?: string;
  xtream_password?: string;
  created_at: string;
  trial_end_date?: string;
}

export const TestingDashboard = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadRegistrations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegistrations();
  }, []);

  const pendingRegistrations = registrations.filter(reg => !reg.xtream_username);
  const activeAccounts = registrations.filter(reg => reg.xtream_username);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="pt-16">
          <div className="p-6 bg-dark-300 min-h-screen">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">🧪 Unified Testing Dashboard</h1>
                  <p className="text-gray-400">Comprehensive testing suite for all system functions</p>
                </div>
                <div className="flex gap-4">
                  <Button
                    onClick={() => window.location.reload()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Page
                  </Button>
                </div>
              </div>

              {/* System Health Overview */}
              <div className="mb-8">
                <EdgeFunctionMonitor />
              </div>

              <Tabs defaultValue="users" className="space-y-4">
                <TabsList className="bg-dark-200">
                  <TabsTrigger value="users">Users ({registrations.length})</TabsTrigger>
                  <TabsTrigger value="pending">Pending ({pendingRegistrations.length})</TabsTrigger>
                  <TabsTrigger value="active">Active ({activeAccounts.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="users" className="space-y-4">
                  <Card className="bg-dark-200 border-gray-800">
                    <CardContent>
                      <h2 className="text-2xl font-bold text-white">All Users</h2>
                      <p className="text-gray-400">List of all registered users</p>
                      <ul>
                        {registrations.map(user => (
                          <li key={user.id} className="text-white">{user.name} - {user.email}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="pending" className="space-y-4">
                  <Card className="bg-dark-200 border-gray-800">
                    <CardContent>
                      <h2 className="text-2xl font-bold text-white">Pending Accounts</h2>
                      <p className="text-gray-400">Accounts awaiting setup</p>
                      <ul>
                        {pendingRegistrations.map(user => (
                          <li key={user.id} className="text-white">{user.name} - {user.email}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="active" className="space-y-4">
                  <Card className="bg-dark-200 border-gray-800">
                    <CardContent>
                      <h2 className="text-2xl font-bold text-white">Active Accounts</h2>
                      <p className="text-gray-400">Currently active user accounts</p>
                      <ul>
                        {activeAccounts.map(user => (
                          <li key={user.id} className="text-white">{user.name} - {user.email}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default TestingDashboard;
