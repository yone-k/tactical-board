# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Tactical Board web application - a collaborative real-time drawing and strategy planning tool. It's a web version of an original C# WPF application, built with modern web technologies following a microservices architecture.

## Tech Stack

**Frontend**: React 18, TypeScript, Vite, Konva.js, Socket.io-client, Zustand, Tailwind CSS
**Backend**: Node.js, Express, TypeScript, Socket.io, Redis, PostgreSQL
**Infrastructure**: Docker, Docker Compose, Nginx

## Common Development Commands

### Full Stack Development (Recommended)
```bash
# Start all services with Docker
docker-compose up

# Services will be available at:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:4000
# - Nginx proxy: http://localhost:80
```

### Frontend Development
```bash
cd frontend
npm install
npm start          # Start dev server (port 3000)
npm run build      # Build for production
npm run lint       # Run ESLint
npm run typecheck  # Check TypeScript types
npm test           # Run tests with Vitest
```

### Backend Development
```bash
cd backend
npm install
npm run dev        # Start dev server with hot reload (port 4000)
npm run build      # Compile TypeScript
npm run lint       # Run ESLint
npm run typecheck  # Check TypeScript types
npm test           # Run tests with Jest
```

## Architecture Overview

### Frontend Structure
- **Entry Point**: `frontend/src/App.tsx` - Router setup with HomePage and BoardPage
- **State Management**: `frontend/src/store/useBoardStore.ts` - Zustand store for all board state
- **WebSocket Hook**: `frontend/src/hooks/useSocket.ts` - Manages real-time connection
- **Main Canvas**: `frontend/src/components/Canvas.tsx` - Konva-based drawing surface
- **Routes**: Home (room creation/joining) and Board (main tactical interface)

### Backend Structure
- **Server Entry**: `backend/src/index.ts` - Express server with middleware setup
- **WebSocket Handler**: `backend/src/socket/socketHandler.ts` - Main event handling
- **Room Manager**: `backend/src/socket/roomManager.ts` - Room lifecycle management
- **State Manager**: `backend/src/socket/boardStateManager.ts` - Redis-based state persistence
- **API Routes**: `/api/rooms/*` for room operations, `/api/maps/*` for map uploads

### Data Flow
1. User actions trigger local state updates in Zustand store
2. Changes emit WebSocket events to server
3. Server broadcasts to all room participants
4. Other clients receive updates and sync their state
5. Board state persisted in Redis (24-hour TTL)

### Key Features Implementation
- **Teams**: Red and Blue teams with 5 players each (stored as player objects)
- **Drawing**: Multi-color pen system with drawing data stored as paths
- **Stamps**: Grenade stamps (frag, smoke, stun) with position data
- **Layers**: 4 independent layers (0-3) for tactical organization
- **Maps**: Custom background images uploaded via multipart form

## Important Patterns

### Type Sharing
Both frontend and backend define identical types in their respective `types/` directories. Key shared types:
- `User`: Connected user with id, username, socketId
- `Room`: Room state with users and board data
- `Player`: Team player with position and layer
- `DrawingData`: Path data for pen strokes
- `Stamp`: Grenade stamp with type and position
- `BoardState`: Complete board state including all elements

### WebSocket Events
Common socket events to be aware of:
- `join-room`: User joins a room
- `board-update`: Any board state change
- `user-joined`/`user-left`: User presence
- `clear-board`: Reset board state
- `error`: Error handling

### State Persistence
- Room states stored in Redis with key pattern: `room:{roomId}`
- Board states stored with key pattern: `board:{roomId}`
- Automatic cleanup when last user leaves room

## Testing Approach
- Frontend uses Vitest for unit tests
- Backend uses Jest for unit tests
- No e2e tests currently configured
- Always run lint and typecheck before committing

## Environment Variables
All defined in `docker-compose.yml`:
- Frontend: `REACT_APP_API_URL`, `REACT_APP_WS_URL`
- Backend: `NODE_ENV`, `PORT`, `REDIS_URL`, `DATABASE_URL`

Create local `.env` files if running without Docker.