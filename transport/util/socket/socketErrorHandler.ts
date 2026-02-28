import type { Match } from '../../../domain/models/match';
import type { MatchesManager } from '../../../domain/models/matchesManager';
import { broadcastToMatch } from './transport';

let matchesManager: MatchesManager | null = null;

export function initSocketErrorHandler(manager: MatchesManager): void {
  matchesManager = manager;
}

// Centralized socket error handler — emits a `fatalError` event to all players and destroys the match.
function fatalErrorHandler(match: Match | undefined, err: unknown): void {
  try {
    broadcastToMatch(match?.id ?? '', '/matchSockets', 'fatalError');
  } catch (_e) {
    // ignore
  }

  try {
    if (match && matchesManager) {
      matchesManager.destroyMatch(match);
    }
  } catch (_e) {
    // ignore
  }

  try {
    const message = err instanceof Error && typeof err.message === 'string' ? err.message : String(err);
    console.warn(message);
  } catch (_e) {
    // ignore
  }
}

export default fatalErrorHandler;
