import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Line, Circle, Text, Image as KonvaImage } from 'react-konva';
import { useBoardStore } from '../store/useBoardStore';
import { useSocket } from '../hooks/useSocket';
import { Position, DrawingData } from '../types';
import PlayerToken from './PlayerToken';
import StampComponent from './StampComponent';

const Canvas: React.FC = () => {
  const stageRef = useRef<any>(null);
  const [tool, setTool] = useState<string>('pen');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<number[]>([]);
  
  const {
    players,
    drawings,
    stamps,
    activeLayer,
    selectedTool,
    mapBackground,
    addDrawing,
    movePlayer,
    addStamp,
    setSelectedTool
  } = useBoardStore();
  
  const { emitDrawingUpdate, emitPlayerMove, emitStampAdd } = useSocket();

  const [stageSize, setStageSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight - 120 // Account for toolbar and header
  });

  const [mapImage, setMapImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (mapBackground) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => setMapImage(img);
      img.src = mapBackground;
    } else {
      setMapImage(null);
    }
  }, [mapBackground]);

  useEffect(() => {
    const handleResize = () => {
      setStageSize({
        width: window.innerWidth,
        height: window.innerHeight - 120
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseDown = (e: any) => {
    // デフォルトモードの場合は何もしない
    if (selectedTool.type === 'default') {
      return;
    }
    
    if (selectedTool.type === 'pen' || selectedTool.type === 'eraser') {
      setIsDrawing(true);
      const stage = e.target.getStage();
      const pos = stage?.getPointerPosition();
      
      if (!pos || typeof pos.x !== 'number' || typeof pos.y !== 'number') {
        console.error('Invalid pointer position for drawing:', pos);
        setIsDrawing(false);
        return;
      }
      
      setCurrentPath([pos.x, pos.y]);
    } else if (['frag', 'smoke', 'stun', 'text'].includes(selectedTool.type)) {
      const stage = e.target.getStage();
      const pos = stage?.getPointerPosition();
      
      if (!pos || typeof pos.x !== 'number' || typeof pos.y !== 'number') {
        console.error('Invalid pointer position:', pos);
        return;
      }
      
      if (selectedTool.type === 'text') {
        // For text stamps, use the content from toolbar or prompt
        const textContent = selectedTool.content || prompt('テキストを入力してください:');
        if (textContent && textContent.trim()) {
          const stamp = {
            type: 'text' as const,
            position: { x: Math.round(pos.x), y: Math.round(pos.y) },
            layer: activeLayer,
            content: textContent.trim()
          };
          console.log('Text stamp to emit:', stamp);
          emitStampAdd(stamp);
          
          // スタンプ設置後にデフォルトモードに戻す
          setSelectedTool({ type: 'default' });
        }
      } else {
        const stamp = {
          type: selectedTool.type as 'frag' | 'smoke' | 'stun',
          position: { x: Math.round(pos.x), y: Math.round(pos.y) },
          layer: activeLayer
        };
        console.log('Regular stamp to emit:', stamp);
        emitStampAdd(stamp);
        
        // スタンプ設置後にデフォルトモードに戻す
        setSelectedTool({ type: 'default' });
      }
    }
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing || selectedTool.type === 'default' || (selectedTool.type !== 'pen' && selectedTool.type !== 'eraser')) return;
    
    const stage = e.target.getStage();
    const point = stage?.getPointerPosition();
    
    if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') {
      console.error('Invalid pointer position during move:', point);
      return;
    }
    
    setCurrentPath(prev => [...prev, point.x, point.y]);
  };

  const handleMouseUp = () => {
    if (!isDrawing || selectedTool.type === 'default' || (selectedTool.type !== 'pen' && selectedTool.type !== 'eraser')) return;
    
    setIsDrawing(false);
    
    if (currentPath.length > 2) {
      const drawingData: DrawingData = {
        type: selectedTool.type === 'eraser' ? 'pen' : 'pen',
        points: currentPath,
        color: selectedTool.type === 'eraser' ? '#FFFFFF' : (selectedTool.color || '#000000'),
        strokeWidth: selectedTool.type === 'eraser' ? 20 : (selectedTool.strokeWidth || 2),
        layer: activeLayer
      };
      
      // Add to local store immediately
      addDrawing(drawingData);
      
      // Then emit to other users
      emitDrawingUpdate(drawingData);
    }
    
    setCurrentPath([]);
  };

  const handlePlayerDragEnd = (playerId: string, position: Position) => {
    // Update local state immediately
    movePlayer(playerId, position);
    
    // Then emit to other users
    emitPlayerMove(playerId, position);
  };

  const filteredDrawings = drawings.filter(d => d.layer === activeLayer);
  const filteredStamps = stamps.filter(s => s.layer === activeLayer);
  // Players should be visible on all layers
  const filteredPlayers = players;

  // カーソルスタイルを動的に決定
  const getCursorStyle = () => {
    switch (selectedTool.type) {
      case 'default':
        return 'default';
      case 'pen':
        return 'crosshair';
      case 'eraser':
        return 'cell';
      case 'frag':
      case 'smoke':
      case 'stun':
      case 'text':
        return 'copy';
      default:
        return 'default';
    }
  };

  return (
    <div className="w-full h-full bg-gray-50 overflow-hidden">
      <Stage
        width={stageSize.width}
        height={stageSize.height}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        ref={stageRef}
        style={{ cursor: getCursorStyle() }}
      >
        <Layer>
          {/* Background Map */}
          {mapBackground && mapImage && (
            <KonvaImage
              image={mapImage}
              width={stageSize.width}
              height={stageSize.height}
            />
          )}
          
          {/* Drawings */}
          {filteredDrawings.map((drawing, i) => (
            <Line
              key={i}
              points={drawing.points}
              stroke={drawing.color}
              strokeWidth={drawing.strokeWidth}
              tension={0.5}
              lineCap="round"
              globalCompositeOperation="source-over"
            />
          ))}
          
          {/* Current drawing path */}
          {isDrawing && currentPath.length > 2 && (
            <Line
              points={currentPath}
              stroke={selectedTool.type === 'eraser' ? '#FFFFFF' : (selectedTool.color || '#000000')}
              strokeWidth={selectedTool.type === 'eraser' ? 20 : (selectedTool.strokeWidth || 2)}
              tension={0.5}
              lineCap="round"
              globalCompositeOperation="source-over"
            />
          )}
          
          {/* Players */}
          {filteredPlayers.map((player) => (
            <PlayerToken
              key={player.id}
              player={player}
              onDragEnd={handlePlayerDragEnd}
            />
          ))}
          
          {/* Stamps */}
          {filteredStamps.map((stamp) => (
            <StampComponent
              key={stamp.id}
              stamp={stamp}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
};

export default Canvas;