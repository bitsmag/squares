import * as validation from '../../util/validation';
import type {
  RegisterPlayerLobbyParams,
  MatchStartInitiationParams,
} from '../../util/validation';
import type { Socket } from 'socket.io';
import { createMatchLobbyService } from '../../../service/createMatchLobbyService';
import { sessionStore } from '../../util/socket/sessionStore';
import { manager } from '../../../domain/models/matchesManager';
import socketErrorHandler from '../../util/socket/socketErrorHandler';
import * as createMatchLobbyEmitters from './createMatchLobbyEmitters';

export class CreateMatchLobbySocketController {
  private createMatchLobbyService = createMatchLobbyService;

  constructor() {}

  registerPlayerLobby(playerInfo: unknown, socket: Socket): void {
    try {
      const playerInfoResult = validation.validateSocketPayload<RegisterPlayerLobbyParams>(
        validation.schemas.registerPlayerLobbyParams,
        playerInfo || {}
      );
      if (!playerInfoResult.valid) {
        socketErrorHandler(
          undefined,
          new Error(
            'Invalid registerPlayerLobby payload'
          )
        );
        return;
      }
      const matchId = playerInfoResult.value.matchId;
      const playerName = playerInfoResult.value.playerName;
      const playerId = manager.getMatch(matchId).getPlayer(playerName).getId();
      sessionStore.register(socket, '/createMatchSockets', matchId, playerName, playerId);
      createMatchLobbyEmitters.sendPlayerConnectedEvent(
        manager.getMatch(matchId),
        manager.getMatch(matchId).getPlayer(playerName)
      );
    } catch (err) {
      socketErrorHandler(undefined, err);
    }
  }

  handleMatchStartInitiation(matchId: unknown, socket: Socket): void {
    try {
      const matchIdResult = validation.validateSocketPayload<MatchStartInitiationParams>(
        validation.schemas.matchStartInitiationParams,
        matchId || {}
      );
      if (!matchIdResult.valid) {
        socketErrorHandler(
          undefined,
          new Error(
            'Invalid matchStartInitiation payload'
          )
        );
        return;
      }
      this.createMatchLobbyService.handleMatchStartInitiation(matchIdResult.value.matchId);
      createMatchLobbyEmitters.sendMatchStartInitiationEvent(
        manager.getMatch(matchIdResult.value.matchId)
      );
    } catch (err) {
      socketErrorHandler(undefined, err);
    }
  }

  handleDisconnectLobby(socket: Socket): void {
    try {
      const session = sessionStore.unregister(socket);
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
      socketErrorHandler(undefined, err);
    }
  }
}

export const createMatchLobbySocketController = new CreateMatchLobbySocketController();
