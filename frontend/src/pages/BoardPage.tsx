import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBoardStore } from '../store/useBoardStore';
import { useSocket } from '../hooks/useSocket';
import Toolbar from '../components/Toolbar';
import Canvas from '../components/Canvas';
import UsersList from '../components/UsersList';
import UserNameModal from '../components/UserNameModal';
import toast from 'react-hot-toast';

const BoardPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { userName, setRoomId, setUserName } = useBoardStore();
  const { isConnected } = useSocket();
  const [showUserNameModal, setShowUserNameModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!roomId) {
      navigate('/');
      return;
    }

    setRoomId(roomId);

    // ユーザー名が設定されていない場合はモーダルを表示
    if (!userName.trim()) {
      setShowUserNameModal(true);
    } else {
      setIsInitialized(true);
    }
  }, [roomId, userName, navigate, setRoomId]);

  const handleUserNameSubmit = (submittedUserName: string) => {
    setShowUserNameModal(false);
    setIsInitialized(true);
    // 参加アラートは削除（SocketでのWebSocketイベント処理と重複するため）
  };

  if (!roomId) {
    return null;
  }

  // ユーザー名モーダルが表示中またはまだ初期化されていない場合
  if (showUserNameModal || !isInitialized) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <UserNameModal
          isOpen={showUserNameModal}
          onClose={handleUserNameSubmit}
          roomId={roomId}
        />
        {!showUserNameModal && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">接続中...</p>
          </div>
        )}
      </div>
    );
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
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>ルーム: <span className="font-mono font-semibold">{roomId}</span></span>
              <button
                onClick={() => {
                  const currentUrl = window.location.href;
                  navigator.clipboard.writeText(currentUrl);
                  toast.success('URLをコピーしました');
                }}
                className="btn btn-secondary btn-sm"
                title="URLをコピー"
              >
                📋
              </button>
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