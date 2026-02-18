import { Socket } from 'socket.io';
import { manager } from '../../models/matchesManager';
import * as matchSocketService from './matchSocketEmitters';
import socketErrorHandler from '../middleware/socketErrorHandler';
import * as validation from '../middleware/validation';
import type { SocketConnectionInfoCreate } from '../middleware/validation';
import type { Match } from '../../models/match';
import type { Player } from '../../models/player';

export function respond(socket: Socket): void {
  let match: Match | undefined;
  let player: Player | undefined;
  let startBtnClicked = false;

  socket.on('connectionInfo', function (playerInfo: unknown) {
    const result = validation.validateSocketPayload<SocketConnectionInfoCreate>(
      validation.schemas.socketConnectionInfoCreate,
      playerInfo || {}
    );
    if (!result.valid) {
      socketErrorHandler(
        match,
        new Error('Invalid connectionInfo payload'),
        'createMatchSocketListeners.connectionInfoValidation'
      );
      console.warn('Invalid connectionInfo payload', result.errors);
      return;
    }

    const matchId = result.value.matchId;

    try {
      match = manager.getMatch(matchId);
      player = match.getMatchCreator();
    } catch (err) {
      socketErrorHandler(match, err, 'createMatchSocketListeners.on(connectionInfo)');
      return;
    }
    if (!player) return;
    player.setSocket(socket);
  });

  socket.on('disconnect', function () {
    if (match && player && !startBtnClicked) {
      matchSocketService.sendMatchCreatorDisconnectedEvent(match);
      match.removePlayer(player);
      match.destroy();
    }
  });

  socket.on('startBtnClicked', function () {
    startBtnClicked = true;
  });
}
