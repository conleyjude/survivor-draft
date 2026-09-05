import { io } from 'socket.io-client';

// Shared draft room socket — connects to the same origin the app is served from
export const socket = io({ autoConnect: false });
