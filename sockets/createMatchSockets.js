"use strict";
let matchesManager     = require('../models/matchesManager');
let matchSockets       = require('../sockets/matchSockets');

/*
  * LISTENERS
  */

function respond(socket){
  let match;
  let player;
  let startBtnClicked = false;

  socket.on('connectionInfo',function(playerInfo){
    // Filter all non alphanumeric values in params
    let matchId = playerInfo.matchId.replace(/\W/g, '');

    let error = false;
    try {
      match = matchesManager.manager.getMatch(playerInfo.matchId);
      player = match.getMatchCreator();
    }
    catch(err) {
      error = true;
      matchSockets.sendFatalErrorEvent(match);
      match.destroy();
      console.warn(err.message + ' // createMatchSockets.on(connectionInfo)');
      console.trace();
    }
    if(!error){
      player.setSocket(socket);
    }
  });

  socket.on('disconnect',function(){
    if(match){
      // If matchCreator disconnects from createMatch Page
      // without starting the match, the match is canceled
      if(!startBtnClicked){
        matchSockets.sendMatchCreatorDisconnectedEvent(match);
        match.removePlayer(player);
        match.destroy();
      }
    }
  });

  socket.on('startBtnClicked',function(){
    startBtnClicked = true;
  });
}

exports.respond = respond;
