
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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
  activationCode?: string;
  playlistUrl?: string;
}

const SteadyStreamApp = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    plan: 'standard'
  });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      
      // Reset form
      setFormData({ name: '', email: '', plan: 'standard' });

    } catch (error: any) {
      console.error('Error creating user:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
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

        {/* User Registration Form */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">Register New User</h2>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter email address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Plan</label>
              <select
                name="plan"
                value={formData.plan}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="standard">Standard - $20/month</option>
                <option value="premium">Premium - $35/month</option>
                <option value="ultimate">Ultimate - $45/month</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded-md font-medium transition-colors"
              >
                {isLoading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>

          {message && (
            <div className={`mt-4 p-3 rounded-md ${
              message.includes('Error') ? 'bg-red-900 text-red-200' : 'bg-green-900 text-green-200'
            }`}>
              {message}
            </div>
          )}
        </div>

        {/* Users List */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Registered Users ({users.length})</h2>
          
          {users.length === 0 ? (
            <p className="text-gray-400">No users registered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="pb-3 pr-4">Name</th>
                    <th className="pb-3 pr-4">Email</th>
                    <th className="pb-3 pr-4">Plan</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Username</th>
                    <th className="pb-3 pr-4">Password</th>
                    <th className="pb-3 pr-4">Playlist URL</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-700">
                      <td className="py-3 pr-4">{user.name}</td>
                      <td className="py-3 pr-4">{user.email}</td>
                      <td className="py-3 pr-4">
                        <span className="capitalize bg-blue-900 px-2 py-1 rounded text-sm">
                          {user.plan}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-1 rounded text-sm ${
                          user.status === 'active' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 font-mono text-sm">{user.username}</td>
                      <td className="py-3 pr-4 font-mono text-sm">{user.password}</td>
                      <td className="py-3 pr-4">
                        {user.username && user.password && (
                          <a
                            href={generatePlaylistUrl(user.username, user.password)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-sm underline"
                          >
                            Download M3U
                          </a>
                        )}
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* System Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <h3 className="text-xl font-bold mb-2">Total Users</h3>
            <p className="text-3xl font-bold text-blue-400">{users.length}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <h3 className="text-xl font-bold mb-2">Active Users</h3>
            <p className="text-3xl font-bold text-green-400">
              {users.filter(u => u.status === 'active').length}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <h3 className="text-xl font-bold mb-2">System Status</h3>
            <p className="text-3xl font-bold text-green-400">Online</p>
          </div>
        </div>
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
