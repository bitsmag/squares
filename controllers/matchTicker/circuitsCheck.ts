import socketErrorHandler from '../../middleware/socketErrorHandler';
import type { Match } from '../../models/match';
import type { Square } from '../../models/square';
import type { PlayerColor } from './positionCalc';

export function getPlayerPoints(match: Match): Record<PlayerColor, Square[]> {
  const playerPoints: Record<PlayerColor, Square[]> = {
    blue: [],
    orange: [],
    green: [],
    red: [],
  };
  const players = match.getPlayers();
  for (let i = 0; i < players.length; i++) {
    let playerPositionSquare: Square | undefined;
    try {
      playerPositionSquare = match.getBoard().getSquare(players[i].getPosition());
    } catch (err) {
      socketErrorHandler(match, err, 'circuitsCheck.getPlayerPoints()');
    }
    if (playerPositionSquare) {
      const playerColor = players[i].getColor() as PlayerColor;
      const squaresEarningPoints = getPoints(playerPositionSquare, playerColor, match);
      playerPoints[playerColor] = squaresEarningPoints;
    }
  }
  return playerPoints;
}

function getPoints(theSquare: Square, theColor: PlayerColor, match: Match): Square[] {
  const stack: Square[] = [];
  let justPopped: Square | null = null;
  let prefDir = '';
  let squaresEarningPoints: Square[] = [];

  function moveVertex(vertices: Square[], oldIndex: number, newIndex: number): void {
    const list = vertices;
    if (newIndex >= list.length) {
      let k = newIndex - list.length;
      while (k-- + 1) {
        list.push(list[list.length - 1]);
      }
    }
    list.splice(newIndex, 0, list.splice(oldIndex, 1)[0]);
  }

  function getVertices(s: Square, c: PlayerColor): Square[] {
    const vertices: Square[] = [];
    for (let i = 0; i < s.getEdgesTo().length; i++) {
      try {
        const edgeSquare = match.getBoard().getSquare(s.getEdgesTo()[i]);
        if (edgeSquare.getColor() === c && edgeSquare !== justPopped) {
          vertices.push(edgeSquare);
        }
      } catch (err) {
        socketErrorHandler(match, err, 'circuitsCheck.getVertices()');
      }
    }

    for (let i = 0; i < vertices.length; i++) {
      if (
        (s.getPosition().x < vertices[i].getPosition().x && prefDir === 'right') ||
        (s.getPosition().x > vertices[i].getPosition().x && prefDir === 'left') ||
        (s.getPosition().y > vertices[i].getPosition().y && prefDir === 'down') ||
        (s.getPosition().y < vertices[i].getPosition().y && prefDir === 'up')
      ) {
        moveVertex(vertices, i, 0);
      }
    }
    return vertices;
  }

  function setAllSquaresUnvisited() {
    const squares = match.getBoard().getSquares();
    for (let i = 0; i < squares.length; i++) {
      squares[i].setDfsVisited(false);
    }
  }

  function setPrefDir(theSquareInner: Square, nextSquare: Square): void {
    if (stack.length > 0) {
      if (theSquareInner.getPosition().x < nextSquare.getPosition().x) {
        prefDir = 'right';
      } else if (theSquareInner.getPosition().x > nextSquare.getPosition().x) {
        prefDir = 'left';
      } else if (theSquareInner.getPosition().y > nextSquare.getPosition().y) {
        prefDir = 'down';
      } else if (theSquareInner.getPosition().y < nextSquare.getPosition().y) {
        prefDir = 'up';
      }
    }
  }

  function checkValidity(stackInner: Square[], alreadyVisitedVertex: Square): Square[] {
    const points: Square[] = [];
    if (stackInner.length > 7) {
      const circuitArray = stackInner.slice(
        stackInner.indexOf(alreadyVisitedVertex),
        stackInner.length
      );

      for (let j = 0; j < 9; j++) {
        const squaresInSameRow: Square[] = [];
        for (let k = 0; k < circuitArray.length; k++) {
          if (circuitArray[k].getPosition().y === j) {
            squaresInSameRow.push(circuitArray[k]);
          }
        }
        squaresInSameRow.sort((a, b) => a.getPosition().x - b.getPosition().x);

        for (let k = 1; k < squaresInSameRow.length; k++) {
          const diff =
            squaresInSameRow[k].getPosition().x - squaresInSameRow[k - 1].getPosition().x;
          if (diff !== 1) {
            for (let l = 1; l < diff; l++) {
              points.push(
                match.getBoard().getSquareByCoordinates(squaresInSameRow[k].getPosition().x - l, j)
              );
            }
          }
        }
      }
      if (points.length > 0) {
        for (const sq of circuitArray) {
          points.push(sq);
        }
      }
    }
    return points.length > 0 ? points : [];
  }

  function dfs(theSquareInner: Square | null, theColorInner: PlayerColor) {
    if (theSquareInner || stack.length > 0) {
      const current = theSquareInner ?? stack[stack.length - 1];
      stack.push(current);

      current.setDfsVisited(true);

      const vertices = getVertices(current, theColorInner);

      for (let i = 0; i < vertices.length; i++) {
        if (squaresEarningPoints.length < 1) {
          if (vertices[i].isDfsVisited() && vertices[i] !== stack[stack.length - 2]) {
            squaresEarningPoints = checkValidity(stack, vertices[i]);

            if (squaresEarningPoints.length === 0 && i === vertices.length - 1) {
              stack.pop();
              justPopped = current;
              setPrefDir(current, stack[stack.length - 1]);
              dfs(null, theColorInner);
            }
          } else if (vertices[i].isDfsVisited() && vertices[i] === stack[stack.length - 2]) {
            if (i === vertices.length - 1) {
              stack.pop();
              justPopped = current;
              setPrefDir(current, stack[stack.length - 1]);
              dfs(null, theColorInner);
            }
          } else if (!vertices[i].isDfsVisited()) {
            justPopped = null;
            setPrefDir(current, vertices[i]);
            dfs(vertices[i], theColorInner);
          }
        }
      }
    }
  }
  dfs(theSquare, theColor);
  setAllSquaresUnvisited();
  return squaresEarningPoints;
}

// CommonJS compatibility
