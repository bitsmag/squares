import type { Match } from '../../models/match';
import type { Square } from '../../models/square';
import type { PlayerColor } from '../../models/colors';

// A DFS path through same-colored squares.
type Path = Square[];

// A closed loop of same-colored squares detected by DFS.
type Circuit = Square[];

// Minimum path length (in squares) required to consider a circuit candidate.
// Previously this was encoded as an implicit "stackInner.length > 7" check.
const MIN_CIRCUIT_LENGTH = 8;

export function getPlayerPoints(match: Match): Record<PlayerColor, Square[]> {
  const playerPoints: Record<PlayerColor, Square[]> = {
    blue: [],
    orange: [],
    green: [],
    red: [],
  };

  for (let i = 0; i < match.players.length; i++) {
    const player = match.players[i];
    const positionSquare = match.board.getSquare(player.position);
    if (!positionSquare) continue;

    const color = player.color as PlayerColor;
    const scoringSquares = getPointsForPlayer(positionSquare, color, match);
    playerPoints[color] = scoringSquares;
  }

  return playerPoints;
}

function getPointsForPlayer(startSquare: Square, color: PlayerColor, match: Match): Square[] {
  const circuit = findCircuit(startSquare, color, match);
  if (!circuit) {
    return [];
  }
  return computeScoringSquares(circuit, match);
}

function findCircuit(startSquare: Square, color: PlayerColor, match: Match): Circuit | null {
  const stack: Path = [];
  let justPopped: Square | undefined;
  let preferredDirection: '' | 'left' | 'right' | 'up' | 'down' = '';
  let foundCircuit: Circuit | null = null;

  function getVertices(origin: Square): Square[] {
    const vertices: Square[] = [];

    // Adjacent same-colored squares, excluding the one we just backtracked from.
    for (let i = 0; i < origin.edgesTo.length; i++) {
      const edgeSquare = match.board.getSquare(origin.edgesTo[i]);
      if (edgeSquare && edgeSquare.color === color && edgeSquare !== justPopped) {
        vertices.push(edgeSquare);
      }
    }

    // Reorder vertices so we prefer continuing along the previous movement direction.
    for (let i = 0; i < vertices.length; i++) {
      if (
        (origin.position.x < vertices[i].position.x && preferredDirection === 'right') ||
        (origin.position.x > vertices[i].position.x && preferredDirection === 'left') ||
        (origin.position.y > vertices[i].position.y && preferredDirection === 'down') ||
        (origin.position.y < vertices[i].position.y && preferredDirection === 'up')
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

  function setPreferredDirection(from: Square, to: Square) {
    if (stack.length === 0) return;

    if (from.position.x < to.position.x) {
      preferredDirection = 'right';
    } else if (from.position.x > to.position.x) {
      preferredDirection = 'left';
    } else if (from.position.y > to.position.y) {
      preferredDirection = 'down';
    } else if (from.position.y < to.position.y) {
      preferredDirection = 'up';
    }
  }

  function tryCreateCircuit(path: Path, revisitedVertex: Square): Circuit | null {
    if (path.length < MIN_CIRCUIT_LENGTH) {
      return null;
    }

    const startIndex = path.indexOf(revisitedVertex);
    if (startIndex === -1) {
      return null;
    }

    const candidate = path.slice(startIndex, path.length);
    if (candidate.length < MIN_CIRCUIT_LENGTH) {
      return null;
    }

    const enclosedSquares = getEnclosedSquaresForMatch(candidate, match);
    if (enclosedSquares.length === 0) {
      return null;
    }

    return candidate;
  }

  function dfs(current: Square | null): void {
    if (!current && stack.length === 0) {
      return;
    }

    if (!current) {
      current = stack[stack.length - 1];
    } else {
      stack.push(current);
    }

    current.dfsVisited = true;

    const vertices = getVertices(current);

    for (let i = 0; i < vertices.length; i++) {
      if (foundCircuit) {
        break;
      }

      const vertex = vertices[i];
      const previous = stack[stack.length - 2];
      const isBacktrackEdge = !!previous && vertex === previous;

      if (vertex.dfsVisited && !isBacktrackEdge) {
        const circuit = tryCreateCircuit(stack, vertex);
        if (circuit) {
          foundCircuit = circuit;
          break;
        }

        const isLastVertex = i === vertices.length - 1;
        if (isLastVertex) {
          stack.pop();
          justPopped = current;
          const newTop = stack[stack.length - 1];
          if (newTop) {
            setPreferredDirection(current, newTop);
          }
          dfs(null);
        }
      } else if (vertex.dfsVisited && isBacktrackEdge) {
        const isLastVertex = i === vertices.length - 1;
        if (isLastVertex) {
          stack.pop();
          justPopped = current;
          const newTop = stack[stack.length - 1];
          if (newTop) {
            setPreferredDirection(current, newTop);
          }
          dfs(null);
        }
      } else if (!vertex.dfsVisited) {
        justPopped = undefined;
        setPreferredDirection(current, vertex);
        dfs(vertex);
      }
    }
  }

  dfs(startSquare);
  setAllSquaresUnvisited();
  return foundCircuit;
}

function computeScoringSquares(circuit: Circuit, match: Match): Square[] {
  const enclosedSquares = getEnclosedSquaresForMatch(circuit, match);
  const scoringSquares: Square[] = [];

  for (const sq of enclosedSquares) {
    scoringSquares.push(sq);
  }
  for (const sq of circuit) {
    scoringSquares.push(sq);
  }

  return scoringSquares;
}

function getEnclosedSquaresForMatch(circuit: Circuit, match: Match): Square[] {
  const enclosed: Square[] = [];

  // Use the actual board height instead of hard-coding the number of rows.
  for (let row = 0; row < match.board.height; row++) {
    const squaresInSameRow: Square[] = [];
    for (let i = 0; i < circuit.length; i++) {
      if (circuit[i].position.y === row) {
        squaresInSameRow.push(circuit[i]);
      }
    }

    squaresInSameRow.sort((a, b) => a.position.x - b.position.x);

    for (let i = 1; i < squaresInSameRow.length; i++) {
      const diff = squaresInSameRow[i].position.x - squaresInSameRow[i - 1].position.x;
      if (diff !== 1) {
        for (let offset = 1; offset < diff; offset++) {
          enclosed.push(match.board.getSquareByCoordinates(squaresInSameRow[i].position.x - offset, row));
        }
      }
    }
  }

  return enclosed;
}

function moveToFront<T>(array: T[], fromIndex: number): void {
  if (fromIndex <= 0 || fromIndex >= array.length) {
    return;
  }
  const [item] = array.splice(fromIndex, 1);
  array.unshift(item);
}
