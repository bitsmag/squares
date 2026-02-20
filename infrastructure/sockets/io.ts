import type { Server as SocketIOServer } from 'socket.io';
let ioInstance: SocketIOServer | null = null;
export function setIo(io: SocketIOServer) {
  ioInstance = io;
}
export function getIo(): SocketIOServer {
  if (!ioInstance) throw new Error('io not initialized');
  return ioInstance;
}
