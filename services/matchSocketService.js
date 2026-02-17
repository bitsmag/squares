'use strict';
const socketErrorHandler = require('../middleware/socketErrorHandler');

function sendPlayerConnectedEvent(match, player) {
  const data = {
    playerName: player.getName(),
    playerColor: player.getColor(),
    matchId: match.getId(),
  };
  for (let i = 0; i < match.getPlayers().length; i++) {
    if (match.getPlayers()[i].getName() != data.playerName) {
      match.getPlayers()[i].getSocket().emit('playerConnected', data);
    }
  }
}

function sendPlayerDisconnectedEvent(match, player) {
  const data = {
    playerName: player.getName(),
    playerColor: player.getColor(),
    matchId: match.getId(),
  };
  for (let i = 0; i < match.getPlayers().length; i++) {
    if (match.getPlayers()[i].getName() != data.playerName) {
      match.getPlayers()[i].getSocket().emit('playerDisconnected', data);
    }
  }
}

function sendMatchCreatorDisconnectedEvent(match) {
  for (let i = 0; i < match.getPlayers().length; i++) {
    match.getPlayers()[i].getSocket().emit('matchCreatorDisconnected');
  }
}

function sendPrepareMatchEvent(match) {
  const board = match.getBoard();
  const playersData = [];

  const players = match.getPlayers();
  for (let i = 0; i < players.length; i++) {
    playersData[i] = {
      playerName: players[i].name,
      playerColor: players[i].color,
    };
  }

  const data = { players: playersData, board: board };
  for (let i = 0; i < players.length; i++) {
    players[i].getSocket().emit('prepareMatch', data);
  }
}

function sendUpdateBoardEvent(match, specials) {
  const playerStatuses = {
    blue: { pos: null, dir: null, doubleSpeed: null },
    orange: { pos: null, dir: null, doubleSpeed: null },
    green: { pos: null, dir: null, doubleSpeed: null },
    red: { pos: null, dir: null, doubleSpeed: null },
  };
  const activeColors = [];
  const players = match.getPlayers();
  for (let i = 0; i < players.length; i++) {
    activeColors.push(players[i].getColor());
  }
  for (let i = 0; i < activeColors.length; i++) {
    try {
      playerStatuses[activeColors[i]].pos = match.getPlayerByColor(activeColors[i]).getPosition();
      playerStatuses[activeColors[i]].dir = match
        .getPlayerByColor(activeColors[i])
        .getActiveDirection();
      playerStatuses[activeColors[i]].doubleSpeed = match
        .getPlayerByColor(activeColors[i])
        .getDoubleSpeedSpecial();
    } catch (err) {
      socketErrorHandler(match, err, 'sendUpdateBoardEvent()');
    }
  }

  const data = {
    playerStatuses: playerStatuses,
    specials: specials,
    duration: match.getDuration(),
  };
  for (let i = 0; i < match.getPlayers().length; i++) {
    match.getPlayers()[i].getSocket().emit('updateBoard', data);
  }
}

function sendClearSquaresEvent(match, clearSquares, clearSpecials) {
  const data = { clearSquares: clearSquares, clearSpecials: clearSpecials };
  for (let i = 0; i < match.getPlayers().length; i++) {
    match.getPlayers()[i].getSocket().emit('clearSquares', data);
  }
}

function sendUpdateScoreEvent(match) {
  const scores = { blue: null, orange: null, green: null, red: null };

  const activeColors = [];
  const players = match.getPlayers();
  for (let i = 0; i < players.length; i++) {
    activeColors.push(players[i].getColor());
  }

  for (let i = 0; i < activeColors.length; i++) {
    try {
      scores[activeColors[i]] = match.getPlayerByColor(activeColors[i]).getScore();
    } catch (err) {
      socketErrorHandler(match, err, 'sendUpdateScoreEvent()');
    }
  }

  const data = { scores: scores };
  for (let i = 0; i < match.getPlayers().length; i++) {
    match.getPlayers()[i].getSocket().emit('updateScore', data);
  }
}

function sendMatchEndEvent(match) {
  for (let i = 0; i < match.getPlayers().length; i++) {
    match.getPlayers()[i].getSocket().emit('matchEnd');
  }
}

function sendCountdownEvent(match) {
  const data = { countdownDuration: match.getCountdownDuration() };
  for (let i = 0; i < match.getPlayers().length; i++) {
    match.getPlayers()[i].getSocket().emit('countdown', data);
  }
}

function sendFatalErrorEvent(match) {
  for (let i = 0; i < match.getPlayers().length; i++) {
    try {
      match.getPlayers()[i].getSocket().emit('fatalError');
    } catch (e) {
      // ignore per-player emit errors
    }
  }
}

exports.sendPlayerConnectedEvent = sendPlayerConnectedEvent;
exports.sendPlayerDisconnectedEvent = sendPlayerDisconnectedEvent;
exports.sendMatchCreatorDisconnectedEvent = sendMatchCreatorDisconnectedEvent;
exports.sendPrepareMatchEvent = sendPrepareMatchEvent;
exports.sendUpdateBoardEvent = sendUpdateBoardEvent;
exports.sendClearSquaresEvent = sendClearSquaresEvent;
exports.sendUpdateScoreEvent = sendUpdateScoreEvent;
exports.sendMatchEndEvent = sendMatchEndEvent;
exports.sendCountdownEvent = sendCountdownEvent;
exports.sendFatalErrorEvent = sendFatalErrorEvent;
