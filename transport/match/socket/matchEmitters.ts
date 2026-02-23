import socketErrorHandler from '../../util/socket/socketErrorHandler';
import type { Match } from '../../../domain/models/match';
import type { PlayerColor } from '../../../domain/models/colors';
import { broadcastToMatch } from '../../util/socket/transport';

type PlayerStatus = { pos: number | null; dir: string | null; doubleSpeed: boolean | null };
type Specials = { doubleSpeed: number[]; getPoints: number[] };
type ClearSquare = { id: number; color: PlayerColor };
type Scores = Record<PlayerColor, number | null>;

export function sendPrepareMatchEvent(match: Match): void {
  const board = match.getBoard();
  const playersData: { playerName: string; playerColor: PlayerColor }[] = [];
  const data = { players: playersData, board: board };
  for (let i = 0; i < match.getPlayers().length; i++) {
    data.players[i] = {
      playerName: match.getPlayers()[i].getName(),
      playerColor: match.getPlayers()[i].getColor(),
    };
  }

  broadcastToMatch(match.getId(), '/matchSockets', 'prepareMatch', data);
}

export function sendUpdateBoardEvent(match: Match, specials: Specials): void {
  const playerStatuses: Record<PlayerColor, PlayerStatus> = {
    blue: { pos: null, dir: null, doubleSpeed: null },
    orange: { pos: null, dir: null, doubleSpeed: null },
    green: { pos: null, dir: null, doubleSpeed: null },
    red: { pos: null, dir: null, doubleSpeed: null },
  };
  const activeColors: PlayerColor[] = [];
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

  broadcastToMatch(match.getId(), '/matchSockets', 'updateBoard', data);
}

export function sendClearSquaresEvent(
  match: Match,
  clearSquares: ClearSquare[],
  clearSpecials: number[]
): void {
  const data = { clearSquares: clearSquares, clearSpecials: clearSpecials };

  broadcastToMatch(match.getId(), '/matchSockets', 'clearSquares', data);
}

export function sendUpdateScoreEvent(match: Match): void {
  const scores: Scores = { blue: null, orange: null, green: null, red: null };

  const activeColors: PlayerColor[] = [];
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

  broadcastToMatch(match.getId(), '/matchSockets', 'updateScore', data);
}

export function sendMatchEndEvent(match: Match): void {
  broadcastToMatch(match.getId(), '/matchSockets', 'matchEnd');
}

export function sendCountdownEvent(match: Match): void {
  const data = { countdownDuration: match.getCountdownDuration() };

  broadcastToMatch(match.getId(), '/matchSockets', 'countdown', data);
}

export function sendFatalErrorEvent(match: Match): void {
  broadcastToMatch(match.getId(), '/matchSockets', 'fatalError');
}
