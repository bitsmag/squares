import type { Match } from '../../models/match';
import type { Board } from '../../models/board';
import type { Square } from '../../models/square';
import type { PlayerColor } from '../../models/colors';
import type { Direction } from '../../models/direction';

export type PlayerPositions = Partial<Record<PlayerColor, number>>;

export function calculateNewPlayerPositions(
  match: Match,
  playerList: PlayerColor[]
): PlayerPositions {
  const activeColors: PlayerColor[] = [];
  const players = match.players;
  for (let i = 0; i < players.length; i++) {
    activeColors.push(players[i].color as PlayerColor);
  }

  const currentPos: Partial<Record<PlayerColor, number>> = {};
  const futurePos: Partial<Record<PlayerColor, number>> = {};
  const prio: Partial<Record<PlayerColor, boolean>> = {};

  for (let i = 0; i < activeColors.length; i++) {
    const player = match.getPlayerByColor(activeColors[i]);
    currentPos[activeColors[i]] = player.position;
    futurePos[activeColors[i]] = calculateFuturePos(
      player.position,
      player.activeDirection,
      match.board,
      match
    );
    if (playerList.indexOf(activeColors[i]) === -1) {
      futurePos[activeColors[i]] = currentPos[activeColors[i]];
    }
    if (currentPos[activeColors[i]] === futurePos[activeColors[i]]) {
      prio[activeColors[i]] = true;
    }
  }

  let loosers: PlayerColor[] = [];

  for (let i = 0; i < activeColors.length; i++) {
    for (let j = 0; j < activeColors.length; j++) {
      if (i !== j && futurePos[activeColors[i]] === futurePos[activeColors[j]]) {
        if (prio[activeColors[i]]) {
          loosers.push(activeColors[j]);
        } else if (prio[activeColors[j]]) {
          loosers.push(activeColors[i]);
        } else {
          const uniqueRandomNumbers = activeColors.reduce<Record<PlayerColor, number>>(
            (acc, color) => {
              acc[color] = Math.random();
              return acc;
            },
            {} as Record<PlayerColor, number>
          );
          if (
            uniqueRandomNumbers[activeColors[i]] ===
            Math.max(uniqueRandomNumbers[activeColors[i]], uniqueRandomNumbers[activeColors[j]])
          ) {
            loosers.push(activeColors[j]);
          } else {
            loosers.push(activeColors[i]);
          }
        }
      }
    }
  }

  for (let i = 0; i < activeColors.length; i++) {
    for (let j = 0; j < activeColors.length; j++) {
      if (
        i !== j &&
        futurePos[activeColors[i]] === currentPos[activeColors[j]] &&
        futurePos[activeColors[j]] === currentPos[activeColors[i]]
      ) {
        loosers.push(activeColors[i]);
        loosers.push(activeColors[j]);
      }
    }
  }

  loosers = loosers.reduce<PlayerColor[]>((a, b) => {
    if (a.indexOf(b) < 0) a.push(b);
    return a;
  }, []);
  for (let i = 0; i < loosers.length; i++) {
    futurePos[loosers[i]] = currentPos[loosers[i]];
  }

  (Object.keys(futurePos) as PlayerColor[]).forEach((color) => {
    if (playerList.indexOf(color) === -1) {
      delete futurePos[color];
    }
  });

  return futurePos;
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
