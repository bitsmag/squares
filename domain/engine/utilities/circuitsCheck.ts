import type { Match } from '../../models/match';
import type { Square } from '../../models/square';
import type { PlayerColor } from '../../models/colors';

// Minimum path length (in squares) required to consider a circuit valid for scoring.
// Previously this was encoded as "stackInner.length > 7".
const MIN_CIRCUIT_LENGTH = 8;

export function getPlayerPoints(match: Match): Record<PlayerColor, Square[]> {
  const playerPoints: Record<PlayerColor, Square[]> = {
    blue: [],
    orange: [],
    green: [],
    red: [],
  };
  for (let i = 0; i < match.players.length; i++) {
    const playerPositionSquare = match.board.getSquare(match.players[i].position);
    if (playerPositionSquare) {
      const playerColor = match.players[i].color as PlayerColor;
      const squaresEarningPoints = getPoints(playerPositionSquare, playerColor, match);
      playerPoints[playerColor] = squaresEarningPoints;
    }
  }
  return playerPoints;
}

function getPoints(theSquare: Square, theColor: PlayerColor, match: Match): Square[] {
  const stack: Square[] = [];
  let justPopped: Square | undefined;
  let preferredDirection: '' | 'left' | 'right' | 'up' | 'down' = '';
  let squaresEarningPoints: Square[] = [];

  function moveToFront<T>(array: T[], fromIndex: number): void {
    if (fromIndex <= 0 || fromIndex >= array.length) {
      return;
    }
    const [item] = array.splice(fromIndex, 1);
    array.unshift(item);
  }

  function getVertices(s: Square, c: PlayerColor): Square[] {
    const vertices: Square[] = [];
    for (let i = 0; i < s.edgesTo.length; i++) {
      const edgeSquare = match.board.getSquare(s.edgesTo[i]);
      if (edgeSquare) {
        if (edgeSquare.color === c && edgeSquare !== justPopped) {
          vertices.push(edgeSquare);
        }
      }
    }

    for (let i = 0; i < vertices.length; i++) {
      if (
        (s.position.x < vertices[i].position.x && preferredDirection === 'right') ||
        (s.position.x > vertices[i].position.x && preferredDirection === 'left') ||
        (s.position.y > vertices[i].position.y && preferredDirection === 'down') ||
        (s.position.y < vertices[i].position.y && preferredDirection === 'up')
      ) {
        moveToFront(vertices, i);
      }
    }
    return vertices;
  }

  function setAllSquaresUnvisited() {
    for (let i = 0; i < match.board.squares.length; i++) {
      match.board.squares[i].dfsVisited = false;
    }
  }

  function setPreferredDirection(theSquareInner: Square, nextSquare: Square) {
    if (stack.length > 0) {
      if (theSquareInner.position.x < nextSquare.position.x) {
        preferredDirection = 'right';
      } else if (theSquareInner.position.x > nextSquare.position.x) {
        preferredDirection = 'left';
      } else if (theSquareInner.position.y > nextSquare.position.y) {
        preferredDirection = 'down';
      } else if (theSquareInner.position.y < nextSquare.position.y) {
        preferredDirection = 'up';
      }
    }
  }

  function checkValidity(stackInner: Square[], alreadyVisitedVertex: Square): Square[] {
    if (stackInner.length < MIN_CIRCUIT_LENGTH) {
      return [];
    }

    const circuitArray = stackInner.slice(
      stackInner.indexOf(alreadyVisitedVertex),
      stackInner.length
    );

    const enclosedSquares = getEnclosedSquares(circuitArray);
    if (enclosedSquares.length === 0) {
      return [];
    }

    const points: Square[] = [];
    for (const sq of enclosedSquares) {
      points.push(sq);
    }
    for (const sq of circuitArray) {
      points.push(sq);
    }
    return points;
  }

  function getEnclosedSquares(circuitArray: Square[]): Square[] {
    const points: Square[] = [];

    // Use the actual board height instead of hard-coding 9 rows.
    for (let j = 0; j < match.board.height; j++) {
      const squaresInSameRow: Square[] = [];
      for (let k = 0; k < circuitArray.length; k++) {
        if (circuitArray[k].position.y == j) {
          squaresInSameRow.push(circuitArray[k]);
        }
      }
      squaresInSameRow.sort(function (a: Square, b: Square) {
        return a.position.x - b.position.x;
      });

      for (let k = 1; k < squaresInSameRow.length; k++) {
        const diff = squaresInSameRow[k].position.x - squaresInSameRow[k - 1].position.x;
        if (diff != 1) {
          for (let l = 1; l < diff; l++) {
            points.push(
              match.board.getSquareByCoordinates(squaresInSameRow[k].position.x - l, j)
            );
          }
        }
      }
    }

    return points;
  }

  function dfs(theSquareInner: Square | null, theColorInner: PlayerColor) {
    if (!theSquareInner && stack.length === 0) {
      return;
    }

    if (!theSquareInner) {
      theSquareInner = stack[stack.length - 1];
    } else {
      stack.push(theSquareInner);
    }

    theSquareInner.dfsVisited = true;

    const vertices = getVertices(theSquareInner, theColorInner);

    for (let i = 0; i < vertices.length; i++) {
      if (squaresEarningPoints.length > 0) {
        break;
      }

      const vertex = vertices[i];
      const previous = stack[stack.length - 2];

      const isBacktrackEdge = !!previous && vertex === previous;

      if (vertex.dfsVisited && !isBacktrackEdge) {
        squaresEarningPoints = checkValidity(stack, vertex);

        const reachedEndWithoutPoints =
          squaresEarningPoints.length === 0 && i === vertices.length - 1;
        if (reachedEndWithoutPoints) {
          stack.pop();
          justPopped = theSquareInner;
          const newTop = stack[stack.length - 1];
          if (newTop) {
            setPreferredDirection(theSquareInner, newTop);
          }
          dfs(null, theColorInner);
        }
      } else if (vertex.dfsVisited && isBacktrackEdge) {
        const isLastVertex = i === vertices.length - 1;
        if (isLastVertex) {
          stack.pop();
          justPopped = theSquareInner;
          const newTop = stack[stack.length - 1];
          if (newTop) {
            setPreferredDirection(theSquareInner, newTop);
          }
          dfs(null, theColorInner);
        }
      } else if (!vertex.dfsVisited) {
        justPopped = undefined;
        setPreferredDirection(theSquareInner, vertex);
        dfs(vertex, theColorInner);
      }
    }
  }
  dfs(theSquare, theColor);
  setAllSquaresUnvisited();
  return squaresEarningPoints;
}
