import type { RegisterPlayerLobbyDTO } from '../../../shared/dto/socket/incoming/lobbySocketDtos';
import { CreateMatchLobbyService } from '../../../service/createMatchLobbyService';
import { SocketMatchEventPublisher } from '../../match/socket/matchEventPublisher';
import { sessionStore } from '../../utilities/socket/socketSessionStore';
import type { MatchesManager } from '../../../domain/runtime/matchesManager';
import type { Match } from '../../../domain/entities/match';
import socketErrorHandler from '../../utilities/socket/socketErrorHandler';
import * as createMatchLobbyEmitters from './lobbyEmitters';

export class CreateMatchLobbySocketController {
  constructor(
    private readonly matchesManager: MatchesManager,
    private readonly createMatchLobbyService: CreateMatchLobbyService
  ) {}

  private resolveMatch(socketId: string): Match | undefined {
    try {
      const matchId = sessionStore.getMatchIdForSocket(socketId);
      return matchId ? this.matchesManager.getMatch(matchId) : undefined;
    } catch {
      return undefined;
    }
  }

  handleRegisterPlayerLobby(playerInfo: RegisterPlayerLobbyDTO, socketId: string): void {
    try {
      const { matchId, playerId } = playerInfo;
      sessionStore.register(socketId, '/createMatchSockets', matchId, playerId);
      createMatchLobbyEmitters.sendPlayerConnectedEvent(this.matchesManager.getMatch(matchId));
    } catch (err) {
      socketErrorHandler(this.resolveMatch(socketId), err);
    }
  }

  handleMatchStartInitiation(socketId: string): void {
    try {
      const session = sessionStore.lookup(socketId);
      if (!session || !session.matchId) return;
      const matchId = session.matchId;
      this.createMatchLobbyService.processMatchStartInitiation(matchId);
      createMatchLobbyEmitters.sendMatchStartInitiationEvent(
        this.matchesManager.getMatch(matchId)
      );
    } catch (err) {
      socketErrorHandler(this.resolveMatch(socketId), err);
    }
  }

  handleDisconnectLobby(socketId: string): void {
    try {
      const session = sessionStore.unregister(socketId);
      if (session && session.matchId && session.playerId) {
        const disconnectionSource = this.createMatchLobbyService.processDisconnectLobby(session.matchId, session.playerId);
        switch (disconnectionSource.type) {
          case 'HOST_LEFT':
            createMatchLobbyEmitters.sendHostDisconnectedEvent(session.matchId);
            break;
          case 'GUEST_LEFT':
            createMatchLobbyEmitters.sendPlayerDisconnectedEvent(
              this.matchesManager.getMatch(session.matchId)
            );
            break;
          case 'LOBBY_CLOSED':
            // nothing to do
            break;
        }
      }
    } catch (err) {
      socketErrorHandler(this.resolveMatch(socketId), err);
    }
  }
}

export function createCreateMatchLobbySocketController(
  matchesManager: MatchesManager
): CreateMatchLobbySocketController {
  const matchEventPublisher = new SocketMatchEventPublisher(matchesManager);
  const createMatchLobbyService = new CreateMatchLobbyService(matchesManager, matchEventPublisher);
  return new CreateMatchLobbySocketController(matchesManager, createMatchLobbyService);
}
