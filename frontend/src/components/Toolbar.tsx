import React, { useState } from 'react';
import { useBoardStore } from '../store/useBoardStore';
import { useSocket } from '../hooks/useSocket';
import { PenColor } from '../types';

const Toolbar: React.FC = () => {
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  
  const {
    selectedTool,
    activeLayer,
    setSelectedTool,
    setActiveLayer,
    setMapBackground
  } = useBoardStore();
  
  const { emitClearBoard, emitStampAdd } = useSocket();

  const colors: PenColor[] = [
    '#FFFF00', // Yellow
    '#00FF00', // Green
    '#00FFFF', // Cyan
    '#800080', // Purple
    '#FFA500', // Orange
    '#FFFFFF', // White
    '#000000'  // Black
  ];

  const handleToolSelect = (toolType: string) => {
    // 選択中のツールを再度押したらデフォルトモードに戻す
    if (selectedTool.type === toolType) {
      setSelectedTool({ type: 'default' });
      return;
    }

    if (toolType === 'pen') {
      setSelectedTool({
        type: 'pen',
        color: selectedTool.color || '#FFFF00',
        strokeWidth: selectedTool.strokeWidth || 2
      });
    } else if (toolType === 'eraser') {
      setSelectedTool({ type: 'eraser' });
    } else if (['frag', 'smoke', 'stun'].includes(toolType)) {
      setSelectedTool({ type: toolType as 'frag' | 'smoke' | 'stun' });
    } else if (toolType === 'text') {
      setShowTextInput(true);
    }
  };

  const handleColorSelect = (color: PenColor) => {
    // Always switch to pen tool when selecting color
    setSelectedTool({
      type: 'pen',
      color,
      strokeWidth: selectedTool.strokeWidth || 2
    });
  };

  const handleAddText = () => {
    if (textInput.trim()) {
      // Set tool to text mode, but don't clear the input yet - it will be used in Canvas
      setSelectedTool({ type: 'text', content: textInput.trim() });
      setShowTextInput(false);
      setTextInput('');
    }
  };

  const handleMapUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const formData = new FormData();
        formData.append('map', file);
        
        const response = await fetch('/api/maps/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (response.ok) {
          const result = await response.json();
          setMapBackground(result.url);
        } else {
          console.error('Failed to upload map');
        }
      } catch (error) {
        console.error('Error uploading map:', error);
      }
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Map Upload */}
          <div>
            <label htmlFor="map-upload" className="btn btn-secondary btn-sm cursor-pointer">
              MAP
            </label>
            <input
              id="map-upload"
              type="file"
              accept="image/*"
              onChange={handleMapUpload}
              className="hidden"
            />
          </div>

          {/* Reset Button */}
          <button
            onClick={emitClearBoard}
            className="btn btn-secondary btn-sm"
          >
            Reset
          </button>

          {/* Color Palette */}
          <div className="flex items-center space-x-1">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => handleColorSelect(color)}
                className={`w-6 h-6 rounded border-2 ${
                  selectedTool.color === color ? 'border-gray-800' : 'border-gray-300'
                }`}
                style={{ backgroundColor: color }}
                title={`Color: ${color}`}
              />
            ))}
          </div>

          {/* Tools */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleToolSelect('pen')}
              className={`btn btn-sm ${
                selectedTool.type === 'pen' ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              ペン
            </button>
            
            <button
              onClick={() => handleToolSelect('eraser')}
              className={`btn btn-sm ${
                selectedTool.type === 'eraser' ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              消しゴム
            </button>
          </div>

          {/* Stamps */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleToolSelect('frag')}
              className={`btn btn-sm ${
                selectedTool.type === 'frag' ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              💣 Frag
            </button>
            
            <button
              onClick={() => handleToolSelect('smoke')}
              className={`btn btn-sm ${
                selectedTool.type === 'smoke' ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              💨 Smoke
            </button>
            
            <button
              onClick={() => handleToolSelect('stun')}
              className={`btn btn-sm ${
                selectedTool.type === 'stun' ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              ⚡ Stun
            </button>
          </div>

          {/* Text Tool */}
          <div className="flex items-center space-x-2">
            {showTextInput ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddText()}
                  placeholder="テキストを入力"
                  className="px-2 py-1 text-sm border border-gray-300 rounded"
                  autoFocus
                />
                <button
                  onClick={handleAddText}
                  className="btn btn-primary btn-sm"
                >
                  追加
                </button>
                <button
                  onClick={() => setShowTextInput(false)}
                  className="btn btn-secondary btn-sm"
                >
                  キャンセル
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleToolSelect('text')}
                className="btn btn-secondary btn-sm"
              >
                Text
              </button>
            )}
          </div>
        </div>

        {/* Layer Selection */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Layer:</span>
          {[1, 2, 3, 4].map((layer) => (
            <button
              key={layer}
              onClick={() => setActiveLayer(layer)}
              className={`btn btn-sm ${
                activeLayer === layer ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              {layer}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Toolbar;