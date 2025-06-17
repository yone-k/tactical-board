# Tactical Board - Web版

C# WPFで開発された戦術ボードアプリケーションのWeb版です。複数のユーザーがリアルタイムで同じキャンバスを共有・編集できます。

## 機能

- **チーム管理**: 赤・青各5人のプレイヤートークン
- **描画ツール**: 7色のペン、消しゴム機能
- **戦術要素**: グレネード（フラグ、スモーク、スタン）のスタンプ
- **レイヤーシステム**: 4つの独立したレイヤー
- **リアルタイム同期**: 複数ユーザーでの同時編集
- **マップ背景**: カスタムマップ画像の読み込み

## 技術スタック

### フロントエンド
- React + TypeScript
- Konva.js (キャンバス操作)
- Socket.io-client (リアルタイム通信)
- Tailwind CSS
- Zustand (状態管理)

### バックエンド
- Node.js + Express
- Socket.io
- Redis (セッション管理)
- PostgreSQL (データ永続化)

## 開発環境セットアップ

### 必要要件
- Docker & Docker Compose
- Node.js 18+

### 起動方法

1. リポジトリをクローン
```bash
git clone <repository-url>
cd tactical-board
```

2. Docker環境を起動
```bash
docker-compose up -d
```

3. ブラウザでアクセス
```
http://localhost
```

## 開発

### フロントエンド開発
```bash
cd frontend
npm install
npm start
```

### バックエンド開発
```bash
cd backend
npm install
npm run dev
```

## ポート

- フロントエンド: 3000
- バックエンド: 4000
- Redis: 6379
- PostgreSQL: 5432
- Nginx: 80