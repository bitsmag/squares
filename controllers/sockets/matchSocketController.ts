import socketErrorHandler from '../../infrastructure/middleware/socketErrorHandler';
import * as validation from '../../infrastructure/middleware/validation';
import type { SocketConnectionInfoMatch } from '../../infrastructure/middleware/validation';
import type { Socket } from 'socket.io';
import { MatchSocketSessionService } from '../../services/matchSocketSessionService';

export class MatchSocketController {
  private socket: Socket;
  private sessionService: MatchSocketSessionService;

  constructor(socket: Socket) {
    this.socket = socket;
    this.sessionService = new MatchSocketSessionService();
  }

  handleConnectionInfo(playerInfo: unknown): void {
    const result = validation.validateSocketPayload<SocketConnectionInfoMatch>(
      validation.schemas.socketConnectionInfoMatch,
      playerInfo || {}
    );
    if (!result.valid) {
      socketErrorHandler(
        undefined,
        new Error('Invalid connectionInfo payload'),
        'MatchSocketController.handleConnectionInfo'
      );
      console.warn('Invalid connectionInfo payload', result.errors);
      return;
    }

    const { matchId, playerName } = result.value;
    this.sessionService.registerConnection(matchId, playerName, this.socket);
  }

  handleDisconnect(): void {
    this.sessionService.handleDisconnect();
  }

  handleDirection(direction: 'left' | 'up' | 'right' | 'down'): void {
    this.sessionService.setDirection(direction);
  }
}
