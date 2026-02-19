import socketErrorHandler from '../middleware/socketErrorHandler';
import type { Match } from '../../models/match';
import type { Player } from '../../models/player';

type PlayerStatus = { pos: number | null; dir: string | null; doubleSpeed: boolean | null };
type Specials = { doubleSpeed: number[]; getPoints: number[] };
type ClearSquare = { id: number; color: string };
type Scores = Record<string, number | null>;

export function sendPlayerConnectedEvent(match: Match, player: Player): void {
  const data = {matchId: match.getId(), players: [] as { playerName: string; playerColor: string }[]};
  
  for (let i = 0; i < match.getPlayers().length; i++) {
    data.players[i] = {
      playerName: match.getPlayers()[i].getName(),
      playerColor: match.getPlayers()[i].getColor(),
    };
  }
  
  for (let i = 0; i < match.getPlayers().length; i++) {
    const socket = match.getPlayers()[i].getSocket();
    if (socket) {
      socket.emit('playerConnected', data);
    }
  }
}

export function sendPlayerDisconnectedEvent(match: Match, player: Player): void {
  const data = {matchId: match.getId(), players: [] as { playerName: string; playerColor: string }[]};
  
  for (let i = 0; i < match.getPlayers().length; i++) {
    data.players[i] = {
      playerName: match.getPlayers()[i].getName(),
      playerColor: match.getPlayers()[i].getColor(),
    };
  }
  
  for (let i = 0; i < match.getPlayers().length; i++) {
    const socket = match.getPlayers()[i].getSocket();
    if (socket) {
      socket.emit('playerDisconnected', data);
    }
  }
}

export function sendHostDisconnectedEvent(match: Match): void {
  for (let i = 0; i < match.getPlayers().length; i++) {
    const socket = match.getPlayers()[i].getSocket();
    if (socket) {
      socket.emit('hostDisconnected');
    }
  }
}

export function sendMatchStartInitiationEvent(match: Match): void {
  for (let i = 0; i < match.getPlayers().length; i++) {
    const socket = match.getPlayers()[i].getSocket();
    if (socket) {
      socket.emit('matchStartInitiation');
    }
  }
}

export function sendFatalErrorEvent(match: Match): void {
  for (let i = 0; i < match.getPlayers().length; i++) {
    try {
      const player = match.getPlayers()[i];
      const socket = player?.getSocket();
      if (socket) {
        socket.emit('fatalError');
      }
    } catch (e) {
      // ignore per-player emit errors
    }
  }
}

// CommonJS compatibility
