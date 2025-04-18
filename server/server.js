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
  },
  path: '/socket.io',
});

// Store rooms and users in-memory
const rooms = {};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('createRoom', (username, wizard, callback) => {
    const roomId = uuidv4().slice(0, 6).toUpperCase();
    rooms[roomId] = [];
    rooms[roomId].push({ id: socket.id, username, wizard, ready: false, hp: 100 });
    
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
    rooms[roomId].push({ id: socket.id, username, wizard, ready: false, hp: 100 });
    socket.join(roomId);
    console.log(`${username} joined room ${roomId}`);
    callback({ success: true, roomId });
  });

  socket.on('getEnemy', (roomId) => {
    const room = rooms[roomId];
    if (!room || room.length <= 1) { return; }

    const playerData = rooms[roomId].find(p => p.id === socket.id);
    const otherPlayer = rooms[roomId].find(p => p.id !== socket.id);

    //console.log(room);
    io.to(socket.id).emit('opponentInfo', otherPlayer);
    io.to(otherPlayer.id).emit('opponentInfo', playerData);
  });

  socket.on('setPlayerReady', (ready, roomId) => {
    const playerData = rooms[roomId].find(p => p.id === socket.id);
    const otherPlayer = rooms[roomId].find(p => p.id !== socket.id);
    playerData.ready = !ready;

    if (otherPlayer) {
      console.log(`Letting ${otherPlayer.username} know that ${playerData.username} is Ready: ${playerData.ready}`)
      io.to(otherPlayer.id).emit('opponentReady', playerData.ready);
  
      if (playerData.ready && otherPlayer.ready) {
        console.log(`Game for Room ${roomId} start!`)
        //io.to(room).emit('bothPlayersReady');
        io.to(socket.id).emit('bothPlayersReady', otherPlayer);
        io.to(otherPlayer.id).emit('bothPlayersReady', playerData);
      }
    }
  });

  socket.on('dealDmg', (roomId, dmg, selectedWizardId) => {
    const playerData = rooms[roomId].find(p => p.id === socket.id);
    const otherPlayer = rooms[roomId].find(p => p.id !== socket.id);

    otherPlayer.hp -= dmg;
    io.to(otherPlayer.id).emit('takeDmg', dmg, selectedWizardId);

    if (selectedWizardId === "nature-mage") { 
      playerData.hp += 10; 
    }

    console.log(`${otherPlayer.username} has ${otherPlayer.hp} left!`)
    if (otherPlayer.hp <= 0) {
      io.to(socket.id).emit('GameDone', playerData.username);
      io.to(otherPlayer.id).emit('GameDone', playerData.username);
    }
  });

  socket.on('recoil', (roomId) => {
    const playerData = rooms[roomId].find(p => p.id === socket.id);
    const otherPlayer = rooms[roomId].find(p => p.id !== socket.id);
    playerData.hp -= 10;
    console.log(`${playerData.username} has ${playerData.hp} left!`)
    if (playerData.hp <= 0) {
      io.to(socket.id).emit('GameDone');
      io.to(otherPlayer.id).emit('GameDone');
    }
  });

  socket.on('resetGame', (roomId) => {
    const playerData = rooms[roomId].find(p => p.id === socket.id);
    const otherPlayer = rooms[roomId].find(p => p.id !== socket.id);

    if (otherPlayer) { 
      otherPlayer.ready = false;
      otherPlayer.hp = 100;
      console.log(`${otherPlayer.username} is Ready: ${playerData.ready}`)
      io.to(otherPlayer.id).emit('opponentReady', false);
    }

    playerData.hp = 100;
    playerData.ready = false;
    console.log(`${playerData.username} is Ready: ${playerData.ready}`)
    io.to(playerData.id).emit('opponentReady', false);
  });

  socket.on('leave', (roomId) => {
    console.log(`User ${socket.id} left room ${roomId}`);

    const playerIndex = rooms[roomId].findIndex(p => p.id === socket.id);
    rooms[roomId].splice(playerIndex, 1); // remove player from room

    if (rooms[roomId].length > 0) {
      io.to(rooms[roomId][0].id).emit('playerLeft');
      console.log(`Leave: Only ${rooms[roomId].length} player (${rooms[roomId][0].username}) in room ${roomId}`);
    } else {
      delete rooms[roomId];
      console.log(`Leave: Room ${roomId} deleted`);
    }
  });

  // Handle disconnects
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    for (const [roomId, room] of Object.entries(rooms)) {
      const playerIndex = room.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        room.splice(playerIndex, 1); // remove player from room
        if (room.length > 0) {
          io.to(room[0].id).emit('playerLeft');
          console.log(`DC: Only ${room.length} player (${room[0].username}) in room ${roomId}`);
        } else {
          delete rooms[roomId];
          console.log(`DC: Room ${roomId} deleted`);
        }
        break;
      }
    }
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
