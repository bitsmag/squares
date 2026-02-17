import { Socket } from 'socket.io';
import * as matchesManager from '../models/matchesManager';
import socketErrorHandler from '../middleware/socketErrorHandler';
import * as matchSocketService from '../services/matchSocketService';
import validation = require('../middleware/validation');
import type { Match } from '../models/match';
import type { Player } from '../models/player';

export function respond(socket: Socket): void {
  let match: Match | undefined;
  let player: Player | undefined;

  socket.on('connectionInfo', function (playerInfo: any) {
    const result = validation.validateSocketPayload(validation.schemas.socketConnectionInfoMatch, playerInfo || {});
    if (!result.valid) {
      socketErrorHandler(match, new Error('Invalid connectionInfo payload'), 'matchSockets.connectionInfoValidation');
      console.warn('Invalid connectionInfo payload', result.errors);
      return;
    }

    const matchId = result.value.matchId as string;
    const playerName = result.value.playerName as string;
    try {
      match = (matchesManager as any).manager.getMatch(matchId);
      player = match.getPlayer(playerName);
    } catch (err) {
      socketErrorHandler(match, err, 'matchSockets.on(connectionInfo)');
      return;
    }

    if (!player || !match) return;

    player.setSocket(socket);
    if (player.isMatchCreator()) {
      matchSocketService.sendPrepareMatchEvent(match);
      match.getController().startMatch();
    } else {
      const data = { playerNames: [] as string[] };
      for (let i = 0; i < match.getPlayers().length; i++) {
        data.playerNames.push(match.getPlayers()[i].getName());
      }
      player.getSocket().emit('connectedPlayers', data);
      matchSocketService.sendPlayerConnectedEvent(match, player);
    }
  });

  socket.on('disconnect', function () {
    if (match && player) {
      match.removePlayer(player);
      matchSocketService.sendPlayerDisconnectedEvent(match, player);
    }
  });

  socket.on('goLeft', function () {
    if (player) player.setActiveDirection('left');
  });

  socket.on('goUp', function () {
    if (player) player.setActiveDirection('up');
  });

  socket.on('goRight', function () {
    if (player) player.setActiveDirection('right');
  });

  socket.on('goDown', function () {
    if (player) player.setActiveDirection('down');
  });
}

module.exports = {
  respond,
  sendPlayerConnectedEvent: matchSocketService.sendPlayerConnectedEvent,
  sendPlayerDisconnectedEvent: matchSocketService.sendPlayerDisconnectedEvent,
  sendMatchCreatorDisconnectedEvent: matchSocketService.sendMatchCreatorDisconnectedEvent,
  sendPrepareMatchEvent: matchSocketService.sendPrepareMatchEvent,
  sendUpdateBoardEvent: matchSocketService.sendUpdateBoardEvent,
  sendClearSquaresEvent: matchSocketService.sendClearSquaresEvent,
  sendUpdateScoreEvent: matchSocketService.sendUpdateScoreEvent,
  sendMatchEndEvent: matchSocketService.sendMatchEndEvent,
  sendCountdownEvent: matchSocketService.sendCountdownEvent,
  sendFatalErrorEvent: matchSocketService.sendFatalErrorEvent,
} as any;
