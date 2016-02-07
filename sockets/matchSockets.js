"use strict";
let matchesManager    = require('../models/matchesManager');

/*
  * LISTENERS
  */

function respond(socket){
  let match;
  let player;

  socket.on('connectionInfo',function(playerInfo){
    let matchId, playerName;
    let error = false;
    try {
      // Filter all non alphanumeric values in params
      matchId = playerInfo.matchId.replace(/\W/g, '');
      playerName = playerInfo.playerName.replace(/\W/g, '');

      match = matchesManager.manager.getMatch(matchId);
      player = match.getPlayer(playerName);
    }
    catch(err) {
      error = true;
      sendFatalErrorEvent(match);
      match.destroy();
      console.warn(err.message + ' // matchSockets.on(connectionInfo)');
      console.trace();
    }
    if(!error){
      player.setSocket(socket);
      if(player.isMatchCreator()){
        sendPrepareMatchEvent(match);
        match.getController().startMatch();
      }
      else{
        let data = {playerNames: []};
        for(let i = 0; i < match.getPlayers().length; i++){
          data.playerNames.push(match.getPlayers()[i].getName());
        }
        player.getSocket().emit('connectedPlayers', data);
        sendPlayerConnectedEvent(match, player);
      }

    }
  });

  socket.on('disconnect',function(){
    let error = false;
    if(match) {
      match.removePlayer(player);
      sendPlayerDisconnectedEvent(match, player);
    }
  });

  socket.on('goLeft',function(){
    player.setActiveDirection('left');
  });

  socket.on('goUp',function(){
    player.setActiveDirection('up');
  });

  socket.on('goRight',function(){
    player.setActiveDirection('right');
  });

  socket.on('goDown',function(){
    player.setActiveDirection('down');
  });
}

/*
  * EMITERS
  */

function sendPlayerConnectedEvent(match, player){
  let data = {playerName: player.getName(),
            playerColor: player.getColor(),
            matchId: match.getId()};
  for(let i = 0; i < match.getPlayers().length; i++){
    if(match.getPlayers()[i].getName()!=data.playerName){
      match.getPlayers()[i].getSocket().emit('playerConnected', data);
    }
  }
}

function sendPlayerDisconnectedEvent(match, player){
  let data = {playerName: player.getName(),
            playerColor: player.getColor(),
            matchId: match.getId()};
  for(let i = 0; i < match.getPlayers().length; i++){
    if(match.getPlayers()[i].getName()!=data.playerName){
      match.getPlayers()[i].getSocket().emit('playerDisconnected', data);
    }
  }
}

function sendMatchCreatorDisconnectedEvent(match){
  for(let i = 0; i < match.getPlayers().length; i++){
    match.getPlayers()[i].getSocket().emit('matchCreatorDisconnected');
  }
}

function sendPrepareMatchEvent(match){
  let board = match.getBoard();
  let playersData = [];

  let players = match.getPlayers();
  for(let i = 0; i < players.length; i++){
    playersData[i] = {
      playerName: players[i].name,
      playerColor: players[i].color
    };
  }

  let data = {players: playersData,
              board: board};
  for(let i = 0; i < players.length; i++){
    players[i].getSocket().emit('prepareMatch', data);
  }
}


function sendUpdateBoardEvent(match, specials){
  let playerStatuses = {
    blue: {pos: null, dir: null, doubleSpeed: null},
    orange: {pos: null, dir: null, doubleSpeed: null},
    green: {pos: null, dir: null, doubleSpeed: null},
    red: {pos: null, dir: null, doubleSpeed: null}
  };
  let activeColors = [];
  let players = match.getPlayers();
  for(let i = 0; i<players.length; i++){
    activeColors.push(players[i].getColor());
  }
  for(let i = 0; i<activeColors.length; i++){
    try {
      playerStatuses[activeColors[i]].pos = match.getPlayerByColor(activeColors[i]).getPosition();
      playerStatuses[activeColors[i]].dir = match.getPlayerByColor(activeColors[i]).getActiveDirection();
      playerStatuses[activeColors[i]].doubleSpeed = match.getPlayerByColor(activeColors[i]).getDoubleSpeedSpecial();
    }
    catch(err) {
      sendFatalErrorEvent(match);
      match.destroy();
      console.warn(err.message + ' // matchSockets.sendUpdateBoardEvent()');
      console.trace();
    }
  }

  let data = {playerStatuses: playerStatuses,
      specials: specials,
      duration: match.getDuration()};
  for(let i = 0; i < match.getPlayers().length; i++){
    let thisColor = match.getPlayers()[i].getColor();
    match.getPlayers()[i].getSocket().emit('updateBoard', data);
  }
}

function sendClearSquaresEvent(match, clearSquares, clearSpecials){
  let data = {clearSquares: clearSquares, clearSpecials: clearSpecials};
  for(let i = 0; i < match.getPlayers().length; i++){
    let thisColor = match.getPlayers()[i].getColor();
    match.getPlayers()[i].getSocket().emit('clearSquares', data);
  }
}

function sendUpdateScoreEvent(match){
  let scores = {blue: null, orange: null, green: null, red: null};

  let activeColors = [];
  let players = match.getPlayers();
  for(let i = 0; i<players.length; i++){
    activeColors.push(players[i].getColor());
  }

  for(let i = 0; i<activeColors.length; i++){
    try {
      scores[activeColors[i]] = match.getPlayerByColor(activeColors[i]).getScore();
    }
    catch(err) {
      sendFatalErrorEvent(match);
      match.destroy();
      console.warn(err.message + ' // matchSockets.sendUpdateScoreEvent()');
      console.trace();
    }
  }

  let data = {scores: scores};
  for(let i = 0; i < match.getPlayers().length; i++){
    let thisColor = match.getPlayers()[i].getColor();
    match.getPlayers()[i].getSocket().emit('updateScore', data);
  }
}

function sendMatchEndEvent(match){
  for(let i = 0; i < match.getPlayers().length; i++){
    let thisColor = match.getPlayers()[i].getColor();
    match.getPlayers()[i].getSocket().emit('matchEnd');
  }
}

function sendCountdownEvent(match){
  let data = {countdownDuration: match.getCountdownDuration()};
  for(let i = 0; i < match.getPlayers().length; i++){
    match.getPlayers()[i].getSocket().emit('countdown', data);
  }
}

function sendFatalErrorEvent(match){
  for(let i = 0; i < match.getPlayers().length; i++){
    match.getPlayers()[i].getSocket().emit('fatalError');
  }
}

exports.respond = respond;
exports.sendPlayerConnectedEvent = sendPlayerConnectedEvent;
exports.sendMatchCreatorDisconnectedEvent = sendMatchCreatorDisconnectedEvent;
exports.sendPrepareMatchEvent = sendPrepareMatchEvent;
exports.sendUpdateBoardEvent = sendUpdateBoardEvent;
exports.sendClearSquaresEvent = sendClearSquaresEvent;
exports.sendUpdateScoreEvent = sendUpdateScoreEvent;
exports.sendMatchEndEvent = sendMatchEndEvent;
exports.sendCountdownEvent = sendCountdownEvent;
exports.sendFatalErrorEvent = sendFatalErrorEvent;
