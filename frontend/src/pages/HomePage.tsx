import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { useBoardStore } from '../store/useBoardStore';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { setUserName, setRoomId } = useBoardStore();
  const [userName, setUserNameInput] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('');

  const createRoom = async () => {
    if (!userName.trim()) {
      toast.error('ユーザー名を入力してください');
      return;
    }

    try {
      const response = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('ルーム作成に失敗しました');
      }

      const { roomId } = await response.json();
      setUserName(userName.trim());
      setRoomId(roomId);
      navigate(`/room/${roomId}`);
    } catch (error) {
      toast.error('ルーム作成に失敗しました');
      console.error('Error creating room:', error);
    }
  };

  const joinRoom = () => {
    if (!userName.trim()) {
      toast.error('ユーザー名を入力してください');
      return;
    }

    if (!roomIdInput.trim()) {
      toast.error('ルームIDを入力してください');
      return;
    }

    setUserName(userName.trim());
    setRoomId(roomIdInput.trim());
    navigate(`/room/${roomIdInput.trim()}`);
  };

  const generateQuickRoom = () => {
    const quickRoomId = uuidv4().slice(0, 8);
    setRoomIdInput(quickRoomId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Tactical Board
          </h1>
          <p className="text-gray-600">
            リアルタイム戦術ボード
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-2">
              ユーザー名
            </label>
            <input
              type="text"
              id="userName"
              value={userName}
              onChange={(e) => setUserNameInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="あなたの名前を入力"
              maxLength={20}
            />
          </div>

          <div className="space-y-4">
            <button
              onClick={createRoom}
              className="w-full btn btn-primary btn-md"
              disabled={!userName.trim()}
            >
              新しいルームを作成
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">または</span>
              </div>
            </div>

            <div>
              <label htmlFor="roomId" className="block text-sm font-medium text-gray-700 mb-2">
                ルームID
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  id="roomId"
                  value={roomIdInput}
                  onChange={(e) => setRoomIdInput(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ルームIDを入力"
                />
                <button
                  onClick={generateQuickRoom}
                  className="btn btn-secondary btn-md"
                  type="button"
                >
                  生成
                </button>
              </div>
            </div>

            <button
              onClick={joinRoom}
              className="w-full btn btn-secondary btn-md"
              disabled={!userName.trim() || !roomIdInput.trim()}
            >
              ルームに参加
            </button>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>複数のユーザーで同じボードをリアルタイムに共有できます</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;