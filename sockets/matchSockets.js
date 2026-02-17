"use strict";
const matchesManager = require('../models/matchesManager');
const socketErrorHandler = require('../middleware/socketErrorHandler');
const matchSocketService = require('../services/matchSocketService');

/*
 * LISTENERS
 */

function respond(socket) {
  let match;
  let player;

  socket.on('connectionInfo', function (playerInfo) {
    // Validate socket payload
    const validation = require('../middleware/validation');
    const result = validation.validateSocketPayload(validation.schemas.socketConnectionInfoMatch, playerInfo || {});
    if (!result.valid) {
      socketErrorHandler(match, new Error('Invalid connectionInfo payload'), 'matchSockets.connectionInfoValidation');
      console.warn('Invalid connectionInfo payload', result.errors);
      return;
    }

    let matchId = result.value.matchId;
    let playerName = result.value.playerName;
    let error = false;
    try {
      match = matchesManager.manager.getMatch(matchId);
      player = match.getPlayer(playerName);
    } catch (err) {
      error = true;
      socketErrorHandler(match, err, 'matchSockets.on(connectionInfo)');
    }
    if (!error) {
      player.setSocket(socket);
      if (player.isMatchCreator()) {
        matchSocketService.sendPrepareMatchEvent(match);
        match.getController().startMatch();
      } else {
        const data = { playerNames: [] };
        for (let i = 0; i < match.getPlayers().length; i++) {
          data.playerNames.push(match.getPlayers()[i].getName());
        }
        player.getSocket().emit('connectedPlayers', data);
        matchSocketService.sendPlayerConnectedEvent(match, player);
      }
    }
  });

  socket.on('disconnect', function () {
    if (match) {
      match.removePlayer(player);
      matchSocketService.sendPlayerDisconnectedEvent(match, player);
    }
  });

  socket.on('goLeft', function () {
    player.setActiveDirection('left');
  });

  socket.on('goUp', function () {
    player.setActiveDirection('up');
  });

  socket.on('goRight', function () {
    player.setActiveDirection('right');
  });

  socket.on('goDown', function () {
    player.setActiveDirection('down');
  });
}

exports.respond = respond;
exports.sendPlayerConnectedEvent = matchSocketService.sendPlayerConnectedEvent;
exports.sendPlayerDisconnectedEvent = matchSocketService.sendPlayerDisconnectedEvent;
exports.sendMatchCreatorDisconnectedEvent = matchSocketService.sendMatchCreatorDisconnectedEvent;
exports.sendPrepareMatchEvent = matchSocketService.sendPrepareMatchEvent;
exports.sendUpdateBoardEvent = matchSocketService.sendUpdateBoardEvent;
exports.sendClearSquaresEvent = matchSocketService.sendClearSquaresEvent;
exports.sendUpdateScoreEvent = matchSocketService.sendUpdateScoreEvent;
exports.sendMatchEndEvent = matchSocketService.sendMatchEndEvent;
exports.sendCountdownEvent = matchSocketService.sendCountdownEvent;
exports.sendFatalErrorEvent = matchSocketService.sendFatalErrorEvent;
