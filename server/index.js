const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const rooms = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('create_room', ({ playerName }) => {
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();

        const newRoom = {
            id: roomId,
            players: [{ id: socket.id, name: playerName || 'Host', score: 0 }],
            gameState: 'waiting',
            winner: null,
            readyPlayers: new Set()
        };

        rooms.set(roomId, newRoom);
        socket.join(roomId);

        socket.emit('room_created', roomId);
        io.to(roomId).emit('player_update', newRoom.players);
        console.log(`Room created: ${roomId} by ${playerName} (${socket.id})`);
    });


    socket.on('join_room', (data) => {
        // Handle both string (old) and object (new) payload for backward compat if needed,
        // but we will update client to always send object.
        const roomId = typeof data === 'string' ? data : data.roomId;
        const playerName = typeof data === 'string' ? 'Player' : (data.playerName || 'Guest');

        if (rooms.has(roomId)) {
            const room = rooms.get(roomId);

            // Validating if the game was finished, if so reset needed variables to play again
            if (room.gameState === 'finished') {
                room.gameState = 'waiting';
                room.winner = null;
                room.readyPlayers = new Set();
            }

            // Initialize score if not present (backward compat or new logic)
            // This logic should ideally be applied when a room is created or a player joins.
            // Moving it here to ensure scores are initialized for existing players.
            if (room.players.length > 0 && room.players[0].score === undefined) {
                room.players.forEach(p => p.score = 0);
            }

            // Check if already in room
            const existingPlayer = room.players.find(p => p.id === socket.id);
            if (existingPlayer) {
                // Update name if provided?
                if (data.playerName) existingPlayer.name = data.playerName;
                io.to(roomId).emit('player_update', room.players);

                // CRITICAL FIX: Tell the re-joining client we are good to go
                socket.emit('player_joined', { playerCount: room.players.length });
                console.log(`${playerName} (${socket.id}) re-joined room ${roomId}`);
            } else if (room.players.length < 2) { // Assuming max 2 players per room
                const newPlayer = { id: socket.id, name: playerName, score: 0 };
                room.players.push(newPlayer);
                socket.join(roomId);
                io.to(roomId).emit('player_update', room.players);
                socket.emit('player_joined', { playerCount: room.players.length });
                console.log(`${playerName} (${socket.id}) joined room ${roomId}`);
            } else {
                socket.emit('error', 'Room is full');
            }
        } else {
            // Create new room if it doesn't exist
            const newRoom = {
                id: roomId,
                players: [{ id: socket.id, name: playerName, score: 0 }],
                gameState: 'waiting', // 'waiting', 'playing', 'finished'
                winner: null,
                readyPlayers: new Set()
            };
            rooms.set(roomId, newRoom);
            socket.join(roomId);
            socket.emit('room_created', roomId); // Inform the creator
            io.to(roomId).emit('player_update', newRoom.players);
            socket.emit('player_joined', { playerCount: newRoom.players.length });
            console.log(`Room created: ${roomId} by ${playerName} (${socket.id})`);
        }
    });

    socket.on('start_game', (roomId) => {
        console.log(`Starting game in room ${roomId}`);
        io.to(roomId).emit('game_started');
    });

    socket.on('player_ready', ({ roomId, board }) => {
        const room = rooms.get(roomId);
        if (room) {
            // Track ready state
            if (!room.readyPlayers) room.readyPlayers = new Set();
            room.readyPlayers.add(socket.id);

            console.log(`Player ${socket.id} ready in ${roomId}. Total ready: ${room.readyPlayers.size}/${room.players.length}`);

            if (room.players.length === 2 && room.readyPlayers.size === 2) {
                console.log(`All players ready in ${roomId}. Starting match.`);
                io.to(roomId).emit('match_start');
                // Reset ready players for next game
                room.readyPlayers.clear();
            }
        }
    });

    socket.on('make_move', ({ roomId, number, win }) => {
        console.log(`Move in ${roomId}: ${number} (Win claim: ${win})`);
        // Broadcast move to everyone in room (including sender, or just opponent)
        // Using io.to(roomId) sends to everyone
        io.to(roomId).emit('number_selected', { number, playerId: socket.id });

        if (win) {
            const room = rooms.get(roomId);
            if (room && !room.winner) {
                room.winner = socket.id;
                room.gameState = 'finished';

                // Increment score
                const winnerPlayer = room.players.find(p => p.id === socket.id);
                if (winnerPlayer) {
                    winnerPlayer.score = (winnerPlayer.score || 0) + 1;
                }

                io.to(roomId).emit('game_over', {
                    winner: socket.id,
                    leaderboard: room.players.map(p => ({ name: p.name, score: p.score || 0 }))
                });
            }
        }
    });

    socket.on('bingo_win', ({ roomId }) => {
        const room = rooms.get(roomId);
        if (room && !room.winner) {
            room.winner = socket.id;
            room.gameState = 'finished';

            // Increment score
            const winnerPlayer = room.players.find(p => p.id === socket.id);
            if (winnerPlayer) {
                winnerPlayer.score = (winnerPlayer.score || 0) + 1;
            }

            io.to(roomId).emit('game_over', {
                winner: socket.id,
                leaderboard: room.players.map(p => ({ name: p.name, score: p.score || 0 }))
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        rooms.forEach((value, key) => {
            const playerIndex = value.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1) {
                // Remove player
                value.players.splice(playerIndex, 1);
                // Remove from readyPlayers if exists
                if (value.readyPlayers) value.readyPlayers.delete(socket.id);

                io.to(key).emit('player_left', socket.id);
                io.to(key).emit('player_update', value.players);

                if (value.players.length === 0) {
                    rooms.delete(key);
                    console.log(`Room ${key} deleted (empty)`);
                } else {
                    console.log(`Player left room ${key}. Remaining: ${value.players.length}`);
                }
            }
        });
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
