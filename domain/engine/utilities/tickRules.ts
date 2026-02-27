import * as positionCalc from './positionCalc';
import * as circuitsCheck from './circuitsCheck';
import * as randomSpecials from './randomSpecials';
import type { Match } from '../../models/match';
import type { PlayerColor } from '../../models/colors';
import type { ClearedSquare, MatchSpecials } from '../matchEvents';
import type { PlayerPositions as RawPlayerPositions } from './positionCalc';

export type PlayerPositions = RawPlayerPositions;

export type TickResult = {
  specials: MatchSpecials;
  clearSquares: ClearedSquare[];
  clearSpecials: number[];
};

export function computeTick(match: Match, tickCount: number): TickResult {
  const movingColors = getMovingColorsForTick(match, tickCount);
  const playerPositions = calculatePlayerPositionsForTick(match, movingColors);
  const sanitizedPositions = sanitizePlayerPositions(playerPositions);
  applyPlayerPositions(match, sanitizedPositions);

  const playerPoints = calculatePlayerPoints(match);
  const { clearSquares, clearSpecials } = applyPointsAndSpecials(
    match,
    sanitizedPositions,
    playerPoints
  );

  const specials = applyRandomSpecials(match);
  return { specials, clearSquares, clearSpecials };
}

function getMovingColorsForTick(match: Match, tickCount: number): PlayerColor[] {
  const players = match.players;
  if (tickCount % 2 !== 0) {
    const activeColors: PlayerColor[] = [];
    for (let i = 0; i < players.length; i++) {
      activeColors.push(players[i].color as PlayerColor);
    }
    return activeColors;
  }

  const doubleSpeedColors: PlayerColor[] = [];
  for (let i = 0; i < players.length; i++) {
    if (players[i].doubleSpeedSpecial) {
      doubleSpeedColors.push(players[i].color as PlayerColor);
    }
  }
  return doubleSpeedColors;
}

function calculatePlayerPositionsForTick(
  match: Match,
  movingColors: PlayerColor[]
): PlayerPositions {
  return positionCalc.calculateNewPlayerPositions(match, movingColors);
}

function sanitizePlayerPositions(
  playerPositions: PlayerPositions
): Record<PlayerColor, number> {
  const sanitizedPositions: Record<PlayerColor, number> = {} as Record<PlayerColor, number>;
  (Object.keys(playerPositions) as PlayerColor[]).forEach((color) => {
    const pos = playerPositions[color];
    if (typeof pos === 'number') {
      sanitizedPositions[color] = pos;
    }
  });
  return sanitizedPositions;
}

function applyPlayerPositions(
  match: Match,
  sanitizedPositions: Record<PlayerColor, number>
): void {
  match.updatePlayers(sanitizedPositions);
  match.updateBoard(sanitizedPositions);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calculatePlayerPoints(match: Match): any {
  return circuitsCheck.getPlayerPoints(match);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyPointsAndSpecials(
  match: Match,
  sanitizedPositions: Record<PlayerColor, number>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  playerPoints: any
): { clearSquares: ClearedSquare[]; clearSpecials: number[] } {
  const clearSpecials: number[] = [];
  (Object.keys(sanitizedPositions) as PlayerColor[]).forEach((color) => {
    const playerPositionSquare = match.board.getSquare(sanitizedPositions[color]);
    if (playerPositionSquare.hasGetPointsSpecial) {
      for (let i = 0; i < match.board.squares.length; i++) {
        const square = match.board.squares[i];
        if (square.color === color) {
          playerPoints[color].push(square);
        }
      }
      playerPositionSquare.hasGetPointsSpecial = false;
      clearSpecials.push(playerPositionSquare.id);
    }
    if (playerPositionSquare.doubleSpeedSpecial) {
      match
        .getPlayerByColor(color)
        .startDoubleSpeedSpecial(match.board.doubleSpeedDuration);
      playerPositionSquare.doubleSpeedSpecial = false;
      clearSpecials.push(playerPositionSquare.id);
    }
  });

  (Object.keys(sanitizedPositions) as PlayerColor[]).forEach((color) => {
    match.getPlayerByColor(color).increaseScore(playerPoints[color].length);
  });

  const clearSquares: ClearedSquare[] = [];
  (Object.keys(sanitizedPositions) as PlayerColor[]).forEach((color) => {
    for (let i = 0; i < playerPoints[color].length; i++) {
      clearSquares.push({ id: playerPoints[color][i].id, color: color });
      playerPoints[color][i].color = '';
    }
  });

  return { clearSquares, clearSpecials };
}

function applyRandomSpecials(match: Match): MatchSpecials {
  const specials = randomSpecials.getSpecials(match);
  match.updateSpecials(specials);
  return specials;
}
