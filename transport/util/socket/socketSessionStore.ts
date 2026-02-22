type Session = { namespace: string; matchId?: string; playerId?: string };

export class SocketSessionStore {
  private sessions = new Map<string, Session>();
  private playerToSocket = new Map<string, string>();

  register(
    socketId: string,
    namespace: string,
    matchId?: string,
    playerId?: string
  ): void {
    this.sessions.set(socketId, { namespace, matchId, playerId });
    if (playerId) this.playerToSocket.set(playerId, socketId);
  }

  lookup(socketId: string): Session | undefined {
    return this.sessions.get(socketId);
  }

  unregister(socketId: string): Session | undefined {
    const s = this.sessions.get(socketId);
    if (s && s.playerId) this.playerToSocket.delete(s.playerId);
    this.sessions.delete(socketId);
    return s;
  }

  getSocketIdForPlayer(playerId: string): string | undefined {
    return this.playerToSocket.get(playerId);
  }

  getPlayerIdForSocket(socketId: string): string | undefined {
    const session = this.sessions.get(socketId);
    return session?.playerId;
  }

  getMatchIdForSocket(socketId: string): string | undefined {
    const session = this.sessions.get(socketId);
    return session?.matchId;
  }

  getConnectedPlayers(matchId: string, namespace = '/matchSockets'): string[] {
    const out: string[] = [];
    for (const [, s] of this.sessions) {
      if (s.namespace === namespace && s.matchId === matchId && s.playerId) {
        out.push(s.playerId);
      }
    }
    return out;
  }

  getSocketIdsForMatch(matchId: string, namespace = '/matchSockets'): string[] {
    const out: string[] = [];
    for (const [socketId, s] of this.sessions) {
      if (s.namespace === namespace && s.matchId === matchId) {
        out.push(socketId);
      }
    }
    return out;
  }
}

export const sessionStore = new SocketSessionStore();
