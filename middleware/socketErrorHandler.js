"use strict";
// Centralized socket error handler — emits a `fatalError` event to all players and destroys the match.
module.exports = function fatalErrorHandler(match, err, context) {
  try {
    if (match && typeof match.getPlayers === 'function') {
      const players = match.getPlayers();
      for (let i = 0; i < players.length; i++) {
        try {
          const sock = players[i].getSocket();
          if (sock && typeof sock.emit === 'function') sock.emit('fatalError');
        } catch (e) {
          // ignore per-player send errors
        }
      }
    }
  } catch (e) {
    // ignore
  }

  try {
    if (match && typeof match.destroy === 'function') match.destroy();
  } catch (e) {
    // ignore
  }

  try {
    console.warn(((err && err.message) || String(err)) + ' // socketErrorHandler.' + (context || 'unknown'));
    console.trace();
  } catch (e) {
    // ignore
  }
};
