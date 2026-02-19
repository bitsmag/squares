import * as validation from '../../infrastructure/middleware/validation';
import type { RegisterPlayerLobbyParams, MatchStartInitiationParams } from '../../infrastructure/middleware/validation';
import type { Socket } from 'socket.io';
import { CreateMatchLobbyService } from '../../services/createMatchLobbyService';
import socketErrorHandler from '../../infrastructure/middleware/socketErrorHandler';

export class CreateMatchLobbySocketController {

  private createMatchLobbyService: CreateMatchLobbyService;

  constructor() {
    this.createMatchLobbyService = new CreateMatchLobbyService();
  }

  registerPlayerLobby(playerInfo: unknown, socket: Socket): void {
    const playerInfoResult = validation.validateSocketPayload<RegisterPlayerLobbyParams>(
      validation.schemas.registerPlayerLobbyParams,
      playerInfo || {}
    );
    if (!playerInfoResult.valid) {
      socketErrorHandler(undefined, new Error('Invalid registerPlayerLobby payload in CreateMatchLobbySocketController.registerPlayerLobby'));
      return;
    }
    const matchId = playerInfoResult.value.matchId;
    const playerName = playerInfoResult.value.playerName;
    this.createMatchLobbyService.handlerRegisterPlayer(matchId, playerName, socket);
  }

  handleMatchStartInitiation(matchId: unknown): void {
    const matchIdResult = validation.validateSocketPayload<MatchStartInitiationParams>(
      validation.schemas.matchStartInitiationParams,
      matchId || {}
    );
    if (!matchIdResult.valid) {
      socketErrorHandler(undefined, new Error('Invalid matchStartInitiation payload in CreateMatchLobbySocketController.handleMatchStartInitiation')
      );
      return;
    }
    this.createMatchLobbyService.handleMatchStartInitiation(matchIdResult.value.matchId);
  }

  handleDisconnectLobby(socket: Socket): void {
      this.createMatchLobbyService.handleDisconnectLobby(socket);
  }

}
