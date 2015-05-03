var matchesManager = require('./matchesManager');
var matchController = require('./matchController');
var createMatchSockets = require('./createMatchSockets');
var board = require('./board');

function Match(){
  this.id = '';
  this.players = [];
  this.board = new board.Board();
  this.controller = new matchController.MatchController(this);
  this.duration = this.board.matchDuration;
  this.running  = false;

  // Create unique matchID
  var matchID = '';
  var isDuplicate = true;
  while (isDuplicate){
    var timeStamp = Date.now().toString();
    matchID = timeStamp.substring(timeStamp.length - 4, timeStamp.lenght);
    var duplicate;
    for(var i=0; i<matchesManager.manager.matches.length; i++){
      if(matchesManager.manager.matches[i].id === matchID){
        duplicate = true;
      }
    }
    if(!duplicate){
      isDuplicate = false;
    }
  }
  this.id = matchID;

  // Add match to the manager
  matchesManager.manager.addMatch(this);
}

Match.prototype.addPlayer = function(player) {
    // Add player
    this.players.push(player);
    // Send matchReady Event to matchCreater if all four players joined
    if(this.players.length===4){
      createMatchSockets.sendMatchReadyEvent(this.id)
    }
};

Match.prototype.getPlayer = function(playerName) {
  for(var i = 0; i < this.players.length; i++){
    if(this.players[i].name === playerName){
      return this.players[i];
    }
  }
  return null;
};

Match.prototype.getPlayerByColor = function(playerColor) {
  for(var i = 0; i < this.players.length; i++){
    if(this.players[i].color === playerColor){
      return this.players[i];
    }
  }
  return null;
};


Match.prototype.getMatchCreator = function() {
  for(var i = 0; i < this.players.length; i++){
    if(this.players[i].matchCreator){
      return this.players[i];
    }
  }
  return null;
};

exports.Match = Match;
