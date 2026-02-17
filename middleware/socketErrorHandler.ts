// Centralized socket error handler — emits a `fatalError` event to all players and destroys the match.
function fatalErrorHandler(match: any, err: any, context: string) {
  try {
    if (match && typeof match.getPlayers === 'function') {
      const players = match.getPlayers();
      for (let i = 0; i < players.length; i++) {
        try {
          const sock = players[i].getSocket();
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
    console.warn(((err && err.message) || String(err)) + ' // socketErrorHandler.' + (context || 'unknown'));
    console.trace();
  } catch (_e) {
    // ignore
  }
}

export default fatalErrorHandler;
module.exports = fatalErrorHandler as any;
