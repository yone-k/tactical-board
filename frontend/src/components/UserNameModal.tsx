import React, { useState, useEffect } from 'react';
import { useBoardStore } from '../store/useBoardStore';

interface UserNameModalProps {
  isOpen: boolean;
  onClose: (userName: string) => void;
  roomId: string;
}

const UserNameModal: React.FC<UserNameModalProps> = ({ isOpen, onClose, roomId }) => {
  const [inputValue, setInputValue] = useState('');
  const { setUserName } = useBoardStore();

  useEffect(() => {
    // モーダルが開かれたときに保存されているユーザー名があれば設定
    if (isOpen && typeof window !== 'undefined') {
      const savedUserName = localStorage.getItem('tactical-board-username') || '';
      setInputValue(savedUserName);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userName = inputValue.trim() || '名無し';
    setUserName(userName);
    onClose(userName);
  };

  const handleUseDefault = () => {
    const defaultName = '名無し';
    setUserName(defaultName);
    onClose(defaultName);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ユーザー名を入力
          </h2>
          <p className="text-gray-600">
            ルーム <span className="font-mono font-semibold text-blue-600">{roomId}</span> に参加します
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="modal-userName" className="block text-sm font-medium text-gray-700 mb-2">
              ユーザー名
            </label>
            <input
              type="text"
              id="modal-userName"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="あなたの名前を入力（空欄の場合は「名無し」）"
              maxLength={20}
              autoFocus
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              className="flex-1 btn btn-primary btn-md"
            >
              参加する
            </button>
            <button
              type="button"
              onClick={handleUseDefault}
              className="btn btn-secondary btn-md"
            >
              名無しで参加
            </button>
          </div>
        </form>

        <div className="mt-4 text-center text-sm text-gray-500">
          <p>ユーザー名は後から変更できます</p>
        </div>
      </div>
    </div>
  );
};

export default UserNameModal;