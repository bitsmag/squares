import socketErrorHandler from '../../util/socket/socketErrorHandler';
import type { RegisterPlayerAndStartMatchWhenReadyParams } from '../../util/validation';
import type { Match } from '../../../domain/models/match';
import { matchService } from '../../../service/matchService';
import { sessionStore } from '../../util/socket/socketSessionStore';
import { manager } from '../../../domain/models/matchesManager';

export class MatchSocketController {
  private matchService = matchService;

  constructor() {}

  private resolveMatch(socketId: string): Match | undefined {
    try {
      const matchId = sessionStore.getMatchIdForSocket(socketId);
      return matchId ? manager.getMatch(matchId) : undefined;
    } catch {
      return undefined;
    }
  }

  handleRegisterPlayerAndStartMatchWhenReady(
    playerInfo: RegisterPlayerAndStartMatchWhenReadyParams,
    socketId: string
  ): void {
    try {
      const { matchId, playerId } = playerInfo;
      sessionStore.register(socketId, '/matchSockets', matchId, playerId);
      this.matchService.startMatchWhenPlayersAreConnected(matchId);
    } catch (err) {
      socketErrorHandler(this.resolveMatch(socketId), err);
    }
  }

  handleDisconnectMatch(socketId: string): void {
    try {
      const playerId = sessionStore.getPlayerIdForSocket(socketId);
      const matchId = sessionStore.getMatchIdForSocket(socketId);
      if (!playerId || !matchId) return;
      this.matchService.removePlayer(matchId, playerId);
      sessionStore.unregister(socketId);
    } catch (err) {
      socketErrorHandler(this.resolveMatch(socketId), err);
    }
  }

  handleDirection(direction: 'left' | 'up' | 'right' | 'down', socketId: string): void {
    try {
      const matchId = sessionStore.getMatchIdForSocket(socketId);
      const playerId = sessionStore.getPlayerIdForSocket(socketId);
      if (!playerId || !matchId) return;
      this.matchService.setDirection(matchId, playerId, direction);
    } catch (err) {
      socketErrorHandler(this.resolveMatch(socketId), err);
    }
  }
}

export const matchSocketController = new MatchSocketController();
