import type { RegisterPlayerLobbyDTO } from '../../../shared/dto/socket/lobbySocketDtos';
import { LobbyService } from '../../../service/lobbyService';
import { SocketMatchEventPublisher } from '../../match/socket/matchEventPublisher';
import { sessionStore } from '../../utilities/socket/socketSessionStore';
import type { MatchesManager } from '../../../domain/runtime/matchesManager';
import type { Match } from '../../../domain/entities/match';
import socketErrorHandler from '../../utilities/socket/socketErrorHandler';
import * as lobbyEmitters from './lobbyEmitters';

export class LobbySocketController {
  constructor(private readonly matchesManager: MatchesManager, private readonly lobbyService: LobbyService) {}

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
      sessionStore.register(socketId, '/lobbySockets', matchId, playerId);
      lobbyEmitters.sendPlayerConnectedEvent(this.matchesManager.getMatch(matchId));
    } catch (err) {
      socketErrorHandler(this.resolveMatch(socketId), err);
    }
  }

  handleMatchStartInitiation(socketId: string): void {
    try {
      const session = sessionStore.lookup(socketId);
      if (!session || !session.matchId) return;
      const matchId = session.matchId;
      this.lobbyService.processMatchStartInitiation(matchId);
      lobbyEmitters.sendMatchStartInitiationEvent(this.matchesManager.getMatch(matchId));
    } catch (err) {
      socketErrorHandler(this.resolveMatch(socketId), err);
    }
  }

  handleDisconnectLobby(socketId: string): void {
    try {
      const session = sessionStore.unregister(socketId);
      if (session && session.matchId && session.playerId) {
        const disconnectionSource = this.lobbyService.processDisconnectLobby(session.matchId, session.playerId);
        switch (disconnectionSource.type) {
          case 'HOST_LEFT':
            lobbyEmitters.sendHostDisconnectedEvent(session.matchId);
            break;
          case 'GUEST_LEFT':
            lobbyEmitters.sendPlayerDisconnectedEvent(this.matchesManager.getMatch(session.matchId));
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

export function createLobbySocketController(matchesManager: MatchesManager): LobbySocketController {
  const matchEventPublisher = new SocketMatchEventPublisher(matchesManager);
  const lobbyService = new LobbyService(matchesManager, matchEventPublisher);
  return new LobbySocketController(matchesManager, lobbyService);
}
