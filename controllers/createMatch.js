var player = require('../models/player');
var match = require('../models/match');
var matchesManager = require('../models/matchesManager');

var createMatch = function(matchCreatorName){
  // Create new Match
  var newMatch = new match.Match();
  // Add matchCreator as new Player
  var newPlayer = new player.Player(matchCreatorName, newMatch.id, true);
  return newMatch.id;
}

var joinMatch = function(matchID, playerName){ //ERROR: matchNotFound, matchIsFull, nameAlreadyInUse
  var enquiredMatch = matchesManager.manager.getMatch(matchID);
  // Check if match with given matchID exists
  if(enquiredMatch instanceof Error){
    return enquiredMatch;
  }
  else{
    // Check if some player in this match has the same name
    var nameInUse = enquiredMatch.isNameInUse(playerName);
    if(nameInUse){
      return new Error('nameAlreadyInUse');
    }
    else{
      // Create new player
      var newPlayer = new player.Player(playerName, matchID, false);
      if(newPlayer instanceof Error){
        return newPlayer;
      }
    }

  }
}

exports.createMatch = createMatch;
exports.joinMatch = joinMatch;
