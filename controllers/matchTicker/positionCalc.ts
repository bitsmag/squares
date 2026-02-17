import socketErrorHandler from '../../middleware/socketErrorHandler';
import type { Match } from '../../models/match';
import type { Board } from '../../models/board';

type PlayerColor = 'blue' | 'orange' | 'green' | 'red' | string;

export function calculateNewPlayerPositions(match: Match, playerList: PlayerColor[]): Record<string, number> {
  const activeColors: PlayerColor[] = [];
  const players = match.getPlayers();
  for (let i = 0; i < players.length; i++) {
    activeColors.push(players[i].getColor());
  }

  const currentPos: Record<string, number | null> = { blue: null, orange: null, green: null, red: null };
  const futurePos: Record<string, number | null> = { blue: null, orange: null, green: null, red: null };
  const prio: Record<string, boolean> = { blue: false, orange: false, green: false, red: false };

  for (let i = 0; i < activeColors.length; i++) {
    let player;
    let error = false;
    try {
      player = match.getPlayerByColor(activeColors[i]);
    } catch (err) {
      error = true;
      socketErrorHandler(match, err, 'positionCalc.calculateNewPlayerPositions()');
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
          const uniqueRandomNumbers: Record<string, number> = {};
          for (let k = 0; k < activeColors.length; k++) {
            uniqueRandomNumbers[activeColors[k]] = Math.random();
          }
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

  loosers = loosers.reduce(function (a: PlayerColor[], b: PlayerColor) {
    if (a.indexOf(b) < 0) a.push(b);
    return a;
  }, [] as PlayerColor[]);
  for (let i = 0; i < loosers.length; i++) {
    futurePos[loosers[i]] = currentPos[loosers[i]];
  }

  Object.keys(futurePos).forEach(function (color) {
    if (playerList.indexOf(color) === -1) {
      delete futurePos[color];
    }
  });

  // Cast to Record<string, number> after null elimination for active players
  return futurePos as Record<string, number>;
}

function calculateFuturePos(currentPosition: number, activeDirection: string, board: Board, match: Match): number {
  let square;
  let error = false;
  try {
    square = board.getSquare(currentPosition);
  } catch (err) {
    error = true;
    socketErrorHandler(match, err, 'positionCalc.calculateFuturePos()');
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
module.exports = { calculateNewPlayerPositions } as any;
