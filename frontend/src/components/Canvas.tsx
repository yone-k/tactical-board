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
    addStamp
  } = useBoardStore();
  
  const { emitDrawingUpdate, emitPlayerMove, emitStampAdd } = useSocket();

  const [stageSize, setStageSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight - 120 // Account for toolbar and header
  });

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
    if (selectedTool.type === 'pen') {
      setIsDrawing(true);
      const pos = e.target.getStage().getPointerPosition();
      setCurrentPath([pos.x, pos.y]);
    } else if (['frag', 'smoke', 'stun'].includes(selectedTool.type)) {
      const pos = e.target.getStage().getPointerPosition();
      const stamp = {
        type: selectedTool.type as 'frag' | 'smoke' | 'stun',
        position: { x: pos.x, y: pos.y },
        layer: activeLayer
      };
      
      // Note: We need to wait for server to assign ID, so we don't add to local store here
      emitStampAdd(stamp);
    }
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing || selectedTool.type !== 'pen') return;
    
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    setCurrentPath(prev => [...prev, point.x, point.y]);
  };

  const handleMouseUp = () => {
    if (!isDrawing || selectedTool.type !== 'pen') return;
    
    setIsDrawing(false);
    
    if (currentPath.length > 2) {
      const drawingData: DrawingData = {
        type: 'pen',
        points: currentPath,
        color: selectedTool.color || '#000000',
        strokeWidth: selectedTool.strokeWidth || 2,
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
  const filteredPlayers = players.filter(p => p.layer === activeLayer);

  return (
    <div className="w-full h-full bg-gray-50 overflow-hidden">
      <Stage
        width={stageSize.width}
        height={stageSize.height}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        ref={stageRef}
      >
        <Layer>
          {/* Background Map */}
          {mapBackground && (
            <KonvaImage
              image={undefined} // Will be implemented with proper image loading
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
              stroke={selectedTool.color || '#000000'}
              strokeWidth={selectedTool.strokeWidth || 2}
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