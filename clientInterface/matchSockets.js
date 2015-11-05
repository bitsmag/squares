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
      console.warn(enquiringMatch.message + ' // matchSockets.on(connectionInfo) - getMatch() // matchID=' + info.matchID);
    }
    else{
      var enquiringPlayer = enquiringMatch.getPlayer(info.playerName);
      if(enquiringPlayer instanceof Error){
        console.warn(enquiringPlayer.message + ' // matchSockets.on(connectionInfo) - getPlayer() // matchID=' + info.matchID + ', playerName=' + info.playerName);
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
    var match = matchesManager.manager.getMatch(info.matchID);
    if(match instanceof Error){
      console.warn(match.message + ' // matchSockets.on(goLeft) - getMatch() // matchID=' + matchID);
    }
    else{
      var player = match.getPlayer(info.playerName)
      if(player instanceof Error){
        console.warn(match.message + ' // matchSockets.on(goLeft) - getPlayer() // matchID=' + matchID);
      }
      else{
        player.activeDirection = 'left';
      }
    }
  });

  socket.on('goUp',function(info){
    var match = matchesManager.manager.getMatch(info.matchID);
    if(match instanceof Error){
      console.warn(match.message + ' // matchSockets.on(goUp) - getMatch() // matchID=' + matchID);
    }
    else{
      var player = match.getPlayer(info.playerName)
      if(player instanceof Error){
        console.warn(match.message + ' // matchSockets.on(goUp) - getPlayer() // matchID=' + matchID);
      }
      else{
        player.activeDirection = 'up';
      }
    }
  });


  socket.on('goRight',function(info){
    var match = matchesManager.manager.getMatch(info.matchID);
    if(match instanceof Error){
      console.warn(match.message + ' // matchSockets.on(goRigth) - getMatch() // matchID=' + matchID);
    }
    else{
      var player = match.getPlayer(info.playerName)
      if(player instanceof Error){
        console.warn(match.message + ' // matchSockets.on(goRight) - getPlayer() // matchID=' + matchID);
      }
      else{
        player.activeDirection = 'right';
      }
    }
  });

  socket.on('goDown',function(info){
    var match = matchesManager.manager.getMatch(info.matchID);
    if(match instanceof Error){
      console.warn(match.message + ' // matchSockets.on(goDown) - getMatch() // matchID=' + matchID);
    }
    else{
      var player = match.getPlayer(info.playerName)
      if(player instanceof Error){
        console.warn(match.message + ' // matchSockets.on(goDown) - getPlayer() // matchID=' + matchID);
      }
      else{
        player.activeDirection = 'down';
      }
    }
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

  var match = matchesManager.manager.getMatch(enquiringPlayer.matchID);
  if(match instanceof Error){
    console.warn(match.message + ' // matchSockets.sendPlayerConnectedEvent() - getMatch() // matchID=' + matchID);
  }
  for(var i = 0; i < match.players.length; i++){
    match.players[i].socket.emit('player connected', playerInfo);
  }
}

// Sends prepare match event
function sendPrepareGameEvent(matchID){
  var match = matchesManager.manager.getMatch(matchID);
  if(match instanceof Error){
    console.warn(match.message + ' // matchSockets.sendPrepareGameEvent() - getMatch() // matchID=' + matchID);
  }
  else{
    var board = match.board;
    var players = match.players;
    var p = new Array();

    for(var i = 0; i < players.length; i++){
      p[i] = {
        name: players[i].name,
        color: players[i].color
      };
    }
    for(var i = 0; i < players.length; i++){
      var thisColor = players[i].color;
      players[i].socket.emit('prepare match', board, thisColor, p);
    }
  }
}

// Sends updateBoard event - new Board state, match duration
function sendUpdateBoardEvent(matchID){
  var match = matchesManager.manager.getMatch(matchID);
  if(match instanceof Error){
    console.warn(match.message + ' // matchSockets.sendUpdateBoardEvent() - getMatch() // matchID=' + matchID);
  }
  else{
    var data = {board: match.board.board,
        duration: match.duration};
    for(var i = 0; i < match.players.length; i++){
      var thisColor = match.players[i].color;
      match.players[i].socket.emit('updateBoard', data);
    }
  }
}

// Sends updateScore event - new player score
function sendUpdateScoreEvent(matchID){
  var match = matchesManager.manager.getMatch(matchID);
  if(match instanceof Error){
    console.warn(match.message + ' // matchSockets.sendUpdateScoreEvent() - getMatch() // matchID=' + matchID);
  }
  else{
    var data = {scores: {blue: match.getPlayerByColor('blue').score,
      orange: match.getPlayerByColor('orange').score,
      green: match.getPlayerByColor('green').score,
      red: match.getPlayerByColor('red').score}};
    for(var i = 0; i < match.players.length; i++){
      var thisColor = match.players[i].color;
      match.players[i].socket.emit('updateScore', data);
    }
  }
}

// Send countdown event
function sendCountdownEvent(matchID, secondsLeft){
  var match = matchesManager.manager.getMatch(matchID);
  if(match instanceof Error){
    console.warn(match.message + ' // matchSockets.sendCountdownEvent() - getMatch() // matchID=' + matchID);
  }
  else{
    for(var i = 0; i < match.players.length; i++){
      match.players[i].socket.emit('countdown', secondsLeft);
    }
  }
}

exports.respond = respond;
exports.sendPlayerConnectedEvent = sendPlayerConnectedEvent;
exports.sendPrepareGameEvent = sendPrepareGameEvent;
exports.sendUpdateBoardEvent = sendUpdateBoardEvent;
exports.sendUpdateScoreEvent = sendUpdateScoreEvent;
exports.sendCountdownEvent = sendCountdownEvent;
