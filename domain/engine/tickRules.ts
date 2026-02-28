import * as positionCalc from './utilities/positionCalc';
import * as circuitsCheck from './utilities/circuitsCheck';
import * as randomSpecials from './utilities/randomSpecials';
import type { Match } from '../models/match';
import type { PlayerColor } from '../models/colors';
import type { ClearedSquare, MatchSpecials } from './matchEvents';
import type { PlayerPositions } from './utilities/positionCalc';
import type { Square } from '../models/square';

export type TickResult = {
  specials: MatchSpecials;
  clearSquares: ClearedSquare[];
  clearSpecials: number[];
};

type PlayerSquaresByColor = Record<PlayerColor, Square[]>;
type GeneratedSpecialSquares = {
  getPoints: Square[];
  doubleSpeed: Square[];
};

export function computeTick(match: Match, tickCount: number): TickResult {
  // Update match stat according to new player positions
  const movingColors = determineMovingColors(match, tickCount);
  const playerPositions = determinePlayerPositions(match, movingColors);
  updatePlayerPositionsAndBoard(match, playerPositions);

  // Determine points earned
  const circuitPointsByPlayer = determineCircuitPoints(match);
  updatePlayerPoints(match, circuitPointsByPlayer);
  updateBoardClearSquares(match, circuitPointsByPlayer);

  const specialPointsByPlayer = determineSpecialPoints(match, playerPositions);
  updatePlayerPoints(match, specialPointsByPlayer);
  updateBoardClearSquares(match, specialPointsByPlayer);
  updateBoardRemoveSpecials(match, specialPointsByPlayer);

  // Determine specials collected
  const doubleSpeedSpecials = determineDoubleSpeedSpecial(match, playerPositions);
  updatePlayerSpecials(match, doubleSpeedSpecials);
  updateBoardRemoveSpecials(match, doubleSpeedSpecials);

  // Spawn new specials
  const generatedSpecials = generateRandomSpecials(match);
  updateBoardAddSpecials(match, generatedSpecials);

  // Map values to be returned in event
  const specials = buildSpecials(generatedSpecials);
  const clearSquares = buildClearSquares(circuitPointsByPlayer, specialPointsByPlayer);
  const clearSpecials = buildClearSpecials(specialPointsByPlayer, doubleSpeedSpecials);

  return { specials, clearSquares, clearSpecials };
}

function determineMovingColors(match: Match, tickCount: number): PlayerColor[] {
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

function determinePlayerPositions(match: Match, movingColors: PlayerColor[]): PlayerPositions {
  return positionCalc.calculateNewPlayerPositions(match, movingColors);
}

function updatePlayerPositionsAndBoard(match: Match, playerPositions: PlayerPositions): void {
  (Object.keys(playerPositions) as PlayerColor[]).forEach((color) => {
    const newPosition = playerPositions[color];
    const player = match.getPlayerByColor(color);
    if (player.position === newPosition) {
      return;
    }
    match.updatePlayer(color, newPosition);
  });
}

function determineCircuitPoints(match: Match): PlayerSquaresByColor {
  return circuitsCheck.getPlayerScoringSquares(match);
}

function determineSpecialPoints(match: Match, playerPositions: PlayerPositions): PlayerSquaresByColor {
  const specialPoints: PlayerSquaresByColor = {
    blue: [],
    orange: [],
    green: [],
    red: [],
  };

  (Object.keys(playerPositions) as PlayerColor[]).forEach((color) => {
    const position = playerPositions[color];
    const playerPositionSquare = match.board.getSquare(position);
    if (!playerPositionSquare || !playerPositionSquare.hasGetPointsSpecial) {
      return;
    }

    for (let i = 0; i < match.board.squares.length; i++) {
      const square = match.board.squares[i];
      if (square.color === color) {
        specialPoints[color].push(square);
      }
    }
  });

  return specialPoints;
}

function determineDoubleSpeedSpecial(match: Match, playerPositions: PlayerPositions): PlayerSquaresByColor {
  const appliedSquars: PlayerSquaresByColor = {
    blue: [],
    orange: [],
    green: [],
    red: [],
  };

  (Object.keys(playerPositions) as PlayerColor[]).forEach((color) => {
    const position = playerPositions[color];
    const playerPositionSquare = match.board.getSquare(position);
    if (!playerPositionSquare) {
      return;
    }
    if (playerPositionSquare.doubleSpeedSpecial) {
      appliedSquars[color].push(playerPositionSquare);
    }
  });
  return appliedSquars;
}

function updatePlayerSpecials(match: Match, appliedSquares: PlayerSquaresByColor): void {
  (Object.keys(appliedSquares) as PlayerColor[]).forEach((color) => {
    const squares = appliedSquares[color] ?? [];
    if (squares.length === 0) {
      return;
    }

    const player = match.getPlayerByColor(color);
    player.startDoubleSpeedSpecial(match.board.doubleSpeedDuration);
  });
}

function buildClearSpecials(...pointsGroups: PlayerSquaresByColor[]): number[] {
  const clearSpecials: number[] = [];

  pointsGroups.forEach((playerPoints) => {
    (Object.keys(playerPoints) as PlayerColor[]).forEach((color) => {
      const squares = playerPoints[color] ?? [];
      for (let i = 0; i < squares.length; i++) {
        clearSpecials.push(squares[i].id);
      }
    });
  });

  return clearSpecials;
}

function buildClearSquares(...pointsGroups: PlayerSquaresByColor[]): ClearedSquare[] {
  const clearSquares: ClearedSquare[] = [];

  pointsGroups.forEach((playerPoints) => {
    (Object.keys(playerPoints) as PlayerColor[]).forEach((color) => {
      const squares = playerPoints[color] ?? [];
      for (let i = 0; i < squares.length; i++) {
        const square = squares[i];
        clearSquares.push({ id: square.id, color: color });
      }
    });
  });

  return clearSquares;
}

function updatePlayerPoints(match: Match, playerPoints: PlayerSquaresByColor): void {
  match.players.forEach((player) => {
    const pointsForColor = playerPoints[player.color] ?? [];
    player.increaseScore(pointsForColor.length);
  });
}

function updateBoardClearSquares(match: Match, playerPoints: PlayerSquaresByColor): void {
  (Object.keys(playerPoints) as PlayerColor[]).forEach((color) => {
    const squares = playerPoints[color] ?? [];
    for (let i = 0; i < squares.length; i++) {
      const square = squares[i];
      square.color = '';
    }
  });
}

function updateBoardRemoveSpecials(match: Match, playerPoints: PlayerSquaresByColor): void {
  (Object.keys(playerPoints) as PlayerColor[]).forEach((color) => {
    const squares = playerPoints[color] ?? [];
    for (let i = 0; i < squares.length; i++) {
      const square = squares[i];
      if (square.hasGetPointsSpecial) {
        square.hasGetPointsSpecial = false;
      }
      if (square.doubleSpeedSpecial) {
        square.doubleSpeedSpecial = false;
      }
    }
  });
}

function generateRandomSpecials(match: Match): GeneratedSpecialSquares {
  const specials = randomSpecials.getSpecials(match);

  const getPoints: Square[] = [];
  const doubleSpeed: Square[] = [];

  for (let i = 0; i < specials.getPoints.length; i++) {
    const square = match.board.getSquare(specials.getPoints[i]);
    if (square) {
      getPoints.push(square);
    }
  }

  for (let i = 0; i < specials.doubleSpeed.length; i++) {
    const square = match.board.getSquare(specials.doubleSpeed[i]);
    if (square) {
      doubleSpeed.push(square);
    }
  }

  return { getPoints, doubleSpeed };
}

function updateBoardAddSpecials(match: Match, generated: GeneratedSpecialSquares): void {
  const specials: MatchSpecials = {
    getPoints: generated.getPoints.map((s) => s.id),
    doubleSpeed: generated.doubleSpeed.map((s) => s.id),
  };
  match.updateSpecials(specials);
}

function buildSpecials(generated: GeneratedSpecialSquares): MatchSpecials {
  return {
    getPoints: generated.getPoints.map((s) => s.id),
    doubleSpeed: generated.doubleSpeed.map((s) => s.id),
  };
}
