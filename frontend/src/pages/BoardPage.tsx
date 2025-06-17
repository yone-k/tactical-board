import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBoardStore } from '../store/useBoardStore';
import { useSocket } from '../hooks/useSocket';
import Toolbar from '../components/Toolbar';
import Canvas from '../components/Canvas';
import UsersList from '../components/UsersList';
import toast from 'react-hot-toast';

const BoardPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { userName, setRoomId } = useBoardStore();
  const { isConnected } = useSocket();

  useEffect(() => {
    if (!roomId) {
      navigate('/');
      return;
    }

    if (!userName) {
      toast.error('ユーザー名が設定されていません');
      navigate('/');
      return;
    }

    setRoomId(roomId);
  }, [roomId, userName, navigate, setRoomId]);

  if (!roomId || !userName) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="btn btn-secondary btn-sm"
            >
              ← ホーム
            </button>
            <div className="text-sm text-gray-600">
              ルーム: <span className="font-mono font-semibold">{roomId}</span>
            </div>
            <div className={`flex items-center space-x-2 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">
                {isConnected ? '接続中' : '切断中'}
              </span>
            </div>
          </div>
          <UsersList />
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar />

      {/* Canvas Area */}
      <div className="flex-1 overflow-hidden">
        <Canvas />
      </div>
    </div>
  );
};

export default BoardPage;