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

var joinMatch = function(matchID, playerName){
  var enquiredMatch = matchesManager.manager.getMatch(matchID);
  // If match exists create new player and add it to the match. Send info to client.
  if(enquiredMatch){
    var newPlayer = new player.Player(playerName, matchID, false);
  }
}

exports.createMatch = createMatch;
exports.joinMatch = joinMatch;
