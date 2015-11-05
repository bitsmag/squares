var matchesManager = require('../models/matchesManager');

function respond(socket){
  socket.on('connectionInfo',function(matchID){
      var enquiringMatch = matchesManager.manager.getMatch(matchID);
      if(enquiringMatch instanceof Error){
        console.warn(enquiringMatch.message + ' // createMatchSockets.on(connectionInfo) // matchID=' + matchID);
      }
      else{
        var enquiringPlayer = enquiringMatch.getMatchCreator();
        if(enquiringPlayer instanceof Error){
          console.warn(enquiringPlayer.message + ' // createMatchSockets.on(connectionInfo) // matchID=' + matchID);
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
    // In case of error notify user and delete the match
    sendErrorEvent(enquiringMatch);

    matchesManager.manager.removeMatch(matchID);
    console.log('error on sendMatchReadyEvent - Removed Match.');
    console.log(enquiringMatch.message);
  }
  else{
    var matchCreator = enquiringMatch.getMatchCreator();
    if(matchCreator instanceof Error){
      // In case of error notify user and delete the match
      sendErrorEvent(matchCreator);

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

function sendErrorEvent(error){
  if(error.message==='matchNotFound'){
    matchCreator.socket.emit('error', 'matchNotFound');
  }
  else if(error.message==='matchCreatorNotFound'){
    matchCreator.socket.emit('error', 'matchCreatorNotFound');
  }
  else{
    matchCreator.socket.emit('error', 'unknownError');
  }
}

exports.respond = respond;
exports.sendMatchReadyEvent = sendMatchReadyEvent;
