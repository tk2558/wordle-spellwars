import { io } from 'socket.io-client';

//export const socket = io('http://localhost:3001');

///*
export const socket = io('https://p5r11bzn-3001.use.devtunnels.ms', {
    path: '/socket.io',           // Ensure proper socket.io path (default but good to be explicit)
    transports: ['websocket'],    // Force WebSocket (helps with stability)
    secure: true,                 // Important for HTTPS tunnels
  });

//*/
