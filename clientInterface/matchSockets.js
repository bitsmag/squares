var matchesManager = require('../models/matchesManager');

/*
  * LISTENERS
  */

function respond(socket, io){

  socket.on('connectionInfo',function(info){
    function playerJoined(){
      // Notify all players in room a player joined
      sendPlayerConnectedEvent(enquiringPlayer);

      // If four players joined (last one is always matchCreator) send startGameEvent
      if(Object.keys(io.nsps['/matchSockets'].adapter.rooms[info.matchID]).length === 4){
        sendPrepareGameEvent(info.matchID);
        enquiringMatch.controller.runMatch();
      }
    }

    var enquiringMatch = matchesManager.manager.getMatch(info.matchID);
    if(enquiringMatch instanceof Error){
      // In case of error notify user and delete the match
      if(enquiringPlayer.message==='matchNotFound'){
        socket.emit('error', 'matchNotFound');
      }
      else{
        socket.emit('error', 'unknownError');
      }

      matchesManager.manager.removeMatch(matchID);
      console.log('error on createMatchSockets - Removed Match.');
      console.log(enquiringMatch.message);
    }
    else{
      var enquiringPlayer = enquiringMatch.getPlayer(info.playerName);
      if(enquiringPlayer instanceof Error){
        // In case of error notify user and delete the match
        if(enquiringPlayer.message==='playerNotFound'){
          socket.emit('error', 'playerNotFound');
        }
        else{
          socket.emit('error', 'unknownError');
        }

        matchesManager.manager.removeMatch(matchID);
        console.log('error on createMatchSockets - Removed Match.');
        console.log(enquiringPlayer.message);
      }
      else{
        // Save socket in player object
        enquiringPlayer.socket = socket;
        // Join room + callback
        enquiringPlayer.socket.join(info.matchID.toString(), playerJoined);
      }
  }
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
  var players = new Array();
  for(var i = 0; i < matchesManager.manager.getMatch(matchID).players.length; i++){
    players[i] = {
      name: matchesManager.manager.getMatch(matchID).players[i].name,
      color: matchesManager.manager.getMatch(matchID).players[i].color
    };
  }
  for(var i = 0; i < matchesManager.manager.getMatch(matchID).players.length; i++){
    var thisColor = matchesManager.manager.getMatch(matchID).players[i].color;
    matchesManager.manager.getMatch(matchID).players[i].socket.emit('prepare match', board, thisColor, players);
  }
}

// Sends updateBoard event - new Board state, match duration
function sendUpdateBoardEvent(matchID){
  var match = matchesManager.manager.getMatch(matchID);
  var data = {board: match.board.board,
      duration: match.duration};
  for(var i = 0; i < matchesManager.manager.getMatch(matchID).players.length; i++){
    var thisColor = matchesManager.manager.getMatch(matchID).players[i].color;
    matchesManager.manager.getMatch(matchID).players[i].socket.emit('updateBoard', data);
  }
}

// Sends updateScore event - new player score
function sendUpdateScoreEvent(matchID){
  var match = matchesManager.manager.getMatch(matchID);
  var data = {scores: {blue: match.getPlayerByColor('blue').score,
    orange: match.getPlayerByColor('orange').score,
    green: match.getPlayerByColor('green').score,
    red: match.getPlayerByColor('red').score}};
  for(var i = 0; i < matchesManager.manager.getMatch(matchID).players.length; i++){
    var thisColor = matchesManager.manager.getMatch(matchID).players[i].color;
    matchesManager.manager.getMatch(matchID).players[i].socket.emit('updateScore', data);
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
exports.sendUpdateScoreEvent = sendUpdateScoreEvent;
exports.sendCountdownEvent = sendCountdownEvent;
