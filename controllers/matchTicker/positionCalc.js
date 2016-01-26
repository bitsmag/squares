var matchSockets      = require('../../sockets/matchSockets');

function calculateNewPlayerPositions(match){
  var activeColors = [];
  var players = match.getPlayers();
  for(var i = 0; i<players.length; i++){
    activeColors.push(players[i].getColor())
  }

  // Get currentPos, futurePos & prio of active Players

  var currentPos = {blue: null, orange: null, green: null, red: null};
  var futurePos = {blue: null, orange: null, green: null, red: null};
  var prio = {blue: false, orange: false, green: false, red: false};

  for(i=0; i<activeColors.length; i++){
    var player;
    var error = false;
    try {
      player = match.getPlayerByColor(activeColors[i]);
    }
    catch(err){
      error = true;
      matchSockets.sendFatalErrorEvent(that.match);
      match.destroy();
      console.warn(err.message + ' // positionCalc.calculateNewPlayerPositions()');
      console.trace();
    }
    if(!error){
      currentPos[activeColors[i]] = player.getPosition();
      futurePos[activeColors[i]] = calculateFuturePos(player.getPosition(), player.getActiveDirection(), match.getBoard(), match);
      if(currentPos[activeColors[i]]===futurePos[activeColors[i]]){
        prio[activeColors[i]] = true;
      }
    }
  }

  // Solving Conflict (1) - multiple players want to move on the same square:
  // If there is a confict between players there are winners (those who can
  // move on to the square they want) and loosers (those who must remain on
  // their current position). If a player has priority on a square (still
  // standing players) he wins. If no player has priority loosers are chosen
  // randomly.

  var loosers = new Array();

  for(var i=0; i<activeColors.length; i++){
    for(var j=0; j<activeColors.length; j++){
      if(i !== j && futurePos[activeColors[i]]===futurePos[activeColors[j]]){
        if(prio[activeColors[i]]){
          loosers.push(activeColors[j]);
        }
        else if(prio[activeColors[j]]){
          loosers.push(activeColors[i]);
        }
        else {
          var uniqueRandomNumbers = {};
          for(var k=0; k<activeColors.length; k++){
            uniqueRandomNumbers[activeColors[k]] = Math.random();
          }
          if(uniqueRandomNumbers[activeColors[i]] === Math.max(uniqueRandomNumbers[activeColors[i]], uniqueRandomNumbers[activeColors[j]])){
            loosers.push(activeColors[j]);
          }
          else {
            loosers.push(activeColors[i]);
          }
        }
      }
    }
  }

  // Solving Conflict (2) - two players want to jump 'over' each other (switch squares):
  // Both players must remain on their current squares.

  for(var i=0; i<activeColors.length; i++){
    for(var j=0; j<activeColors.length; j++){
      if(i !== j && futurePos[activeColors[i]] === currentPos[activeColors[j]] && futurePos[activeColors[j]] === currentPos[activeColors[i]]){
        loosers.push(activeColors[i]);
        loosers.push(activeColors[j]);
      }
    }
  }

  // Loosers must remain on their current squares

  loosers = loosers.reduce(function(a,b){if(a.indexOf(b)<0)a.push(b);return a;},[]);
  for(var i=0; i<loosers.length; i++){
    futurePos[loosers[i]] = currentPos[loosers[i]];
  }

  return futurePos;
}

function calculateFuturePos(currentPosition, activeDirection, board, match){
  var square;
  var error = false;
  try{
    square = board.getSquare(currentPosition);
  }
  catch(err){
    error = true;
    matchSockets.sendFatalErrorEvent(match);
    match.destroy();
    console.warn(err.message + ' // positionCalc.calculateFuturePos()');
    console.trace();
  }
  if(!error){
    switch(activeDirection){
      case 'left':
        if(square.getPosition().x>0){
          return currentPosition-1;
        }
        else{
          return currentPosition;
        }
        break;
      case 'up':
        if(square.getPosition().y>0){
          return currentPosition-board.getWidth();
        }
        else{
          return currentPosition;
        }
        break;
      case 'right':
        if(square.getPosition().x<board.getWidth()-1){
          return currentPosition+1;
        }
        else{
          return currentPosition;
        }
        break;
      case 'down':
        if(square.getPosition().y<board.getHeight()-1){
          return currentPosition+board.getWidth();
        }
        else{
          return currentPosition;
        }
        break;
      default:
        return currentPosition;
    }
  }
}

exports.calculateNewPlayerPositions = calculateNewPlayerPositions;