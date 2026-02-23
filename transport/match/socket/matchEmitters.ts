import socketErrorHandler from '../../util/socket/socketErrorHandler';
import type { Match } from '../../../domain/models/match';
import type { Board } from '../../../domain/models/board';
import type { PlayerColor } from '../../../domain/models/colors';
import { broadcastToMatch } from '../../util/socket/transport';
import type { BoardDTO, PrepareMatchDTO, PrepareMatchPlayerDTO } from '../../../shared/dto/matchDtos';

type PlayerStatus = { pos: number | null; dir: string | null; doubleSpeed: boolean | null };
type Specials = { doubleSpeed: number[]; getPoints: number[] };
type ClearSquare = { id: number; color: PlayerColor };
type Scores = Record<PlayerColor, number | null>;

function toBoardDTO(board: Board): BoardDTO {
  return {
    width: board.width,
    height: board.height,
    squares: board.squares.map((sq) => ({
      id: sq.id,
      color: sq.color,
    })),
  };
}

export function sendPrepareMatchEvent(match: Match): void {
  const boardDto = toBoardDTO(match.board);
  const players: PrepareMatchPlayerDTO[] = [];
  for (let i = 0; i < match.players.length; i++) {
    players[i] = {
      playerName: match.players[i].name,
      playerColor: match.players[i].color,
    };
  }

  const data: PrepareMatchDTO = { players, board: boardDto };

  broadcastToMatch(match.id, '/matchSockets', 'prepareMatch', data);
}

export function sendUpdateBoardEvent(match: Match, specials: Specials): void {
  const playerStatuses: Record<PlayerColor, PlayerStatus> = {
    blue: { pos: null, dir: null, doubleSpeed: null },
    orange: { pos: null, dir: null, doubleSpeed: null },
    green: { pos: null, dir: null, doubleSpeed: null },
    red: { pos: null, dir: null, doubleSpeed: null },
  };
  const activeColors: PlayerColor[] = [];
  const players = match.players;
  for (let i = 0; i < players.length; i++) {
    activeColors.push(players[i].color);
  }
  for (let i = 0; i < activeColors.length; i++) {
    try {
      playerStatuses[activeColors[i]].pos = match.getPlayerByColor(activeColors[i]).position;
      playerStatuses[activeColors[i]].dir = match
        .getPlayerByColor(activeColors[i])
        .activeDirection;
      playerStatuses[activeColors[i]].doubleSpeed = match
        .getPlayerByColor(activeColors[i])
        .doubleSpeedSpecial;
    } catch (err) {
      socketErrorHandler(match, err);
    }
  }
  const data = {
    playerStatuses: playerStatuses,
    specials: specials,
    duration: match.duration,
  };

  broadcastToMatch(match.id, '/matchSockets', 'updateBoard', data);
}

export function sendClearSquaresEvent(
  match: Match,
  clearSquares: ClearSquare[],
  clearSpecials: number[]
): void {
  const data = { clearSquares: clearSquares, clearSpecials: clearSpecials };

  broadcastToMatch(match.id, '/matchSockets', 'clearSquares', data);
}

export function sendUpdateScoreEvent(match: Match): void {
  const scores: Scores = { blue: null, orange: null, green: null, red: null };

  const activeColors: PlayerColor[] = [];
  const players = match.players;
  for (let i = 0; i < players.length; i++) {
    activeColors.push(players[i].color);
  }

  for (let i = 0; i < activeColors.length; i++) {
    try {
      scores[activeColors[i]] = match.getPlayerByColor(activeColors[i]).score;
    } catch (err) {
      socketErrorHandler(match, err);
    }
  }

  const data = { scores: scores };

  broadcastToMatch(match.id, '/matchSockets', 'updateScore', data);
}

export function sendMatchEndEvent(match: Match): void {
  broadcastToMatch(match.id, '/matchSockets', 'matchEnd');
}

export function sendCountdownEvent(match: Match): void {
  const data = { countdownDuration: match.countdownDuration };

  broadcastToMatch(match.id, '/matchSockets', 'countdown', data);
}

export function sendFatalErrorEvent(match: Match): void {
  broadcastToMatch(match.id, '/matchSockets', 'fatalError');
}
