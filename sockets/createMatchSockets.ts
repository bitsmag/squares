import { Socket } from 'socket.io';
import * as matchesManager from '../models/matchesManager';
import * as matchSocketService from '../services/matchSocketService';
import socketErrorHandler from '../middleware/socketErrorHandler';
import validation = require('../middleware/validation');
import type { Match } from '../models/match';
import type { Player } from '../models/player';

export function respond(socket: Socket): void {
  let match: Match | undefined;
  let player: Player | undefined;
  let startBtnClicked = false;

  socket.on('connectionInfo', function (playerInfo: any) {
    const result = validation.validateSocketPayload(validation.schemas.socketConnectionInfoCreate, playerInfo || {});
    if (!result.valid) {
      socketErrorHandler(match, new Error('Invalid connectionInfo payload'), 'createMatchSockets.connectionInfoValidation');
      console.warn('Invalid connectionInfo payload', result.errors);
      return;
    }

    const matchId = result.value.matchId as string;

    try {
      match = (matchesManager as any).manager.getMatch(matchId);
      player = match.getMatchCreator();
    } catch (err) {
      socketErrorHandler(match, err, 'createMatchSockets.on(connectionInfo)');
      return;
    }
    if (!player) return;
    player.setSocket(socket);
  });

  socket.on('disconnect', function () {
    if (match) {
      if (!startBtnClicked) {
        matchSocketService.sendMatchCreatorDisconnectedEvent(match);
        match.removePlayer(player);
        match.destroy();
      }
    }
  });

  socket.on('startBtnClicked', function () {
    startBtnClicked = true;
  });
}

module.exports = { respond } as any;
