'use strict';
const matchesManager = require('../models/matchesManager');
const matchSockets = require('../sockets/matchSockets');

/*
 * LISTENERS
 */

function respond(socket) {
  let match;
  let player;
  let startBtnClicked = false;

  socket.on('connectionInfo', function (playerInfo) {
    // Validate socket payload
    const validation = require('../middleware/validation');
    const result = validation.validateSocketPayload(validation.schemas.socketConnectionInfoCreate, playerInfo || {});
    if (!result.valid) {
      matchSockets.sendFatalErrorEvent(match);
      console.warn('Invalid connectionInfo payload', result.errors);
      return;
    }

    const matchId = result.value.matchId;

    let error = false;
    try {
      match = matchesManager.manager.getMatch(matchId);
      player = match.getMatchCreator();
    } catch (err) {
      error = true;
      matchSockets.sendFatalErrorEvent(match);
      if (match && typeof match.destroy === 'function') match.destroy();
      console.warn(err.message + ' // createMatchSockets.on(connectionInfo)');
      console.trace();
    }
    if (!error) {
      player.setSocket(socket);
    }
  });

  socket.on('disconnect', function () {
    if (match) {
      // If matchCreator disconnects from createMatch Page
      // without starting the match, the match is canceled
      if (!startBtnClicked) {
        matchSockets.sendMatchCreatorDisconnectedEvent(match);
        match.removePlayer(player);
        match.destroy();
      }
    }
  });

  socket.on('startBtnClicked', function () {
    startBtnClicked = true;
  });
}

exports.respond = respond;
