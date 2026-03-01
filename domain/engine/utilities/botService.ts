import http from 'http';
import https from 'https';
import { URL } from 'url';

import type { Match } from '../../entities/match';
import type { Player } from '../../entities/player';
import type { PlayerColor, Direction } from '../../valueObjects/valueObjects';

type BotServerResponse = { action?: unknown };

const DEFAULT_BOT_SERVER_URL = 'http://localhost:8000/act';
const BOT_SERVER_URL = process.env.BOT_SERVER_URL ?? DEFAULT_BOT_SERVER_URL;

export function isBotPlayer(player: Player): boolean {
  // Convention: names starting with "bot" are treated as bots.
  return player.name.toLowerCase().startsWith('bot');
}

export async function updateBotDirections(match: Match): Promise<void> {
  const bots = match.players.filter((p) => isBotPlayer(p));
  if (bots.length === 0) return;

  const tasks = bots.map(async (player) => {
    const dir = await getBotAction(match, player.color as PlayerColor);
    if (!match.active) return;
    if (dir !== null) {
      player.activeDirection = dir;
    }
  });

  await Promise.all(tasks);
}

async function getBotAction(match: Match, color: PlayerColor): Promise<Direction | null> {
  const obs = buildObservationForPlayer(match, color);
  try {
    const response = await postToBotServer(obs);
    const action = typeof response.action === 'number' ? response.action : 0;

    switch (action) {
      case 1:
        return 'left';
      case 2:
        return 'up';
      case 3:
        return 'right';
      case 4:
        return 'down';
      default:
        return null; // keep current direction
    }
  } catch {
    return null;
  }
}

function buildObservationForPlayer(match: Match, agentColor: PlayerColor) {
  const board = match.board;
  const agent = match.getPlayerByColor(agentColor);

  const boardSquares = board.squares.map((sq) => ({
    id: sq.id,
    x: sq.position.x,
    y: sq.position.y,
    color: sq.color,
    doubleSpeedSpecial: sq.doubleSpeedSpecial,
    getPointsSpecial: sq.hasGetPointsSpecial,
  }));

  const scores: Record<PlayerColor, number | null> = {
    blue: null,
    orange: null,
    green: null,
    red: null,
  };
  match.players.forEach((p) => {
    scores[p.color] = p.score;
  });

  const agentState = {
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

function postToBotServer(body: unknown): Promise<BotServerResponse> {
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
              resolve(parsed as BotServerResponse);
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
