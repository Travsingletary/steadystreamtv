
import React from 'react';

export const QuickActions: React.FC = () => {
  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
      <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="bg-yellow-600 hover:bg-yellow-700 text-black font-medium py-3 px-6 rounded-lg transition-colors">
          📊 View Analytics
        </button>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors">
          👥 Manage Users
        </button>
        <button className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors">
          ⚙️ System Settings
        </button>
      </div>
    </div>
  );
};
