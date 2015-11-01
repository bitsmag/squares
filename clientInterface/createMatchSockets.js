var matchesManager = require('../models/matchesManager');

function respond(socket){
  socket.on('connectionInfo',function(matchID){
      var enquiringMatch = matchesManager.manager.getMatch(matchID);
      if(enquiringMatch instanceof Error){
        matchesManager.manager.removeMatch(matchID);
        console.log('error on createMatchSockets - Removed Match.');
        console.log(enquiringMatch.message);
      }
      else{
        var enquiringPlayer = enquiringMatch.getMatchCreator();
        if(enquiringPlayer instanceof Error){
          matchesManager.manager.removeMatch(matchID);
          console.log('error on createMatchSockets - Removed Match.');
          console.log(enquiringPlayer.message);
        }
        else{
          // Save socket in player object
          enquiringPlayer.socket = socket;
        }
      }
  });
}

function sendMatchReadyEvent(matchID){
  var enquiringMatch = matchesManager.manager.getMatch(matchID);
  if(enquiringMatch instanceof Error){
    matchesManager.manager.removeMatch(matchID);
    console.log('error on sendMatchReadyEvent - Removed Match.');
    console.log(enquiringMatch.message);
  }
  else{
    var matchCreator = enquiringMatch.getMatchCreator();
    if(matchCreator instanceof Error){
      matchesManager.manager.removeMatch(matchID);
      console.log('error on sendMatchReadyEvent - Removed Match.');
      console.log(matchCreator.message);
    }
    else {
      // Send the match ready event
      matchCreator.socket.emit('match ready');
    }
  }
}

exports.respond = respond;
exports.sendMatchReadyEvent = sendMatchReadyEvent;
