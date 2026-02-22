import type { Match } from '../../../domain/models/match';
import { sessionStore } from './socketSessionStore';
import { broadcastToMatch } from './transport';

// Centralized socket error handler — emits a `fatalError` event to all players and destroys the match.
function fatalErrorHandler(match: Match | undefined, err: unknown): void {
  try {
    broadcastToMatch(match?.getId() ?? '', '/matchSockets', 'fatalError');
  } catch (_e) {
    // ignore
  }

  try {
    if (match && typeof match.destroy === 'function') match.destroy();
  } catch (_e) {
    // ignore
  }

  try {
    const message =
      err instanceof Error && typeof err.message === 'string' ? err.message : String(err);
    console.warn(message);
  } catch (_e) {
    // ignore
  }
}

export default fatalErrorHandler;
