
import React from 'react';

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

interface StatsDashboardProps {
  users: User[];
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ users }) => {
  const activeUsers = users.filter(u => u.status === 'active').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <h3 className="text-xl font-bold mb-2">Total Users</h3>
        <p className="text-3xl font-bold text-blue-400">{users.length}</p>
      </div>
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <h3 className="text-xl font-bold mb-2">Active Users</h3>
        <p className="text-3xl font-bold text-green-400">{activeUsers}</p>
      </div>
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <h3 className="text-xl font-bold mb-2">System Status</h3>
        <p className="text-3xl font-bold text-green-400">Online</p>
      </div>
    </div>
  );
};
