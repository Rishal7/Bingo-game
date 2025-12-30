# Bingo Game

A real-time multiplayer Bingo game built with modern web technologies. This application allows players to create or join rooms, play against each other in real-time, and experience a dynamic, interactive Bingo board with live updates.

## Features

- **Real-Time Multiplayer**: Play with friends instantly using Socket.io.
- **PvP Gameplay**: Compete head-to-head in game rooms.
- **Interactive UI**: Smooth animations and responsive design powered by Framer Motion and Tailwind CSS.
- **Win Celebrations**: Fun confetti effects upon winning.
- **Room Management**: Easy system to create or join existing game rooms.

## Tech Stack

### Client (Frontend)

- **Framework**: React (Vite)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, clsx, tailwind-merge
- **Animations**: Framer Motion, canvas-confetti
- **State & Routing**: @tanstack/react-query, @tanstack/react-router
- **Communication**: Socket.io-client

### Server (Backend)

- **Runtime**: Node.js
- **Framework**: Express
- **Real-Time Engine**: Socket.io
- **Dev Tools**: Nodemon

## Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd bingo-game
   ```

2. **Install Server Dependencies**

   ```bash
   cd server
   npm install
   ```

3. **Install Client Dependencies**
   ```bash
   cd ../client
   npm install
   ```

## Running the Application

You need to run both the server and the client concurrently.

### 1. Start the Server

Open a terminal directory and run:

```bash
cd server
npm run dev
# Server usually runs on http://localhost:3000 (or configured port)
```

### 2. Start the Client

Open a second terminal window and run:

```bash
cd client
npm run dev
# Client is typically hosted at http://localhost:5173
```

Open your browser and navigate to the client URL to start playing!

## How to Play

1. Enter your player name.
2. Choose to **Create a Room** (to host) or **Join a Room** (with a code).
3. If creating, share the Room Code with your friend.
4. Once connected, mark your numbers as they are called (or play strategically depending on the game variant).
5. The first player to complete the Bingo pattern wins!
