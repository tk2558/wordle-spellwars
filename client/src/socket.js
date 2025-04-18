import { io } from 'socket.io-client';

export const socket = io('http://localhost:3001');

/*
export const socket = io('https://p5r11bzn-3001.use.devtunnels.ms', {
    path: '/socket.io',           
    transports: ['websocket'],    
    secure: true,                 
  });

*/
