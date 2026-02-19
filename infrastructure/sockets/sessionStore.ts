import type { Socket } from 'socket.io';

type Session = { namespace: string; matchId?: string; playerName?: string; playerId?: string };

export class SessionStore {
  private sessions = new Map<string, Session>();
  private playerToSocket = new Map<string, string>();

  register(socket: Socket, namespace: string, matchId?: string, playerName?: string, playerId?: string): void {
    this.sessions.set(socket.id, { namespace, matchId, playerName, playerId });
    if (playerId) this.playerToSocket.set(playerId, socket.id);
  }

  lookup(socketOrId: Socket | string): Session | undefined {
    const id = typeof socketOrId === 'string' ? socketOrId : socketOrId.id;
    return this.sessions.get(id);
  }

  unregister(socketOrId: Socket | string): Session | undefined {
    const id = typeof socketOrId === 'string' ? socketOrId : socketOrId.id;
    const s = this.sessions.get(id);
    if (s && s.playerId) this.playerToSocket.delete(s.playerId);
    this.sessions.delete(id);
    return s;
  }

  getSocketIdForPlayer(playerId: string): string | undefined {
    return this.playerToSocket.get(playerId);
  }

  getConnectedPlayers(matchId: string, namespace = '/matchSockets'): string[] {
    const out: string[] = [];
    for (const [, s] of this.sessions) {
      if (s.namespace === namespace && s.matchId === matchId && s.playerName) {
        out.push(s.playerName);
      }
    }
    return out;
  }

  areAllPlayersConnected(matchId: string, expectedCount: number, namespace = '/matchSockets'): boolean {
    const connected = this.getConnectedPlayers(matchId, namespace).length;
    return connected >= expectedCount;
  }
}

export const sessionStore = new SessionStore();
