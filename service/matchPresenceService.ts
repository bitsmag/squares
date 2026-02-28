import { sessionStore } from '../transport/util/socket/socketSessionStore';

export class MatchPresenceService {
  getConnectedPlayers(matchId: string, namespace = '/matchSockets'): string[] {
    return sessionStore.getConnectedPlayers(matchId, namespace);
  }

  areAllPlayersConnected(matchId: string, expectedCount: number, namespace = '/matchSockets'): boolean {
    const connected = this.getConnectedPlayers(matchId, namespace).length;
    return connected >= expectedCount;
  }

  getSocketIdsForMatch(matchId: string, namespace = '/matchSockets'): string[] {
    return sessionStore.getSocketIdsForMatch(matchId, namespace);
  }
}
