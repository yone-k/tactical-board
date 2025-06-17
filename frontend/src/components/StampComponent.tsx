import React from 'react';
import { Group, Circle, Text, Rect } from 'react-konva';
import { Stamp } from '../types';
import { useSocket } from '../hooks/useSocket';

interface StampComponentProps {
  stamp: Stamp;
}

const StampComponent: React.FC<StampComponentProps> = ({ stamp }) => {
  const { emitStampRemove } = useSocket();

  const handleRightClick = (e: any) => {
    e.evt.preventDefault();
    emitStampRemove(stamp.id);
  };

  const getStampContent = () => {
    switch (stamp.type) {
      case 'frag':
        return { symbol: '💣', color: '#ef4444', label: 'HE' };
      case 'smoke':
        return { symbol: '💨', color: '#6b7280', label: 'SMK' };
      case 'stun':
        return { symbol: '⚡', color: '#f59e0b', label: 'FB' };
      case 'text':
        return { symbol: stamp.content || 'T', color: '#3b82f6', label: stamp.content };
      default:
        return { symbol: '📍', color: '#8b5cf6', label: '?' };
    }
  };

  const content = getStampContent();

  return (
    <Group
      x={stamp.position.x}
      y={stamp.position.y}
      onContextMenu={handleRightClick}
    >
      {stamp.type === 'text' ? (
        <Group>
          <Rect
            width={content.label ? content.label.length * 8 + 16 : 32}
            height={24}
            fill={content.color}
            cornerRadius={4}
            offsetX={(content.label ? content.label.length * 8 + 16 : 32) / 2}
            offsetY={12}
          />
          <Text
            text={content.label || 'T'}
            fontSize={12}
            fontStyle="bold"
            fill="#ffffff"
            align="center"
            offsetX={(content.label ? content.label.length * 4 : 8)}
            offsetY={6}
          />
        </Group>
      ) : (
        <Group>
          <Circle
            radius={16}
            fill={content.color}
            stroke="#ffffff"
            strokeWidth={2}
          />
          <Text
            text={content.label}
            fontSize={10}
            fontStyle="bold"
            fill="#ffffff"
            width={32}
            height={32}
            align="center"
            verticalAlign="middle"
            offsetX={16}
            offsetY={16}
          />
        </Group>
      )}
    </Group>
  );
};

export default StampComponent;