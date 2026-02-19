import { sessionStore } from '../infrastructure/sockets/sessionStore';

export class MatchPresenceService {
  getReadyPlayerIds(matchId: string): string[] {
    // sessionStore stores playerName; to keep domain-focused we return playerNames
    return sessionStore.getConnectedPlayers(matchId, '/matchSockets');
  }

  areAllPlayersReady(matchId: string, expectedCount: number): boolean {
    return sessionStore.areAllPlayersConnected(matchId, expectedCount, '/matchSockets');
  }
}

export const matchPresenceService = new MatchPresenceService();
