import { Match } from '../../domain/entities/match';
import { Player } from '../../domain/entities/player';
import type { PlayerColor, Direction } from '../../domain/valueObjects/valueObjects';
import { computeTick } from '../../domain/engine/tickRules';
import http from 'http';
import https from 'https';
import { URL } from 'url';

export type SessionId = string;

export interface RlBoardSquare {
	id: number;
	x: number;
	y: number;
	color: import('../../domain/valueObjects/valueObjects').SquareColor;
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

const DEFAULT_BOT_SERVER_URL = 'http://localhost:8000/act';
const BOT_SERVER_URL = process.env.BOT_SERVER_URL ?? DEFAULT_BOT_SERVER_URL;

export function rlReset(_req: RlResetRequest): RlResetResponse {
	const sessionId: SessionId = generateSessionId();
	const match = new Match(sessionId);

	const agentColor: PlayerColor = 'blue';
	const startSquares = match.board.startSquares;
	const agent = new Player('agent', agentColor, startSquares[agentColor], true);
	match.addPlayer(agent);

	const opponentConfigs: { name: string; color: PlayerColor }[] = [
		{ name: 'bot_orange', color: 'orange' },
		{ name: 'bot_green', color: 'green' },
		{ name: 'bot_red', color: 'red' },
	];

	opponentConfigs.forEach(({ name, color }) => {
		const startPos = startSquares[color];
		const bot = new Player(name, color, startPos, false);
		match.addPlayer(bot);
	});

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

export async function rlStep(req: RlStepRequest): Promise<RlStepResponse> {
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

	const opponentTasks = match.players
		.filter((player) => player.color !== agentColor)
		.map(async (player) => {
			const obsForOpponent = buildObservationFromMatch(match, player.color as PlayerColor);
			const opponentAction = await getBotServerAction(obsForOpponent);

			if (opponentAction === null) {
				return;
			}

			const newDir: Direction | null =
				opponentAction === 1 ? 'left' :
				opponentAction === 2 ? 'up' :
				opponentAction === 3 ? 'right' :
				opponentAction === 4 ? 'down' :
				player.activeDirection;

			player.activeDirection = newDir;
		});

	await Promise.all(opponentTasks);

	session.tickCount += 1;
	computeTick(match, session.tickCount);

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

type BotResponse = { action?: unknown };

function postToBotServer(body: RlObservation): Promise<BotResponse> {
	return new Promise((resolve, reject) => {
		try {
			const urlObj = new URL(BOT_SERVER_URL);
			const isHttps = urlObj.protocol === 'https:';
			const client = isHttps ? https : http;

			const data = JSON.stringify(body ?? {});

			const options: http.RequestOptions = {
				hostname: urlObj.hostname,
				port: urlObj.port ? Number(urlObj.port) : isHttps ? 443 : 80,
				path: urlObj.pathname + (urlObj.search || ''),
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Content-Length': Buffer.byteLength(data),
				},
			};

			const req = client.request(options, (res) => {
				let raw = '';
				res.setEncoding('utf8');
				res.on('data', (chunk) => {
					raw += chunk;
				});
				res.on('end', () => {
					if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
						try {
							const parsed = raw.length ? JSON.parse(raw) : {};
							resolve(parsed as BotResponse);
						} catch (err) {
							reject(err);
						}
					} else {
						reject(new Error(`Bot server responded with status ${res.statusCode}`));
					}
				});
			});

			req.on('error', (err) => {
				reject(err);
			});

			req.write(data);
			req.end();
		} catch (err) {
			reject(err);
		}
	});
}

async function getBotServerAction(obs: RlObservation): Promise<number | null> {
	try {
		const response = await postToBotServer(obs);
		return typeof response.action === 'number' ? response.action : null;
	} catch {
		return null;
	}
}
