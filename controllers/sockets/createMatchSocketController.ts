import * as validation from '../../infrastructure/middleware/validation';
import type { SocketConnectionInfoCreate, MatchStartInitiationParams } from '../../infrastructure/middleware/validation';
import type { Socket } from 'socket.io';
import { CreateMatchLobbyService } from '../../services/createMatchLobbyService';
import socketErrorHandler from '../../infrastructure/middleware/socketErrorHandler';

export class CreateMatchSocketController {

  private lobbyService: CreateMatchLobbyService;
  private startBtnClicked = false;

  constructor() {
    this.lobbyService = new CreateMatchLobbyService();
  }

  handleConnectionInfo(playerInfo: unknown, socket: Socket): void {
    const playerInfoResult = validation.validateSocketPayload<SocketConnectionInfoCreate>(
      validation.schemas.socketConnectionInfoCreate,
      playerInfo || {}
    );
    if (!playerInfoResult.valid) {
      socketErrorHandler(
        undefined,
        new Error('Invalid connectionInfo payload'),
        'createMatchSocketController.handleConnectionInfo'
      );
      console.warn('Invalid connectionInfo payload', playerInfoResult.errors);
      return;
    }

    const matchId = playerInfoResult.value.matchId;
    this.lobbyService.registerHost(matchId, socket);
  }

  handleConnectionInfoGuest(playerInfo: unknown, socket: Socket): void {
    const playerInfoResult = validation.validateSocketPayload<SocketConnectionInfoCreate>(
      validation.schemas.socketConnectionInfoCreate,
      playerInfo || {}
    );
    if (!playerInfoResult.valid) {
      socketErrorHandler(
        undefined,
        new Error('Invalid connectionInfoGuest payload'),
        'createMatchSocketController.handleConnectionInfoGuest'
      );
      console.warn('Invalid connectionInfoGuest payload', playerInfoResult.errors);
      return;
    }

    const matchId = playerInfoResult.value.matchId;
    const playerName = playerInfoResult.value.playerName;
    this.lobbyService.registerGuest(matchId, playerName, socket);
  }

  handleDisconnect(socket: Socket): void {
    if (!this.startBtnClicked) {
      this.lobbyService.handleEarlyDisconnect(socket);
    }
  }

  handleMatchStartInitiation(matchId: unknown): void {
    const matchIdResult = validation.validateSocketPayload<MatchStartInitiationParams>(
      validation.schemas.matchStartInitiationParams,
      matchId || {}
    );
    if (!matchIdResult.valid) {
      socketErrorHandler(
        undefined,
        new Error('Invalid matchStartInitiation payload'),
        'createMatchSocketController.handleMatchStartInitiation'
      );
      console.warn('Invalid matchStartInitiation payload', matchIdResult.errors);
      return;
    }
    this.lobbyService.handleMatchStartInitiation(matchIdResult.value.matchId);
  }
}
