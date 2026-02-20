import socketErrorHandler from '../middleware/socketErrorHandler';
import type { Match } from '../../models/match';
import type { Player } from '../../models/player';
import { sessionStore } from '../../controllers/sockets/sessionStore';
import { getIo } from './io';

type PlayerStatus = { pos: number | null; dir: string | null; doubleSpeed: boolean | null };
type Specials = { doubleSpeed: number[]; getPoints: number[] };
type ClearSquare = { id: number; color: string };
type Scores = Record<string, number | null>;

export function sendPlayerConnectedEvent(match: Match, player: Player): void {
  const data = {
    matchId: match.getId(),
    players: [] as { playerName: string; playerColor: string }[],
  };
  for (let i = 0; i < match.getPlayers().length; i++) {
    data.players[i] = {
      playerName: match.getPlayers()[i].getName(),
      playerColor: match.getPlayers()[i].getColor(),
    };
  }
  const namespace = '/createMatchSockets';
  sessionStore.getSocketIdsForMatch(match.getId(), namespace).forEach((socketId) => {
    const io = getIo();
    const socket = io.of(namespace).sockets.get(socketId);
    if (socket) {
      socket.emit('playerConnected', data);
    } else {
      console.warn(
        'emit playerConnected: socket not found for id',
        socketId,
        'in namespace',
        namespace
      );
    }
  });
}

export function sendPlayerDisconnectedEvent(match: Match): void {
  const data = {
    matchId: match.getId(),
    players: [] as { playerName: string; playerColor: string }[],
  };
  for (let i = 0; i < match.getPlayers().length; i++) {
    data.players[i] = {
      playerName: match.getPlayers()[i].getName(),
      playerColor: match.getPlayers()[i].getColor(),
    };
  }
  const namespace = '/createMatchSockets';
  sessionStore.getSocketIdsForMatch(match.getId(), namespace).forEach((socketId) => {
    const io = getIo();
    const socket = io.of(namespace).sockets.get(socketId);
    if (socket) {
      socket.emit('playerDisconnected', data);
    } else {
      console.warn(
        'emit playerDisconnected: socket not found for id',
        socketId,
        'in namespace',
        namespace
      );
    }
  });
}

export function sendHostDisconnectedEvent(matchId: string): void {
  const namespace = '/createMatchSockets';
  sessionStore.getSocketIdsForMatch(matchId, namespace).forEach((socketId) => {
    const io = getIo();
    const socket = io.of(namespace).sockets.get(socketId);
    if (socket) {
      socket.emit('hostDisconnected');
    } else {
      console.warn(
        'emit hostDisconnected: socket not found for id',
        socketId,
        'in namespace',
        namespace
      );
    }
  });
}

export function sendMatchStartInitiationEvent(match: Match): void {
  const namespace = '/createMatchSockets';
  sessionStore.getSocketIdsForMatch(match.getId(), namespace).forEach((socketId) => {
    const io = getIo();
    const socket = io.of(namespace).sockets.get(socketId);
    if (socket) {
      socket.emit('matchStartInitiation');
    } else {
      console.warn(
        'emit matchStartInitiation: socket not found for id',
        socketId,
        'in namespace',
        namespace
      );
    }
  });
}

export function sendFatalErrorEvent(match: Match): void {
  const namespace = '/createMatchSockets';
  sessionStore.getSocketIdsForMatch(match.getId(), namespace).forEach((socketId) => {
    const io = getIo();
    const socket = io.of(namespace).sockets.get(socketId);
    if (socket) {
      socket.emit('fatalError');
    } else {
      console.warn('emit fatalError: socket not found for id', socketId, 'in namespace', namespace);
    }
  });
}

// CommonJS compatibility
