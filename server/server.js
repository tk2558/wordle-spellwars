// server/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // or specific frontend URL
    methods: ['GET', 'POST']
  }
});

// Store rooms and users in-memory
const rooms = {};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Create a new room and add the host player
  socket.on('createRoom', (username, wizard, callback) => {
    const roomId = uuidv4().slice(0, 6).toUpperCase();
    rooms[roomId] = [];
    rooms[roomId].push({ username, wizard, socketId: socket.id });
    socket.join(roomId);
    console.log(`${username} created room ${roomId}`);
    callback(roomId);
  });

  socket.on('joinRoom', (roomId, username, wizard, callback) => {
    const room = rooms[roomId];
    if (!room) {
      callback({ success: false, message: 'Room not found' });
      return;
    }
    if (room.length >= 2) {
      callback({ success: false, message: 'Room is full' });
      return;
    }

    // Add second player
    rooms[roomId].push({ username, wizard, socketId: socket.id });
    socket.join(roomId);
    console.log(`${username} joined room ${roomId}`);

    // Notify both players (or just callback the one who joined)
    callback({ success: true, roomId });
  });

  // Handle disconnects
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    // Clean up rooms where host or guest left
    for (const [roomId, room] of Object.entries(rooms)) {
      if (room.host.id === socket.id || (room.guest && room.guest.id === socket.id)) {
        io.to(roomId).emit('playerLeft');
        delete rooms[roomId];
        break;
      }
    }
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
