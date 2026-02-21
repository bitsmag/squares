import socketErrorHandler from '../../util/socket/socketErrorHandler';
import * as validation from '../../util/validation';
import type { RegisterPlayerMatchParams } from '../../util/validation';
import type { Socket } from 'socket.io';
import { matchService } from '../../../service/matchService';
import { sessionStore } from '../../util/socket/sessionStore';
import { manager } from '../../../domain/models/matchesManager';

export class MatchSocketController {
  private matchService = matchService;

  constructor() {}

  handleRegisterPlayerAndStartMatch(playerInfo: unknown, socket: Socket): void {
    try {
      const playerInfoResult = validation.validateSocketPayload<RegisterPlayerMatchParams>(
        validation.schemas.registerPlayerMatchParams,
        playerInfo || {}
      );
      if (!playerInfoResult.valid) {
        socketErrorHandler(undefined, new Error('Invalid registerPlayerMatch payload'));
        return;
      }
      const { matchId, playerName } = playerInfoResult.value;
      const playerId = manager.getMatch(matchId).getPlayer(playerName).getId();
      sessionStore.register(socket, '/matchSockets', matchId, playerName, playerId);
      this.matchService.handleRegisterPlayerAndStartMatch(matchId, playerName);
    } catch (err) {
      socketErrorHandler(undefined, err);
    }
  }

  handleDisconnectMatch(socketId: string): void {
    try {
      const playerId = sessionStore.getPlayerIdForSocket(socketId);
      const matchId = sessionStore.getMatchIdForSocket(socketId);
      if (!playerId || !matchId) return;
      this.matchService.handleDisconnectMatch(matchId, playerId);
      sessionStore.unregister(socketId);
    } catch (err) {
      socketErrorHandler(undefined, err);
    }
  }

  handleDirection(direction: 'left' | 'up' | 'right' | 'down', socketId: string): void {
    try {
      const matchId = sessionStore.getMatchIdForSocket(socketId);
      const playerId = sessionStore.getPlayerIdForSocket(socketId);
      if (!playerId || !matchId) return;
      this.matchService.setDirection(matchId, playerId, direction);
    } catch (err) {
      socketErrorHandler(undefined, err);
    }
  }
}

export const matchSocketController = new MatchSocketController();
