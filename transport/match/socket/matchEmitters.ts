import socketErrorHandler from '../../util/socket/socketErrorHandler';
import type { Match } from '../../../domain/models/match';
import type { Board } from '../../../domain/models/board';
import type { PlayerColor } from '../../../domain/models/colors';
import { broadcastToMatch } from '../../util/socket/transport';
import type { PrepareMatchDTO, ClearSquaresDTO, UpdateBoardDTO, UpdateScoreDTO, CountdownDTO } from '../../../shared/dto/matchDtos';

export function sendPrepareMatchEvent(match: Match): void {
  const data = toPrepareMatchDTO(match.board, match.players);
  broadcastToMatch(match.id, '/matchSockets', 'prepareMatch', data);
}

export function sendUpdateBoardEvent(match: Match, specials: { doubleSpeed: number[]; getPoints: number[] }): void {
  const playerStatuses: UpdateBoardDTO['playerStatuses'] = {
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
      playerStatuses[activeColors[i]].dir = match.getPlayerByColor(activeColors[i]).activeDirection;
      playerStatuses[activeColors[i]].doubleSpeed = match.getPlayerByColor(activeColors[i]).doubleSpeedSpecial;
    } catch (err) {
      socketErrorHandler(match, err);
    }
  }
  const data: UpdateBoardDTO = {
    playerStatuses: playerStatuses,
    specials: specials,
    duration: match.duration,
  };

  broadcastToMatch(match.id, '/matchSockets', 'updateBoard', data);
}

export function sendClearSquaresEvent(match: Match, clearSquares: ClearSquaresDTO['clearSquares'], clearSpecials: number[]): void {
  const data: ClearSquaresDTO = { clearSquares: clearSquares, clearSpecials: clearSpecials };

  broadcastToMatch(match.id, '/matchSockets', 'clearSquares', data);
}

export function sendUpdateScoreEvent(match: Match): void {
  const scores: UpdateScoreDTO['scores'] = {
    blue: null,
    orange: null,
    green: null,
    red: null,
  };

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

  const data: UpdateScoreDTO = { scores: scores };

  broadcastToMatch(match.id, '/matchSockets', 'updateScore', data);
}

export function sendMatchEndEvent(match: Match): void {
  broadcastToMatch(match.id, '/matchSockets', 'matchEnd');
}

export function sendCountdownEvent(match: Match): void {
  const data: CountdownDTO = { countdownDuration: match.countdownDuration };

  broadcastToMatch(match.id, '/matchSockets', 'countdown', data);
}

function toPrepareMatchDTO(board: Board, players: Match['players']): PrepareMatchDTO {
  return {
    board: {
      width: board.width,
      height: board.height,
      squares: board.squares.map((sq) => ({
        id: sq.id,
        color: sq.color,
      })),
    },
    players: players.map((player) => ({
      playerName: player.name,
      playerColor: player.color,
    })),
  };
}
