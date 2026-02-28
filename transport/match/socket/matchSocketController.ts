import socketErrorHandler from '../../util/socket/socketErrorHandler';
import type { RegisterPlayerAndStartMatchWhenReadyDTO } from '../../../shared/dto/socket/incoming/matchSocketDtos';
import type { Match } from '../../../domain/models/match';
import type { Direction } from '../../../domain/models/direction';
import { MatchService } from '../../../service/matchService';
import { MatchPresenceService } from '../../../service/matchPresenceService';
import { MatchStartCoordinator } from '../../../service/matchStartCoordinator';
import { sessionStore } from '../../util/socket/socketSessionStore';
import type { MatchesManager } from '../../../domain/models/matchesManager';
import { SocketMatchEventPublisher } from './matchEventPublisher';

export class MatchSocketController {
  constructor(
    private readonly matchesManager: MatchesManager,
    private readonly matchService: MatchService
  ) {}

  private resolveMatch(socketId: string): Match | undefined {
    try {
      const matchId = sessionStore.getMatchIdForSocket(socketId);
      return matchId ? this.matchesManager.getMatch(matchId) : undefined;
    } catch {
      return undefined;
    }
  }

  handleRegisterPlayerAndStartMatchWhenReady(playerInfo: RegisterPlayerAndStartMatchWhenReadyDTO, socketId: string): void {
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

  handleDirection(direction: Direction, socketId: string): void {
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

export function createMatchSocketController(matchesManager: MatchesManager): MatchSocketController {
  const matchPresenceService = new MatchPresenceService();
  const matchStartCoordinator = new MatchStartCoordinator();
  const eventPublisher = new SocketMatchEventPublisher(matchesManager);
  const matchService = new MatchService(
    matchesManager,
    matchPresenceService,
    matchStartCoordinator,
    eventPublisher
  );
  return new MatchSocketController(matchesManager, matchService);
}
