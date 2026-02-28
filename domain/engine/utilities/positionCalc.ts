import type { Match } from '../../entities/match';
import type { Board } from '../../entities/board';
import type { Square } from '../../entities/square';
import type { PlayerColor, Direction } from '../../valueObjects/valueObjects';
import type { RandomProvider } from './randomProvider';
import { DefaultRandomProvider } from './randomProvider';

// Map of player colors to their positions for this tick.
// Contains an entry for every active player color in the match.
export type PlayerPositions = Record<PlayerColor, number>;

export function calculateNewPlayerPositions(match: Match, movingColors: PlayerColor[], randomProvider: RandomProvider = DefaultRandomProvider): PlayerPositions {
  const nextPositionCandidates = determineNextPositionCandidates(match, movingColors);
  const nextPositions = resolvePositionCollisions(match, nextPositionCandidates, randomProvider);
  return nextPositions;
}

function getActiveColors(match: Match): PlayerColor[] {
  const colors: PlayerColor[] = [];
  const players = match.players;
  for (let i = 0; i < players.length; i++) {
    colors.push(players[i].color as PlayerColor);
  }
  return colors;
}

function determineNextPositionCandidates(match: Match, movingColors: PlayerColor[]): PlayerPositions {
  const nextPositions = {} as PlayerPositions;

  const activeColors = getActiveColors(match);

  for (let i = 0; i < activeColors.length; i++) {
    const color = activeColors[i];
    const player = match.getPlayerByColor(color);
    nextPositions[color] = calculateFuturePos(player.position, player.activeDirection, match.board, match);
    if (movingColors.indexOf(color) === -1) {
      nextPositions[color] = player.position;
    }
  }

  return nextPositions;
}

function getCurrentPositions(match: Match, activeColors: PlayerColor[]): PlayerPositions {
  const currentPositions = {} as PlayerPositions;

  for (let i = 0; i < activeColors.length; i++) {
    const color = activeColors[i];
    const player = match.getPlayerByColor(color);
    currentPositions[color] = player.position;
  }

  return currentPositions;
}

function resolvePositionCollisions(match: Match, nextPositionsCandidates: PlayerPositions, randomProvider: RandomProvider): PlayerPositions {
  const activeColors = getActiveColors(match);
  const currentPositions = getCurrentPositions(match, activeColors);

  const sameTargetLosers = findSameTargetCollisionLosers(activeColors, currentPositions, nextPositionsCandidates, randomProvider);
  const swapLosers = findSwapCollisionLosers(activeColors, currentPositions, nextPositionsCandidates);
  const losers = dedupeColors([...sameTargetLosers, ...swapLosers]);

  const nextPositions = resetNextPositionForLosers(currentPositions, nextPositionsCandidates, losers);
  return nextPositions;
}

function findSameTargetCollisionLosers(
  activeColors: PlayerColor[],
  currentPositions: PlayerPositions,
  nextPositionsCandidates: PlayerPositions,
  randomProvider: RandomProvider
): PlayerColor[] {
  const hasPriority: Record<PlayerColor, boolean> = {
    blue: false,
    orange: false,
    green: false,
    red: false,
  };

  for (let i = 0; i < activeColors.length; i++) {
    const color = activeColors[i];
    if (currentPositions[color] === nextPositionsCandidates[color]) {
      hasPriority[color] = true;
    }
  }

  const losingColors: PlayerColor[] = [];

  // Multiple players attempting to move to the same square
  for (let i = 0; i < activeColors.length; i++) {
    for (let j = 0; j < activeColors.length; j++) {
      if (i !== j && nextPositionsCandidates[activeColors[i]] === nextPositionsCandidates[activeColors[j]]) {
        if (hasPriority[activeColors[i]]) {
          losingColors.push(activeColors[j]);
        } else if (hasPriority[activeColors[j]]) {
          losingColors.push(activeColors[i]);
        } else {
          const uniqueRandomNumbers = activeColors.reduce<Record<PlayerColor, number>>((acc, color) => {
            acc[color] = randomProvider.next();
            return acc;
          }, {} as Record<PlayerColor, number>);
          if (uniqueRandomNumbers[activeColors[i]] === Math.max(uniqueRandomNumbers[activeColors[i]], uniqueRandomNumbers[activeColors[j]])) {
            losingColors.push(activeColors[j]);
          } else {
            losingColors.push(activeColors[i]);
          }
        }
      }
    }
  }

  return losingColors;
}

function findSwapCollisionLosers(activeColors: PlayerColor[], currentPositions: PlayerPositions, nextPositions: PlayerPositions): PlayerColor[] {
  const losingColors: PlayerColor[] = [];

  // Two players swapping positions
  for (let i = 0; i < activeColors.length; i++) {
    for (let j = 0; j < activeColors.length; j++) {
      if (i !== j && nextPositions[activeColors[i]] === currentPositions[activeColors[j]] && nextPositions[activeColors[j]] === currentPositions[activeColors[i]]) {
        losingColors.push(activeColors[i]);
        losingColors.push(activeColors[j]);
      }
    }
  }

  return losingColors;
}

function dedupeColors(colors: PlayerColor[]): PlayerColor[] {
  return colors.reduce<PlayerColor[]>((unique, color) => {
    if (unique.indexOf(color) < 0) {
      unique.push(color);
    }
    return unique;
  }, []);
}

function resetNextPositionForLosers(currentPositions: PlayerPositions, nextPositionsCandidates: PlayerPositions, losingColors: PlayerColor[]): PlayerPositions {
  const updatedPositions = { ...nextPositionsCandidates } as PlayerPositions;

  for (let i = 0; i < losingColors.length; i++) {
    const color = losingColors[i];
    updatedPositions[color] = currentPositions[color];
  }

  return updatedPositions;
}

function calculateFuturePos(currentPosition: number, activeDirection: Direction | null, board: Board, match: Match): number {
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
