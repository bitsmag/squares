import { Match } from '../domain/entities/match';
import { Player } from '../domain/entities/player';
import type { PlayerColor, Direction } from '../domain/valueObjects/valueObjects';
import { computeTick } from '../domain/engine/tickRules';

export type SessionId = string;

export interface RlBoardSquare {
  id: number;
  x: number;
  y: number;
  color: import('../domain/valueObjects/valueObjects').SquareColor;
  doubleSpeedSpecial: boolean;
  getPointsSpecial: boolean;
}

export interface RlAgentState {
  color: PlayerColor;
  pos: number;
  dir: Direction | null;
  doubleSpeed: boolean;
  score: number;
}

export type RlScoresByColor = Record<PlayerColor, number | null>;

export interface RlObservation {
  board: RlBoardSquare[];
  agent: RlAgentState;
  scores: RlScoresByColor;
  duration: number;
}

export interface RlResetRequest {
  sessionId?: SessionId;
}

export interface RlResetResponse {
  sessionId: SessionId;
  obs: RlObservation;
}

export interface RlStepRequest {
  sessionId: SessionId;
  action: number;
}

export interface RlStepResponse {
  obs: RlObservation;
  reward: number;
  done: boolean;
  info: Record<string, unknown>;
}

type RlSession = {
  id: SessionId;
  match: Match;
  agentColor: PlayerColor;
  tickCount: number;
  lastScore: number;
  done: boolean;
};

const sessions = new Map<SessionId, RlSession>();

export function rlReset(_req: RlResetRequest): RlResetResponse {
  const sessionId: SessionId = generateSessionId();
  const match = new Match(sessionId);

  const agentColor: PlayerColor = 'blue';
  const startSquares = match.board.startSquares;
  const agent = new Player('agent', agentColor, startSquares[agentColor], true);
  match.addPlayer(agent);
  match.active = true;
  match.startInitiated = true;

  const session: RlSession = {
    id: sessionId,
    match,
    agentColor,
    tickCount: 0,
    lastScore: 0,
    done: false,
  };
  sessions.set(sessionId, session);

  const obs = buildObservationFromMatch(match, agentColor);
  return { sessionId, obs };
}

export function rlStep(req: RlStepRequest): RlStepResponse {
  const session = sessions.get(req.sessionId);
  if (!session) {
    throw new Error('rlSessionNotFound');
  }

  if (session.done) {
    return {
      obs: buildObservationFromMatch(session.match, session.agentColor),
      reward: 0,
      done: true,
      info: {},
    };
  }

  const { match, agentColor } = session;
  const agent = match.getPlayerByColor(agentColor);

  const action = req.action;
  const dir: Direction | null =
    action === 1 ? 'left' :
    action === 2 ? 'up' :
    action === 3 ? 'right' :
    action === 4 ? 'down' :
    agent.activeDirection;

  agent.activeDirection = dir;

  session.tickCount += 1;
  computeTick(match, session.tickCount);

  // In the original engine, duration is decremented once per second,
  // while ticks run every 250ms. Here each rlStep represents one tick,
  // so approximate the same behavior by decrementing duration every
  // fourth tick instead of every step.
  if (session.tickCount % 4 === 0) {
    match.durationDecrement();
  }

  const newScore = agent.score;
  const reward = newScore - session.lastScore;
  session.lastScore = newScore;

  const done = match.duration <= 0 || !match.active;
  session.done = done;

  const obs = buildObservationFromMatch(match, agentColor);
  return { obs, reward, done, info: {} };
}
export function buildObservationFromMatch(match: Match, agentColor: PlayerColor): RlObservation {
  const { board } = match;
  const agent = match.getPlayerByColor(agentColor);

  const boardSquares: RlBoardSquare[] = board.squares.map((sq) => ({
    id: sq.id,
    x: sq.position.x,
    y: sq.position.y,
    color: sq.color,
    doubleSpeedSpecial: sq.doubleSpeedSpecial,
    getPointsSpecial: sq.hasGetPointsSpecial,
  }));

  const scores: RlScoresByColor = {
    blue: null,
    orange: null,
    green: null,
    red: null,
  };
  match.players.forEach((p) => {
    scores[p.color] = p.score;
  });

  const agentState: RlAgentState = {
    color: agent.color,
    pos: agent.position,
    dir: agent.activeDirection,
    doubleSpeed: agent.doubleSpeedSpecial,
    score: agent.score,
  };

  return {
    board: boardSquares,
    agent: agentState,
    scores,
    duration: match.duration,
  };
}

function generateSessionId(): SessionId {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as Crypto).randomUUID();
  }
  return Math.random().toString(36).slice(2);
}
