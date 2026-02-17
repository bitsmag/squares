import { Socket } from 'socket.io';
import socketErrorHandler from '../middleware/socketErrorHandler';
import type { Match } from '../models/match';
import type { Player } from '../models/player';

type PlayerStatus = { pos: number | null; dir: string | null; doubleSpeed: boolean | null };
type Specials = { doubleSpeed: number[]; getPoints: number[] };
type ClearSquare = { id: number; color: string };
type Scores = Record<string, number | null>;

export function sendPlayerConnectedEvent(match: Match, player: Player): void {
  const data = {
    playerName: player.getName(),
    playerColor: player.getColor(),
    matchId: match.getId(),
  };
  for (let i = 0; i < match.getPlayers().length; i++) {
    if (match.getPlayers()[i].getName() != data.playerName) {
      match.getPlayers()[i].getSocket().emit('playerConnected', data);
    }
  }
}

export function sendPlayerDisconnectedEvent(match: Match, player: Player): void {
  const data = {
    playerName: player.getName(),
    playerColor: player.getColor(),
    matchId: match.getId(),
  };
  for (let i = 0; i < match.getPlayers().length; i++) {
    if (match.getPlayers()[i].getName() != data.playerName) {
      match.getPlayers()[i].getSocket().emit('playerDisconnected', data);
    }
  }
}

export function sendMatchCreatorDisconnectedEvent(match: Match): void {
  for (let i = 0; i < match.getPlayers().length; i++) {
    match.getPlayers()[i].getSocket().emit('matchCreatorDisconnected');
  }
}

export function sendPrepareMatchEvent(match: Match): void {
  const board = match.getBoard();
  const playersData: { playerName: string; playerColor: string }[] = [];

  const players = match.getPlayers();
  for (let i = 0; i < players.length; i++) {
    playersData[i] = {
      playerName: players[i].name,
      playerColor: players[i].color,
    };
  }

  const data = { players: playersData, board: board };
  for (let i = 0; i < players.length; i++) {
    players[i].getSocket().emit('prepareMatch', data);
  }
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
      playerStatuses[activeColors[i]].dir = match.getPlayerByColor(activeColors[i]).getActiveDirection();
      playerStatuses[activeColors[i]].doubleSpeed = match.getPlayerByColor(activeColors[i]).getDoubleSpeedSpecial();
    } catch (err) {
      socketErrorHandler(match, err, 'sendUpdateBoardEvent()');
    }
  }

  const data = {
    playerStatuses: playerStatuses,
    specials: specials,
    duration: match.getDuration(),
  };
  for (let i = 0; i < match.getPlayers().length; i++) {
    match.getPlayers()[i].getSocket().emit('updateBoard', data);
  }
}

export function sendClearSquaresEvent(match: Match, clearSquares: ClearSquare[], clearSpecials: number[]): void {
  const data = { clearSquares: clearSquares, clearSpecials: clearSpecials };
  for (let i = 0; i < match.getPlayers().length; i++) {
    match.getPlayers()[i].getSocket().emit('clearSquares', data);
  }
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
      socketErrorHandler(match, err, 'sendUpdateScoreEvent()');
    }
  }

  const data = { scores: scores };
  for (let i = 0; i < match.getPlayers().length; i++) {
    match.getPlayers()[i].getSocket().emit('updateScore', data);
  }
}

export function sendMatchEndEvent(match: Match): void {
  for (let i = 0; i < match.getPlayers().length; i++) {
    match.getPlayers()[i].getSocket().emit('matchEnd');
  }
}

export function sendCountdownEvent(match: Match): void {
  const data = { countdownDuration: match.getCountdownDuration() };
  for (let i = 0; i < match.getPlayers().length; i++) {
    match.getPlayers()[i].getSocket().emit('countdown', data);
  }
}

export function sendFatalErrorEvent(match: Match): void {
  for (let i = 0; i < match.getPlayers().length; i++) {
    try {
      match.getPlayers()[i].getSocket().emit('fatalError');
    } catch (e) {
      // ignore per-player emit errors
    }
  }
}

// CommonJS compatibility
module.exports = {
  sendPlayerConnectedEvent,
  sendPlayerDisconnectedEvent,
  sendMatchCreatorDisconnectedEvent,
  sendPrepareMatchEvent,
  sendUpdateBoardEvent,
  sendClearSquaresEvent,
  sendUpdateScoreEvent,
  sendMatchEndEvent,
  sendCountdownEvent,
  sendFatalErrorEvent,
} as any;
