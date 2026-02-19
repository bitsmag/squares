import socketErrorHandler from '../../infrastructure/middleware/socketErrorHandler';
import * as validation from '../../infrastructure/middleware/validation';
import type { RegisterPlayerMatchParams } from '../../infrastructure/middleware/validation';
import type { Socket } from 'socket.io';
import { MatchService } from '../../services/matchService';

export class MatchSocketController {
  private matchService: MatchService;

  constructor() {
    this.matchService = new MatchService();
  }

  handleRegisterPlayerAndStartMatch(playerInfo: unknown, socket: Socket): void {
    const result = validation.validateSocketPayload<RegisterPlayerMatchParams>(
      validation.schemas.registerPlayerMatchParams,
      playerInfo || {}
    );
    if (!result.valid) {
      socketErrorHandler(undefined, new Error('Invalid registerPlayerMatch payload'));
      return;
    }
    const { matchId, playerName } = result.value;
    this.matchService.handleRegisterPlayerAndStartMatch(matchId, playerName, socket);
  }

  handleDisconnectMatch(socket: Socket): void {
    this.matchService.handleDisconnectMatch(socket);
  }

  handleDirection(direction: 'left' | 'up' | 'right' | 'down'): void {
    this.matchService.setDirection(direction);
  }
}
