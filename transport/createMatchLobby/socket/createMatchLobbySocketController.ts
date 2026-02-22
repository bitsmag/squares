import type { RegisterPlayerLobbyParams } from '../../util/validation';
import { createMatchLobbyService } from '../../../service/createMatchLobbyService';
import { sessionStore } from '../../util/socket/socketSessionStore';
import { manager } from '../../../domain/models/matchesManager';
import type { Match } from '../../../domain/models/match';
import socketErrorHandler from '../../util/socket/socketErrorHandler';
import * as createMatchLobbyEmitters from './createMatchLobbyEmitters';

export class CreateMatchLobbySocketController {
  private createMatchLobbyService = createMatchLobbyService;

  constructor() {}

  private resolveMatch(socketId: string): Match | undefined {
    try {
      const matchId = sessionStore.getMatchIdForSocket(socketId);
      return matchId ? manager.getMatch(matchId) : undefined;
    } catch {
      return undefined;
    }
  }

  handleRegisterPlayerLobby(playerInfo: RegisterPlayerLobbyParams, socketId: string): void {
    try {
      const { matchId, playerName } = playerInfo;
      const playerId = manager.getMatch(matchId).getPlayer(playerName).getId();
      sessionStore.register(socketId, '/createMatchSockets', matchId, playerName, playerId);
      createMatchLobbyEmitters.sendPlayerConnectedEvent(
        manager.getMatch(matchId),
        manager.getMatch(matchId).getPlayer(playerName)
      );
    } catch (err) {
      socketErrorHandler(this.resolveMatch(socketId), err);
    }
  }

  handleMatchStartInitiation(socketId: string): void {
    try {
      const session = sessionStore.lookup(socketId);
      if (!session || !session.matchId) return;
      const matchId = session.matchId;
      this.createMatchLobbyService.handleMatchStartInitiation(matchId);
      createMatchLobbyEmitters.sendMatchStartInitiationEvent(manager.getMatch(matchId));
    } catch (err) {
      socketErrorHandler(this.resolveMatch(socketId), err);
    }
  }

  handleDisconnectLobby(socketId: string): void {
    try {
      const session = sessionStore.unregister(socketId);
      if (session && session.matchId && session.playerName) {
        const disconnectionSource = this.createMatchLobbyService.handleDisconnectLobby(
          session.matchId,
          session.playerName
        );
        switch (disconnectionSource.type) {
          case 'HOST_LEFT':
            createMatchLobbyEmitters.sendHostDisconnectedEvent(session.matchId);
            break;
          case 'GUEST_LEFT':
            createMatchLobbyEmitters.sendPlayerDisconnectedEvent(manager.getMatch(session.matchId));
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

export const createMatchLobbySocketController = new CreateMatchLobbySocketController();
