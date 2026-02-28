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

type PlayerCircuits = Record<PlayerColor, Circuit | null>;
type PlayerScoringSquares = Record<PlayerColor, Square[]>;

type DirectionPreference = '' | 'left' | 'right' | 'up' | 'down';

interface CircuitSearchContext {
  match: Match;
  color: PlayerColor;
  stack: Path;
  justPopped?: Square;
  preferredDirection: DirectionPreference;
  foundCircuit: Circuit | null;
}

export function getPlayerScoringSquares(match: Match): PlayerScoringSquares {
  const circuits = detectPlayerCircuits(match);
  const scoringSquares = computePlayerScoringSquaresFromCircuits(circuits, match);
  return scoringSquares;
}

function detectPlayerCircuits(match: Match): PlayerCircuits {
  const circuits: PlayerCircuits = {
    blue: null,
    orange: null,
    green: null,
    red: null,
  };

  for (let i = 0; i < match.players.length; i++) {
    const player = match.players[i];
    const color = player.color as PlayerColor;
    const startSquare = match.board.getSquare(player.position);
    if (!startSquare) {
      circuits[color] = null;
      continue;
    }

    circuits[color] = findCircuitFromSquare(match, startSquare, color);
  }

  return circuits;
}

function computePlayerScoringSquaresFromCircuits(circuits: PlayerCircuits, match: Match): PlayerScoringSquares {
  const scoring: PlayerScoringSquares = {
    blue: [],
    orange: [],
    green: [],
    red: [],
  };

  (Object.keys(scoring) as PlayerColor[]).forEach((color) => {
    const circuit = circuits[color];
    scoring[color] = circuit ? computeScoringSquares(circuit, match) : [];
  });

  return scoring;
}

function findCircuitFromSquare(match: Match, startSquare: Square, color: PlayerColor): Circuit | null {
  return withDfsVisitedReset(match, () => {
    const context: CircuitSearchContext = {
      match,
      color,
      stack: [],
      preferredDirection: '',
      foundCircuit: null,
    };

    dfs(context, startSquare);
    return context.foundCircuit;
  });
}

function withDfsVisitedReset<T>(match: Match, fn: () => T): T {
  for (let i = 0; i < match.board.squares.length; i++) {
    match.board.squares[i].dfsVisited = false;
  }
  return fn();
}

function dfs(context: CircuitSearchContext, current: Square | null): void {
  const { stack } = context;

  if (!current && stack.length === 0) {
    return;
  }

  if (!current) {
    current = stack[stack.length - 1];
  } else {
    stack.push(current);
  }

  current.dfsVisited = true;

  const vertices = getNextVertices(context, current);

  for (let i = 0; i < vertices.length; i++) {
    if (context.foundCircuit) {
      break;
    }

    const vertex = vertices[i];
    const previous = stack[stack.length - 2];
    const isBacktrackEdge = !!previous && vertex === previous;

    if (vertex.dfsVisited && !isBacktrackEdge) {
      const circuit = tryCreateCircuitCandidate(context, vertex);
      if (circuit) {
        context.foundCircuit = circuit;
        break;
      }

      const isLastVertex = i === vertices.length - 1;
      if (isLastVertex) {
        stack.pop();
        context.justPopped = current;
        const newTop = stack[stack.length - 1];
        if (newTop) {
          setPreferredDirection(context, current, newTop);
        }
        dfs(context, null);
      }
    } else if (vertex.dfsVisited && isBacktrackEdge) {
      const isLastVertex = i === vertices.length - 1;
      if (isLastVertex) {
        stack.pop();
        context.justPopped = current;
        const newTop = stack[stack.length - 1];
        if (newTop) {
          setPreferredDirection(context, current, newTop);
        }
        dfs(context, null);
      }
    } else if (!vertex.dfsVisited) {
      context.justPopped = undefined;
      setPreferredDirection(context, current, vertex);
      dfs(context, vertex);
    }
  }
}

function getNextVertices(context: CircuitSearchContext, origin: Square): Square[] {
  const { match, color, justPopped, preferredDirection } = context;
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

function setPreferredDirection(context: CircuitSearchContext, from: Square, to: Square): void {
  if (context.stack.length === 0) return;

  if (from.position.x < to.position.x) {
    context.preferredDirection = 'right';
  } else if (from.position.x > to.position.x) {
    context.preferredDirection = 'left';
  } else if (from.position.y > to.position.y) {
    context.preferredDirection = 'down';
  } else if (from.position.y < to.position.y) {
    context.preferredDirection = 'up';
  }
}

function tryCreateCircuitCandidate(context: CircuitSearchContext, revisitedVertex: Square): Circuit | null {
  const path = context.stack;

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

  const enclosedSquares = getEnclosedSquaresForMatch(candidate, context.match);
  if (enclosedSquares.length === 0) {
    return null;
  }

  return candidate;
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
