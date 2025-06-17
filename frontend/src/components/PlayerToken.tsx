import React from 'react';
import { Group, Circle, Text } from 'react-konva';
import { Player, Position } from '../types';

interface PlayerTokenProps {
  player: Player;
  onDragEnd: (playerId: string, position: Position) => void;
}

const PlayerToken: React.FC<PlayerTokenProps> = ({ player, onDragEnd }) => {
  const handleDragEnd = (e: any) => {
    onDragEnd(player.id, {
      x: e.target.x(),
      y: e.target.y()
    });
  };

  const teamColor = player.team === 'red' ? '#ef4444' : '#3b82f6';
  const deadColor = '#6b7280';
  const currentColor = player.isDead ? deadColor : teamColor;

  return (
    <Group
      x={player.position.x}
      y={player.position.y}
      draggable
      onDragEnd={handleDragEnd}
    >
      {/* Player circle */}
      <Circle
        radius={20}
        fill={currentColor}
        stroke="#ffffff"
        strokeWidth={2}
        opacity={player.isDead ? 0.5 : 1}
      />
      
      {/* Player number */}
      <Text
        text={player.number.toString()}
        fontSize={14}
        fontStyle="bold"
        fill="#ffffff"
        width={40}
        height={40}
        align="center"
        verticalAlign="middle"
        offsetX={20}
        offsetY={20}
      />
      
      {/* Dead indicator */}
      {player.isDead && (
        <>
          <Text
            text="✕"
            fontSize={24}
            fill="#ffffff"
            width={40}
            height={40}
            align="center"
            verticalAlign="middle"
            offsetX={20}
            offsetY={20}
          />
        </>
      )}
    </Group>
  );
};

export default PlayerToken;