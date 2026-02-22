import type { Server as SocketIOServer } from 'socket.io';
import { sessionStore } from './socketSessionStore';

let ioInstance: SocketIOServer | null = null;
export function initTransport(io: SocketIOServer): void {
  ioInstance = io;
}

export function sendToSocketId(
  namespace: string,
  socketId: string,
  event: string,
  payload?: unknown
): void {
  try {
    const io = ioInstance;
    if (!io) {
      console.warn('transport: io not initialized');
      return;
    }
    const nsp = io.of(namespace);
    const socket = nsp.sockets.get(socketId);
    if (socket) {
      socket.emit(event, payload);
    } else {
      console.warn('transport: socket not found for id', socketId, 'in namespace', namespace);
    }
  } catch (err) {
    console.warn('transport error sending to socket', socketId, err);
  }
}

export function broadcastToMatch(
  matchId: string,
  namespace: string,
  event: string,
  payload?: unknown
): void {
  const socketIds = sessionStore.getSocketIdsForMatch(matchId, namespace);
  for (const id of socketIds) {
    sendToSocketId(namespace, id, event, payload);
  }
}

export default { initTransport, sendToSocketId, broadcastToMatch };
