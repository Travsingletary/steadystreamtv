
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RegistrationForm } from './components/RegistrationForm';
import { UsersTable } from './components/UsersTable';
import { StatsDashboard } from './components/StatsDashboard';

const queryClient = new QueryClient();

// Supabase configuration
const supabaseUrl = 'https://ojueihcytxwcioqtvwez.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdWVpaGN5dHh3Y2lvcXR2d2V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0Mzc1NDQsImV4cCI6MjA2MjAxMzU0NH0.VsWI3EcSVaeY-NfsW1zJUw6DpMsrHHDP9GYTpaxMbPM';

const supabase = createClient(supabaseUrl, supabaseKey);

interface User {
  id: string;
  name: string;
  email: string;
  plan: string;
  status: string;
  username: string;
  password: string;
  activationCode?: string;
  playlistUrl?: string;
}

const SteadyStreamApp = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      setMessage('Error loading users');
    }
  };

  const generateActivationCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const generatePlaylistUrl = (username: string, password: string) => {
    const baseUrl = 'http://megaott.net/get.php';
    return `${baseUrl}?username=${username}&password=${password}&type=m3u_plus&output=ts`;
  };

  const handleSubmit = async (formData: { name: string; email: string; plan: string }) => {
    setIsLoading(true);
    setMessage('');

    try {
      // Generate activation code and credentials
      const activationCode = generateActivationCode();
      const username = `steady_${formData.name.toLowerCase().replace(/\s+/g, '')}_${Date.now()}`;
      const password = Math.random().toString(36).substring(2, 12);
      const playlistUrl = generatePlaylistUrl(username, password);

      // Calculate expiry date (30 days from now)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      // Insert user into database
      const { data, error } = await supabase
        .from('customers')
        .insert([
          {
            name: formData.name,
            email: formData.email,
            plan: formData.plan,
            status: 'active',
            username: username,
            password: password,
            expiry_date: expiryDate.toISOString(),
            reseller_id: '00000000-0000-0000-0000-000000000000' // Default reseller ID
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Add activation code and playlist URL to the user object for display
      const newUser = {
        ...data,
        activationCode,
        playlistUrl
      };

      setUsers(prev => [newUser, ...prev]);
      setMessage(`User created successfully! Activation Code: ${activationCode}`);

    } catch (error: any) {
      console.error('Error creating user:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.filter(user => user.id !== userId));
      setMessage('User deleted successfully');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      setMessage(`Error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <img 
            src="/lovable-uploads/7eee6a9b-1a45-4b4f-993a-eb7c793bb511.png"
            alt="SteadyStream TV"
            className="h-16 w-auto mx-auto mb-4"
          />
          <h1 className="text-4xl font-bold mb-2">SteadyStream TV Automation</h1>
          <p className="text-gray-400">Complete IPTV User Management System</p>
        </div>

        <RegistrationForm 
          onSubmit={handleSubmit}
          isLoading={isLoading}
          message={message}
        />

        <UsersTable 
          users={users}
          onDeleteUser={deleteUser}
          generatePlaylistUrl={generatePlaylistUrl}
        />

        <StatsDashboard users={users} />
      </div>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <SteadyStreamApp />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
