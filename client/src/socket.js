import { io } from 'socket.io-client';

//export const socket = io('http://localhost:3001');

///*
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL;
//console.log(SOCKET_URL);

export const socket = io(SOCKET_URL, {
  path: '/socket.io',
  transports: ['websocket'],
  secure: true,
});

//*/
