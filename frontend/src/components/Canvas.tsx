import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Line, Circle, Text, Image as KonvaImage } from 'react-konva';
import { useBoardStore } from '../store/useBoardStore';
import { useSocket } from '../hooks/useSocket';
import { Position, DrawingData } from '../types';
import PlayerToken from './PlayerToken';
import StampComponent from './StampComponent';

// ヘルパー関数: 点がパスの近くにあるかを判定
const isPointNearPath = (point: Position, pathPoints: number[], threshold: number): boolean => {
  if (pathPoints.length < 4) return false; // 最低限のパス（2点）が必要
  
  for (let i = 0; i < pathPoints.length - 2; i += 2) {
    const x1 = pathPoints[i];
    const y1 = pathPoints[i + 1];
    const x2 = pathPoints[i + 2];
    const y2 = pathPoints[i + 3];
    
    // 線分への最短距離を計算
    const distance = distanceToLineSegment(point, { x: x1, y: y1 }, { x: x2, y: y2 });
    if (distance <= threshold) {
      return true;
    }
  }
  return false;
};

// 点から線分への最短距離を計算
const distanceToLineSegment = (point: Position, lineStart: Position, lineEnd: Position): number => {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  
  if (lenSq === 0) {
    // 線分の長さが0の場合（点）
    return Math.sqrt(A * A + B * B);
  }
  
  let param = dot / lenSq;
  
  let xx, yy;
  
  if (param < 0) {
    xx = lineStart.x;
    yy = lineStart.y;
  } else if (param > 1) {
    xx = lineEnd.x;
    yy = lineEnd.y;
  } else {
    xx = lineStart.x + param * C;
    yy = lineStart.y + param * D;
  }
  
  const dx = point.x - xx;
  const dy = point.y - yy;
  return Math.sqrt(dx * dx + dy * dy);
};

const Canvas: React.FC = () => {
  const stageRef = useRef<any>(null);
  const [tool, setTool] = useState<string>('pen');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<number[]>([]);
  const [isErasing, setIsErasing] = useState(false);
  const [eraserPath, setEraserPath] = useState<number[]>([]);
  
  const {
    players,
    drawings,
    stamps,
    activeLayer,
    selectedTool,
    mapBackground,
    addDrawing,
    removeDrawing,
    movePlayer,
    addStamp,
    setSelectedTool
  } = useBoardStore();
  
  const { emitDrawingUpdate, emitDrawingRemove, emitPlayerMove, emitStampAdd } = useSocket();

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
    
    if (selectedTool.type === 'pen') {
      setIsDrawing(true);
      const stage = e.target.getStage();
      const pos = stage?.getPointerPosition();
      
      if (!pos || typeof pos.x !== 'number' || typeof pos.y !== 'number') {
        console.error('Invalid pointer position for drawing:', pos);
        setIsDrawing(false);
        return;
      }
      
      setCurrentPath([pos.x, pos.y]);
    } else if (selectedTool.type === 'eraser') {
      // 消しゴムモード: ドラッグで一括削除
      setIsErasing(true);
      const stage = e.target.getStage();
      const pos = stage?.getPointerPosition();
      
      if (!pos || typeof pos.x !== 'number' || typeof pos.y !== 'number') {
        console.error('Invalid pointer position for eraser:', pos);
        setIsErasing(false);
        return;
      }
      
      setEraserPath([pos.x, pos.y]);
      
      // 最初のクリック位置でも削除を実行
      checkAndRemoveDrawings(pos);
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
        emitStampAdd(stamp);
        
        // スタンプ設置後にデフォルトモードに戻す
        setSelectedTool({ type: 'default' });
      }
    }
  };

  const handleMouseMove = (e: any) => {
    if (selectedTool.type === 'default') return;
    
    const stage = e.target.getStage();
    const point = stage?.getPointerPosition();
    
    if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') {
      console.error('Invalid pointer position during move:', point);
      return;
    }
    
    if (isDrawing && selectedTool.type === 'pen') {
      setCurrentPath(prev => [...prev, point.x, point.y]);
    } else if (isErasing && selectedTool.type === 'eraser') {
      setEraserPath(prev => [...prev, point.x, point.y]);
      
      // ドラッグ中に通過した描画オブジェクトを削除
      checkAndRemoveDrawings(point);
    }
  };

  const handleMouseUp = () => {
    if (selectedTool.type === 'default') return;
    
    if (isDrawing && selectedTool.type === 'pen') {
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
    } else if (isErasing && selectedTool.type === 'eraser') {
      setIsErasing(false);
      setEraserPath([]);
    }
  };

  // 描画削除のヘルパー関数
  const checkAndRemoveDrawings = (point: Position) => {
    const currentLayerDrawings = drawings.filter(d => d.layer === activeLayer);
    const threshold = 15; // 消しゴムの許容範囲（ピクセル）
    
    for (const drawing of currentLayerDrawings) {
      if (drawing.id && isPointNearPath(point, drawing.points, threshold)) {
        removeDrawing(drawing.id);
        // WebSocketで他のユーザーにも削除を通知
        emitDrawingRemove(drawing.id);
      }
    }
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
        return 'not-allowed';
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
          {isDrawing && currentPath.length > 2 && selectedTool.type === 'pen' && (
            <Line
              points={currentPath}
              stroke={selectedTool.color || '#000000'}
              strokeWidth={selectedTool.strokeWidth || 2}
              tension={0.5}
              lineCap="round"
              globalCompositeOperation="source-over"
            />
          )}
          
          {/* Eraser path visualization */}
          {isErasing && eraserPath.length > 2 && selectedTool.type === 'eraser' && (
            <Line
              points={eraserPath}
              stroke="rgba(255, 0, 0, 0.5)"
              strokeWidth={30}
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