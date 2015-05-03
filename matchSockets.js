var matchesManager = require('./matchesManager');

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
        associatedMatch.controller.countdown(5);
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

// Sends update board event
function sendUpdateBoardEvent(matchID){
  var board = matchesManager.manager.getMatch(matchID).board;
  for(var i = 0; i < matchesManager.manager.getMatch(matchID).players.length; i++){
    var thisColor = matchesManager.manager.getMatch(matchID).players[i].color;
    matchesManager.manager.getMatch(matchID).players[i].socket.emit('update board', board);
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
exports.sendUpdateBoardEvent = sendUpdateBoardEvent;
exports.sendCountdownEvent = sendCountdownEvent;
