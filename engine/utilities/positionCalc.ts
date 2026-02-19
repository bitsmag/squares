import socketErrorHandler from '../../infrastructure/middleware/socketErrorHandler';
import type { Match } from '../../models/match';
import type { Board } from '../../models/board';
import type { Square } from '../../models/square';

export type PlayerColor = 'blue' | 'orange' | 'green' | 'red';
export type PlayerPositions = Partial<Record<PlayerColor, number>>;

export function calculateNewPlayerPositions(
  match: Match,
  playerList: PlayerColor[]
): PlayerPositions {
  const activeColors: PlayerColor[] = [];
  const players = match.getPlayers();
  for (let i = 0; i < players.length; i++) {
    activeColors.push(players[i].getColor() as PlayerColor);
  }

  const currentPos: Partial<Record<PlayerColor, number>> = {};
  const futurePos: Partial<Record<PlayerColor, number>> = {};
  const prio: Partial<Record<PlayerColor, boolean>> = {};

  for (let i = 0; i < activeColors.length; i++) {
    let player;
    let error = false;
    try {
      player = match.getPlayerByColor(activeColors[i]);
    } catch (err) {
      error = true;
      socketErrorHandler(match, err);
    }
    if (!error && player) {
      currentPos[activeColors[i]] = player.getPosition();
      futurePos[activeColors[i]] = calculateFuturePos(
        player.getPosition(),
        player.getActiveDirection(),
        match.getBoard(),
        match
      );
      if (playerList.indexOf(activeColors[i]) === -1) {
        futurePos[activeColors[i]] = currentPos[activeColors[i]];
      }
      if (currentPos[activeColors[i]] === futurePos[activeColors[i]]) {
        prio[activeColors[i]] = true;
      }
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
  activeDirection: string | null,
  board: Board,
  match: Match
): number {
  let square: Square | undefined;
  let error = false;
  try {
    square = board.getSquare(currentPosition);
  } catch (err) {
    error = true;
    socketErrorHandler(match, err);
  }
  if (!error && square) {
    switch (activeDirection) {
      case 'left':
        if (square.getPosition().x > 0) {
          return currentPosition - 1;
        } else {
          return currentPosition;
        }
      case 'up':
        if (square.getPosition().y > 0) {
          return currentPosition - board.getWidth();
        } else {
          return currentPosition;
        }
      case 'right':
        if (square.getPosition().x < board.getWidth() - 1) {
          return currentPosition + 1;
        } else {
          return currentPosition;
        }
      case 'down':
        if (square.getPosition().y < board.getHeight() - 1) {
          return currentPosition + board.getWidth();
        } else {
          return currentPosition;
        }
      default:
        return currentPosition;
    }
  }
  return currentPosition;
}

// CommonJS compatibility
module.exports = { calculateNewPlayerPositions };
