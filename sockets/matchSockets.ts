import { Socket } from 'socket.io';
import { manager } from '../models/matchesManager';
import socketErrorHandler from '../middleware/socketErrorHandler';
import * as matchSocketService from '../services/matchSocketService';
import * as validation from '../middleware/validation';
import type { SocketConnectionInfoMatch } from '../middleware/validation';
import type { Match } from '../models/match';
import type { Player } from '../models/player';

export function respond(socket: Socket): void {
  let match: Match | undefined;
  let player: Player | undefined;

  socket.on('connectionInfo', function (playerInfo: unknown) {
    const result = validation.validateSocketPayload<SocketConnectionInfoMatch>(
      validation.schemas.socketConnectionInfoMatch,
      playerInfo || {}
    );
    if (!result.valid) {
      socketErrorHandler(
        match,
        new Error('Invalid connectionInfo payload'),
        'matchSockets.connectionInfoValidation'
      );
      console.warn('Invalid connectionInfo payload', result.errors);
      return;
    }

    const matchId = result.value.matchId;
    const playerName = result.value.playerName;
    try {
      match = manager.getMatch(matchId);
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
      const sock = player.getSocket();
      if (sock) sock.emit('connectedPlayers', data);
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
