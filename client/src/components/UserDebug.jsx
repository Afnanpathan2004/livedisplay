import React from 'react';
import { useAuth } from '../contexts/AuthContext';

// Temporary debug component to check user role
const UserDebug = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg z-50">
        <p className="font-bold">Not Authenticated</p>
        <p className="text-sm">Please log in to see user info</p>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded shadow-lg z-50 max-w-sm">
      <p className="font-bold mb-2">Current User Info:</p>
      <div className="text-sm space-y-1">
        <p><strong>Username:</strong> {user?.username || 'N/A'}</p>
        <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
        <p><strong>Role:</strong> <span className="font-bold text-lg">{user?.role || 'N/A'}</span></p>
        <p><strong>Name:</strong> {user?.firstName} {user?.lastName}</p>
      </div>
      <p className="text-xs mt-2 text-gray-600">
        {user?.role === 'admin' ? '✅ User Management should be visible' : '❌ Need admin role to see User Management'}
      </p>
    </div>
  );
};

export default UserDebug;
