import type { Match } from '../models/match';
import type { Player } from '../models/player';

// Centralized socket error handler — emits a `fatalError` event to all players and destroys the match.
function fatalErrorHandler(match: Match | undefined, err: unknown, context: string): void {
  try {
    const players: Player[] | undefined = match?.getPlayers();
    if (players) {
      for (const p of players) {
        try {
          const sock = p.getSocket();
          if (sock && typeof sock.emit === 'function') sock.emit('fatalError');
        } catch (_e) {
          // ignore per-player send errors
        }
      }
    }
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
    console.warn(message + ' // socketErrorHandler.' + (context || 'unknown'));
    console.trace();
  } catch (_e) {
    // ignore
  }
}

export default fatalErrorHandler;
