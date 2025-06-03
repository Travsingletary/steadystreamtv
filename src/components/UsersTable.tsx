
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

interface UsersTableProps {
  users: User[];
  onDeleteUser: (userId: string) => Promise<void>;
  generatePlaylistUrl: (username: string, password: string) => string;
}

export const UsersTable: React.FC<UsersTableProps> = ({
  users,
  onDeleteUser,
  generatePlaylistUrl
}) => {
  return (
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
                      onClick={() => onDeleteUser(user.id)}
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
  );
};
