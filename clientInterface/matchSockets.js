var matchesManager = require('../models/matchesManager');

/*
  * LISTENERS
  */

function respond(socket, io){

  socket.on('connectionInfo',function(info){
    function playerJoined(){ // TODO Should be in controller
      // Notify all players in room a player joined
      sendPlayerConnectedEvent(enquiringPlayer);

      // If four players joined (last one is always matchCreator) send startGameEvent
      if(Object.keys(io.nsps['/matchSockets'].adapter.rooms[info.matchID]).length === 4){
        sendPrepareGameEvent(info.matchID);
        associatedMatch.controller.runMatch();
      }
    }

    var enquiringPlayer = matchesManager.manager.getMatch(info.matchID).getPlayer(info.playerName);
    var associatedMatch = matchesManager.manager.getMatch(info.matchID);
    // Save socket in player object
    enquiringPlayer.socket = socket;
    // Join room + callback
    enquiringPlayer.socket.join(info.matchID.toString(), playerJoined);
  });

  socket.on('goLeft',function(info){
    var enquiringPlayer = matchesManager.manager.getMatch(info.matchID).getPlayer(info.playerName);
    enquiringPlayer.activeDirection = 'left';
  });

  socket.on('goUp',function(info){
    var enquiringPlayer = matchesManager.manager.getMatch(info.matchID).getPlayer(info.playerName);
    enquiringPlayer.activeDirection = 'up';
  });

  socket.on('goRight',function(info){
    var enquiringPlayer = matchesManager.manager.getMatch(info.matchID).getPlayer(info.playerName);
    enquiringPlayer.activeDirection = 'right';
  });

  socket.on('goDown',function(info){
    var enquiringPlayer = matchesManager.manager.getMatch(info.matchID).getPlayer(info.playerName);
    enquiringPlayer.activeDirection = 'down';
  });
}

/*
  * EMITERS
  */

// Sends the "player x has joined..." information to all clients in room
function sendPlayerConnectedEvent(enquiringPlayer){
  var playerInfo = {playerName: enquiringPlayer.name,
            playerColor: enquiringPlayer.color,
            matchID: enquiringPlayer.matchID};
  for(var i = 0; i < matchesManager.manager.getMatch(playerInfo.matchID).players.length; i++){
    matchesManager.manager.getMatch(playerInfo.matchID).players[i].socket.emit('player connected', playerInfo);
  }
}

// Sends prepare match event
function sendPrepareGameEvent(matchID){
  var board = matchesManager.manager.getMatch(matchID).board;
  for(var i = 0; i < matchesManager.manager.getMatch(matchID).players.length; i++){
    var thisColor = matchesManager.manager.getMatch(matchID).players[i].color;
    matchesManager.manager.getMatch(matchID).players[i].socket.emit('prepare match', board, thisColor);
  }
}

// Sends tickUpdate event - new Board state, match duration, player score ...
function sendTickUpdateEvent(matchID){
  var match = matchesManager.manager.getMatch(matchID);
  var data = {board: match.board.board,
      duration: match.duration,
      scores: {blue: match.getPlayerByColor('blue').score,
        orange: match.getPlayerByColor('orange').score,
        green: match.getPlayerByColor('green').score,
        red: match.getPlayerByColor('red').score}};
  for(var i = 0; i < matchesManager.manager.getMatch(matchID).players.length; i++){
    var thisColor = matchesManager.manager.getMatch(matchID).players[i].color;
    matchesManager.manager.getMatch(matchID).players[i].socket.emit('tickUpdate', data);
  }
}

// Send countdown event
function sendCountdownEvent(matchID, secondsLeft){
  for(var i = 0; i < matchesManager.manager.getMatch(matchID).players.length; i++){
    matchesManager.manager.getMatch(matchID).players[i].socket.emit('countdown', secondsLeft);
  }
}

exports.respond = respond;
exports.sendPlayerConnectedEvent = sendPlayerConnectedEvent;
exports.sendPrepareGameEvent = sendPrepareGameEvent;
exports.sendTickUpdateEvent = sendTickUpdateEvent;
exports.sendCountdownEvent = sendCountdownEvent;
