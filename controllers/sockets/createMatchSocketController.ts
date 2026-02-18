import * as validation from '../../infrastructure/middleware/validation';
import type { SocketConnectionInfoCreate } from '../../infrastructure/middleware/validation';
import type { Socket } from 'socket.io';
import { CreateMatchLobbyService } from '../../services/createMatchLobbyService';
import socketErrorHandler from '../../infrastructure/middleware/socketErrorHandler';

export class CreateMatchSocketController {
  private socket: Socket;
  private lobbyService: CreateMatchLobbyService;
  private startBtnClicked = false;

  constructor(socket: Socket) {
    this.socket = socket;
    this.lobbyService = new CreateMatchLobbyService();
  }

  handleConnectionInfo(playerInfo: unknown): void {
    const result = validation.validateSocketPayload<SocketConnectionInfoCreate>(
      validation.schemas.socketConnectionInfoCreate,
      playerInfo || {}
    );
    if (!result.valid) {
      socketErrorHandler(
        undefined,
        new Error('Invalid connectionInfo payload'),
        'createMatchSocketController.handleConnectionInfo'
      );
      console.warn('Invalid connectionInfo payload', result.errors);
      return;
    }

    const matchId = result.value.matchId;
    this.lobbyService.registerHost(matchId, this.socket);
  }

  handleDisconnect(): void {
    if (!this.startBtnClicked) {
      this.lobbyService.handleEarlyDisconnect();
    }
  }

  handleStartClicked(): void {
    this.startBtnClicked = true;
  }
}
