import type { Socket } from 'socket.io';

type Session = { namespace: string; matchId?: string; playerName?: string };

export class SocketSessionRegistry {
  private sessions = new Map<string, Session>();

  register(socket: Socket, namespace: string, matchId?: string, playerName?: string): void {
    this.sessions.set(socket.id, { namespace, matchId, playerName });
  }

  lookup(socketOrId: Socket | string): Session | undefined {
    const id = typeof socketOrId === 'string' ? socketOrId : socketOrId.id;
    return this.sessions.get(id);
  }

  unregister(socketOrId: Socket | string): Session | undefined {
    const id = typeof socketOrId === 'string' ? socketOrId : socketOrId.id;
    const s = this.sessions.get(id);
    this.sessions.delete(id);
    return s;
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

export const socketSessionRegistry = new SocketSessionRegistry();
