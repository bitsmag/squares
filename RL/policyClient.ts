import http from 'http';
import https from 'https';
import { URL } from 'url';

import type { Match } from '../domain/entities/match';
import type { PlayerColor, Direction } from '../domain/valueObjects/valueObjects';
import type { RlObservation } from './rlEnv';
import { buildObservationFromMatch } from './rlEnv';

const DEFAULT_POLICY_URL = 'http://localhost:8000/act';
const POLICY_URL = process.env.POLICY_BASE_URL ?? DEFAULT_POLICY_URL;

function postJson(url: string, body: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(url);
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
              resolve(parsed);
            } catch (err) {
              reject(err);
            }
          } else {
            reject(new Error(`Policy server responded with status ${res.statusCode}`));
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

export async function getBotAction(match: Match, color: PlayerColor): Promise<Direction | null> {
  const obs: RlObservation = buildObservationFromMatch(match, color);
  try {
    const response = (await postJson(POLICY_URL, obs)) as { action?: unknown };
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
    // On any error talking to the policy server, keep current direction
    return null;
  }
}
