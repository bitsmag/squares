var matchesManager = require('../models/matchesManager');

function respond(socket){
  socket.on('connectionInfo',function(matchID){
    // Save socket in player object
    var enquiringPlayer = matchesManager.manager.getMatch(matchID).getMatchCreator();
    enquiringPlayer.socket = socket;
  });
}

function sendMatchReadyEvent(matchID){
  var enquiredMatch = matchesManager.manager.getMatch(matchID);
  var matchCreator = enquiredMatch.getMatchCreator();
  matchCreator.socket.emit('match ready');
}

exports.respond = respond;
exports.sendMatchReadyEvent = sendMatchReadyEvent;
