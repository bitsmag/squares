var matchesManager = require('./matchesManager');
var matchController = require('../controllers/matchController');
var createMatchSockets = require('../clientInterface/createMatchSockets');
var board = require('./board');

function Match(){
  this.id = '';
  this.players = [];
  this.board = new board.Board();
  this.controller = new matchController.MatchController(this);
  this.duration = this.board.matchDuration;
  this.countdownDuration = this.board.countdownDuration
  this.running  = false;

  this.id = createUniqueID();

  // Add match to the manager
  matchesManager.manager.addMatch(this);
}

var createUniqueID = function(){   // Create unique matchID
  var timestamp,
    matchID,
    duplicate,
    unique = false;

  while (!unique){
    timeStamp = Date.now().toString();
    matchID = 'x' + timeStamp.substring(timeStamp.length - 4, timeStamp.lenght);

    duplicate = false;
    for(var i=0; i<matchesManager.manager.matches.length; i++){
      if(matchesManager.manager.matches[i].id === matchID){
        duplicate = true;
      }
    }
    if(!duplicate){
      unique = true;
    }
  }
  return matchID;
};

Match.prototype.addPlayer = function(player) { //ERROR: matchIsFull, nameAlreadyInUse
    var nameDuplicate = this.isNameInUse(this.name);
    if(this.players.length>=4){
      return new Error('matchIsFull');
    }
    else if(nameDuplicate){
      return new Error('nameAlreadyInUse');
    }
    else{
      // Add Player
      this.players.push(player);
      if(this.players.length===4){
        // Send matchReady Event to matchCreator if all four players joined
        createMatchSockets.sendMatchReadyEvent(this.id)
      }
    }
};

Match.prototype.getPlayer = function(playerName) { //ERROR: playerNotFound
  for(var i = 0; i < this.players.length; i++){
    if(this.players[i].name === playerName){
      return this.players[i];
    }
  }
  return new Error('playerNotFound');
};

Match.prototype.getPlayerByColor = function(playerColor) {
  for(var i = 0; i < this.players.length; i++){
    if(this.players[i].color === playerColor){
      return this.players[i];
    }
  }
  return new Error('cant get player with color ' + playerColor);
};

Match.prototype.getMatchCreator = function() {
  for(var i = 0; i < this.players.length; i++){
    if(this.players[i].matchCreator){
      return this.players[i];
    }
  }
  return new Error('matchCreatorNotFound');
};

Match.prototype.isNameInUse = function(name) {
  var nameInUse;
  for(var i = 0; i < this.players.length; i++){
    if(this.players[i].name === name){
      nameInUse = true;
    }
  }
  return nameInUse;
};

exports.Match = Match;
