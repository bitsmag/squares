import type { Match } from '../../models/match';
import type { Square } from '../../models/square';
import type { PlayerColor } from '../../models/colors';

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
  let prefDir: '' | 'left' | 'right' | 'up' | 'down' = '';
  let squaresEarningPoints: Square[] = [];

  function getVertices(s: Square, c: PlayerColor): Square[] {
    const vertices: Square[] = [];
    (vertices as any).move = function (old_index: number, new_index: number) {
      if (new_index >= this.length) {
        let k = new_index - this.length;
        while (k-- + 1) {
          this.push(undefined);
        }
      }
      this.splice(new_index, 0, this.splice(old_index, 1)[0]);
    };
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
        (s.position.x < vertices[i].position.x && prefDir === 'right') ||
        (s.position.x > vertices[i].position.x && prefDir === 'left') ||
        (s.position.y > vertices[i].position.y && prefDir === 'down') ||
        (s.position.y < vertices[i].position.y && prefDir === 'up')
      ) {
        (vertices as any).move(i, 0);
      }
    }
    return vertices;
  }

  function setAllSquaresUnvisited() {
    for (let i = 0; i < match.board.squares.length; i++) {
      match.board.squares[i].dfsVisited = false;
    }
  }

  function setPrefDir(theSquareInner: Square, nextSquare: Square) {
    if (stack.length > 0) {
      if (theSquareInner.position.x < nextSquare.position.x) {
        prefDir = 'right';
      } else if (theSquareInner.position.x > nextSquare.position.x) {
        prefDir = 'left';
      } else if (theSquareInner.position.y > nextSquare.position.y) {
        prefDir = 'down';
      } else if (theSquareInner.position.y < nextSquare.position.y) {
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
      if (theSquareInner) {
        stack.push(theSquareInner);
      } else {
        theSquareInner = stack[stack.length - 1];
      }

      theSquareInner.dfsVisited = true;

      const vertices = getVertices(theSquareInner, theColorInner);

      for (let i = 0; i < vertices.length; i++) {
        if (squaresEarningPoints.length < 1) {
          if (vertices[i].dfsVisited && vertices[i] !== stack[stack.length - 2]) {
            squaresEarningPoints = checkValidity(stack, vertices[i]);

            if (squaresEarningPoints.length === 0 && i === vertices.length - 1) {
              stack.pop();
              justPopped = theSquareInner;
              setPrefDir(theSquareInner, stack[stack.length - 1]);
              dfs(null, theColorInner);
            }
          } else if (vertices[i].dfsVisited && vertices[i] === stack[stack.length - 2]) {
            if (i === vertices.length - 1) {
              stack.pop();
              justPopped = theSquareInner;
              setPrefDir(theSquareInner, stack[stack.length - 1]);
              dfs(null, theColorInner);
            }
          } else if (!vertices[i].dfsVisited) {
            justPopped = undefined;
            setPrefDir(theSquareInner, vertices[i]);
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
