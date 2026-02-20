import socketErrorHandler from '../middleware/socketErrorHandler';
import type { Match } from '../../models/match';
import type { Player } from '../../models/player';
import { sessionStore } from '../../controllers/sockets/sessionStore';
import { getIo } from './io';

type PlayerStatus = { pos: number | null; dir: string | null; doubleSpeed: boolean | null };
type Specials = { doubleSpeed: number[]; getPoints: number[] };
type ClearSquare = { id: number; color: string };
type Scores = Record<string, number | null>;

export function sendPrepareMatchEvent(match: Match): void {
  const board = match.getBoard();
  const playersData: { playerName: string; playerColor: string }[] = [];
  const data = { players: playersData, board: board };

  const namespace = '/matchSockets';
  sessionStore.getSocketIdsForMatch(match.getId()).forEach((socketId) => {
    const io = getIo();
    const socket = io.of(namespace).sockets.get(socketId);
    if (socket) {
      socket.emit('prepareMatch', data);
    } else {
      console.warn(
        'emit prepareMatch: socket not found for id',
        socketId,
        'in namespace',
        namespace
      );
    }
  });
}

export function sendUpdateBoardEvent(match: Match, specials: Specials): void {
  const playerStatuses: Record<string, PlayerStatus> = {
    blue: { pos: null, dir: null, doubleSpeed: null },
    orange: { pos: null, dir: null, doubleSpeed: null },
    green: { pos: null, dir: null, doubleSpeed: null },
    red: { pos: null, dir: null, doubleSpeed: null },
  };
  const activeColors: string[] = [];
  const players = match.getPlayers();
  for (let i = 0; i < players.length; i++) {
    activeColors.push(players[i].getColor());
  }
  for (let i = 0; i < activeColors.length; i++) {
    try {
      playerStatuses[activeColors[i]].pos = match.getPlayerByColor(activeColors[i]).getPosition();
      playerStatuses[activeColors[i]].dir = match
        .getPlayerByColor(activeColors[i])
        .getActiveDirection();
      playerStatuses[activeColors[i]].doubleSpeed = match
        .getPlayerByColor(activeColors[i])
        .getDoubleSpeedSpecial();
    } catch (err) {
      socketErrorHandler(match, err);
    }
  }
  const data = {
    playerStatuses: playerStatuses,
    specials: specials,
    duration: match.getDuration(),
  };

  const namespace = '/matchSockets';
  sessionStore.getSocketIdsForMatch(match.getId()).forEach((socketId) => {
    const io = getIo();
    const socket = io.of(namespace).sockets.get(socketId);
    if (socket) {
      socket.emit('updateBoard', data);
    } else {
      console.warn(
        'emit updateBoard: socket not found for id',
        socketId,
        'in namespace',
        namespace
      );
    }
  });
}

export function sendClearSquaresEvent(
  match: Match,
  clearSquares: ClearSquare[],
  clearSpecials: number[]
): void {
  const data = { clearSquares: clearSquares, clearSpecials: clearSpecials };

  const namespace = '/matchSockets';
  sessionStore.getSocketIdsForMatch(match.getId()).forEach((socketId) => {
    const io = getIo();
    const socket = io.of(namespace).sockets.get(socketId);
    if (socket) {
      socket.emit('clearSquares', data);
    } else {
      console.warn(
        'emit clearSquares: socket not found for id',
        socketId,
        'in namespace',
        namespace
      );
    }
  });
}

export function sendUpdateScoreEvent(match: Match): void {
  const scores: Scores = { blue: null, orange: null, green: null, red: null };

  const activeColors: string[] = [];
  const players = match.getPlayers();
  for (let i = 0; i < players.length; i++) {
    activeColors.push(players[i].getColor());
  }

  for (let i = 0; i < activeColors.length; i++) {
    try {
      scores[activeColors[i]] = match.getPlayerByColor(activeColors[i]).getScore();
    } catch (err) {
      socketErrorHandler(match, err);
    }
  }

  const data = { scores: scores };

  const namespace = '/matchSockets';
  sessionStore.getSocketIdsForMatch(match.getId()).forEach((socketId) => {
    const io = getIo();
    const socket = io.of(namespace).sockets.get(socketId);
    if (socket) {
      socket.emit('updateScore', data);
    } else {
      console.warn(
        'emit updateScore: socket not found for id',
        socketId,
        'in namespace',
        namespace
      );
    }
  });
}

export function sendMatchEndEvent(match: Match): void {
  const namespace = '/matchSockets';
  sessionStore.getSocketIdsForMatch(match.getId()).forEach((socketId) => {
    const io = getIo();
    const socket = io.of(namespace).sockets.get(socketId);
    if (socket) {
      socket.emit('matchEnd');
    } else {
      console.warn('emit matchEnd: socket not found for id', socketId, 'in namespace', namespace);
    }
  });
}

export function sendCountdownEvent(match: Match): void {
  const data = { countdownDuration: match.getCountdownDuration() };

  const namespace = '/matchSockets';
  sessionStore.getSocketIdsForMatch(match.getId()).forEach((socketId) => {
    const io = getIo();
    const socket = io.of(namespace).sockets.get(socketId);
    if (socket) {
      socket.emit('countdown', data);
    } else {
      console.warn('emit countdown: socket not found for id', socketId, 'in namespace', namespace);
    }
  });
}

export function sendFatalErrorEvent(match: Match): void {
  const namespace = '/matchSockets';
  sessionStore.getSocketIdsForMatch(match.getId()).forEach((socketId) => {
    const io = getIo();
    const socket = io.of(namespace).sockets.get(socketId);
    if (socket) {
      socket.emit('fatalError');
    } else {
      console.warn('emit fatalError: socket not found for id', socketId, 'in namespace', namespace);
    }
  });
}
