import React, { useState } from 'react';
import { useBoardStore } from '../store/useBoardStore';

const UsersList: React.FC = () => {
  const [showUsers, setShowUsers] = useState(false);
  const { connectedUsers, userName } = useBoardStore();

  return (
    <div className="relative">
      <button
        onClick={() => setShowUsers(!showUsers)}
        className="btn btn-secondary btn-sm"
      >
        👥 ユーザー ({connectedUsers.length})
      </button>
      
      {showUsers && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-48">
          <div className="p-2">
            <div className="text-sm font-semibold text-gray-700 mb-2">
              接続中のユーザー
            </div>
            {connectedUsers.length === 0 ? (
              <div className="text-sm text-gray-500">
                ユーザーがいません
              </div>
            ) : (
              <div className="space-y-1">
                {connectedUsers.map((user, index) => (
                  <div
                    key={index}
                    className={`text-sm px-2 py-1 rounded ${
                      user === userName
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700'
                    }`}
                  >
                    {user === userName ? `${user} (あなた)` : user}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Overlay to close dropdown */}
      {showUsers && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowUsers(false)}
        />
      )}
    </div>
  );
};

export default UsersList;