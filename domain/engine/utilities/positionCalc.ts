import type { Match } from '../../models/match';
import type { Board } from '../../models/board';
import type { Square } from '../../models/square';
import type { PlayerColor } from '../../models/colors';
import type { Direction } from '../../models/direction';
import type { RandomProvider } from './randomProvider';
import { DefaultRandomProvider } from './randomProvider';

export type PlayerPositions = Partial<Record<PlayerColor, number>>;

export function calculateNewPlayerPositions(
  match: Match,
  playerList: PlayerColor[],
  randomProvider: RandomProvider = DefaultRandomProvider
): PlayerPositions {
  const activeColors: PlayerColor[] = getActiveColors(match);

  const { currentPos, futurePos, hasPriority } = buildInitialPositions(
    match,
    activeColors,
    playerList
  );

  const losingColors = resolveCollisions(
    activeColors,
    currentPos,
    futurePos,
    hasPriority,
    randomProvider
  );

  applyLosingColors(losingColors, currentPos, futurePos);

  pruneNonMovingPlayers(futurePos, playerList);

  return futurePos;
}

function getActiveColors(match: Match): PlayerColor[] {
  const colors: PlayerColor[] = [];
  const players = match.players;
  for (let i = 0; i < players.length; i++) {
    colors.push(players[i].color as PlayerColor);
  }
  return colors;
}

function buildInitialPositions(
  match: Match,
  activeColors: PlayerColor[],
  playerList: PlayerColor[]
): {
  currentPos: Partial<Record<PlayerColor, number>>;
  futurePos: Partial<Record<PlayerColor, number>>;
  hasPriority: Partial<Record<PlayerColor, boolean>>;
} {
  const currentPos: Partial<Record<PlayerColor, number>> = {};
  const futurePos: Partial<Record<PlayerColor, number>> = {};
  const hasPriority: Partial<Record<PlayerColor, boolean>> = {};

  for (let i = 0; i < activeColors.length; i++) {
    const color = activeColors[i];
    const player = match.getPlayerByColor(color);
    currentPos[color] = player.position;
    futurePos[color] = calculateFuturePos(
      player.position,
      player.activeDirection,
      match.board,
      match
    );
    if (playerList.indexOf(color) === -1) {
      futurePos[color] = currentPos[color];
    }
    if (currentPos[color] === futurePos[color]) {
      hasPriority[color] = true;
    }
  }

  return { currentPos, futurePos, hasPriority };
}

function resolveCollisions(
  activeColors: PlayerColor[],
  currentPos: Partial<Record<PlayerColor, number>>,
  futurePos: Partial<Record<PlayerColor, number>>,
  hasPriority: Partial<Record<PlayerColor, boolean>>,
  randomProvider: RandomProvider
): PlayerColor[] {
  let losingColors: PlayerColor[] = [];

  // Multiple players attempting to move to the same square
  for (let i = 0; i < activeColors.length; i++) {
    for (let j = 0; j < activeColors.length; j++) {
      if (i !== j && futurePos[activeColors[i]] === futurePos[activeColors[j]]) {
        if (hasPriority[activeColors[i]]) {
          losingColors.push(activeColors[j]);
        } else if (hasPriority[activeColors[j]]) {
          losingColors.push(activeColors[i]);
        } else {
          const uniqueRandomNumbers = activeColors.reduce<Record<PlayerColor, number>>(
            (acc, color) => {
              acc[color] = randomProvider.next();
              return acc;
            },
            {} as Record<PlayerColor, number>
          );
          if (
            uniqueRandomNumbers[activeColors[i]] ===
            Math.max(uniqueRandomNumbers[activeColors[i]], uniqueRandomNumbers[activeColors[j]])
          ) {
            losingColors.push(activeColors[j]);
          } else {
            losingColors.push(activeColors[i]);
          }
        }
      }
    }
  }

  // Two players swapping positions
  for (let i = 0; i < activeColors.length; i++) {
    for (let j = 0; j < activeColors.length; j++) {
      if (
        i !== j &&
        futurePos[activeColors[i]] === currentPos[activeColors[j]] &&
        futurePos[activeColors[j]] === currentPos[activeColors[i]]
      ) {
        losingColors.push(activeColors[i]);
        losingColors.push(activeColors[j]);
      }
    }
  }

  // Deduplicate losing colors
  losingColors = losingColors.reduce<PlayerColor[]>((a, b) => {
    if (a.indexOf(b) < 0) a.push(b);
    return a;
  }, []);

  return losingColors;
}

function applyLosingColors(
  losingColors: PlayerColor[],
  currentPos: Partial<Record<PlayerColor, number>>,
  futurePos: Partial<Record<PlayerColor, number>>
): void {
  for (let i = 0; i < losingColors.length; i++) {
    const color = losingColors[i];
    futurePos[color] = currentPos[color];
  }
}

function pruneNonMovingPlayers(
  futurePos: Partial<Record<PlayerColor, number>>,
  playerList: PlayerColor[]
): void {
  (Object.keys(futurePos) as PlayerColor[]).forEach((color) => {
    if (playerList.indexOf(color) === -1) {
      delete futurePos[color];
    }
  });
}

function calculateFuturePos(
  currentPosition: number,
  activeDirection: Direction | null,
  board: Board,
  match: Match
): number {
  const square: Square = board.getSquare(currentPosition);
  if (square) {
    switch (activeDirection) {
      case 'left':
        if (square.position.x > 0) {
          return currentPosition - 1;
        } else {
          return currentPosition;
        }
      case 'up':
        if (square.position.y > 0) {
          return currentPosition - board.width;
        } else {
          return currentPosition;
        }
      case 'right':
        if (square.position.x < board.width - 1) {
          return currentPosition + 1;
        } else {
          return currentPosition;
        }
      case 'down':
        if (square.position.y < board.height - 1) {
          return currentPosition + board.width;
        } else {
          return currentPosition;
        }
      default:
        return currentPosition;
    }
  }
  return currentPosition;
}
