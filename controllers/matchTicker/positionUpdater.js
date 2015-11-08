// Updates board and player state and returns current direction and pos of players
update = function(match){
  // Get new position of players
  var positions = getNewPlayerPositions(match);

  // Set position property of players
  var colors = ['blue', 'orange', 'green', 'red'];
  for(i=0; i<colors.length; i++){
    var player = match.getPlayerByColor(colors[i]);
    if(player instanceof Error){
      console.warn(match.message + ' // positionUpdater.update() - getPlayerByColor() // matchID=' + match.id + ', color=' + colors[i]);
    }
    else{
      player.position = positions[colors[i]].pos;
    }
  }
  // Set color property on board
  match.board.getSquare(positions.blue.pos).color = 'blue';
  match.board.getSquare(positions.orange.pos).color = 'orange';
  match.board.getSquare(positions.green.pos).color = 'green';
  match.board.getSquare(positions.red.pos).color = 'red';

  return positions;
}

// Uses players directions to calculate the position of each player after the current matchTick
getNewPlayerPositions = function(match){
  var playerStatus = {
    blue: {pos: null, dir: null},
    orange: {pos: null, dir: null},
    green: {pos: null, dir: null},
    red: {pos: null, dir: null},
  }
  var colors = ['blue', 'orange', 'green', 'red'];
  // Current/future position and prio of each player
  var currentPos = {blue: null, orange: null, green: null, red: null};
  var futurePos = {blue: null, orange: null, green: null, red: null};
  var prio = {blue: false, orange: false, green: false, red: false};

  for(i=0; i<colors.length; i++){
    var player = match.getPlayerByColor(colors[i]);
    if(player instanceof Error){
      console.warn(match.message + ' // positionUpdater.getNewPlayerPositions() - getPlayerByColor() // matchID=' + match.id + ', color=' + colors[i]);
    }
    else{
      // Current Positions
      currentPos[colors[i]] = player.position;
      // Positions players wants to move to
      futurePos[colors[i]] = calculateStep(player.position, player.activeDirection, match.board);
      // Save direction in return object
      playerStatus[colors[i]].dir = player.activeDirection;
      // If a player stands still it has priority on conflict calculation
      if(currentPos[colors[i]]===futurePos[colors[i]]){
        prio[colors[i]]=true;
      }
    }
  }

  // Conflict (1) multiple players want to move on the same square

  // Loosing squares (futurePos=currentPos)
  var loosers = new Array();

  for(var i=0; i<colors.length; i++){
    for(var j=0; j<colors.length; j++){
      // If both colors have the same future position we have to solve this conflict
      if(i !== j && futurePos[colors[i]]===futurePos[colors[j]]){
        // If one of them is prio the other looses
        if(prio[colors[i]]){
          loosers.push(colors[j]);
        }
        else if(prio[colors[j]]){
          loosers.push(colors[i]);
        }
        // If none is prio we solve the conflict with random numbers
        else {
          // Generate a unique random number for each color.
          var uniqueRandomNumbers = {};
          for(i=0; i<colors.length; i++){
            uniqueRandomNumbers[colors[i]] = Math.random();
          }
          // Find the max of the random numbers and push the corresponding colors to loosers
          var fav = Math.max(uniqueRandomNumbers[colors[i]], uniqueRandomNumbers[colors[j]]);
          if(fav===uniqueRandomNumbers[colors[i]]){
            loosers.push(colors[j]);
          }
          else if(fav===uniqueRandomNumbers[colors[j]]){
            loosers.push(colors[i]);
          }
        }
      }
    }
  }

  // Conflict (2) two players want to jump 'over' each other (switch squares)

  for(var i=0; i<colors.length; i++){
    for(var j=0; j<colors.length; j++){
      if(i !== j && futurePos[colors[i]]===currentPos[colors[j]] && futurePos[colors[j]]===currentPos[colors[i]]){
        loosers.push(colors[i]);
        loosers.push(colors[j]);
      }
    }
  }

  // Remove duplicates
  loosers = loosers.reduce(function(a,b){if(a.indexOf(b)<0)a.push(b);return a;},[]);
  // Set futurePos = currentPos for loosers
  for(var i=0; i<loosers.length; i++){
    futurePos[loosers[i]] = currentPos[loosers[i]];
  }
  // Set pos in return object
  for(var i=0; i<colors.length; i++){
    playerStatus[colors[i]].pos = futurePos[colors[i]];
  }
  return playerStatus;
}

// Uses players direction to calculate the Position a player wants to move to
calculateStep = function(currentPosition, activeDirection, board){
  switch(activeDirection){
    case 'left':
      if(board.getSquare(currentPosition).position.x>0){
        return currentPosition-1;
      }
      else{
        return currentPosition;
      }
      break;
    case 'up':
      if(board.getSquare(currentPosition).position.y>0){
        return currentPosition-board.width;
      }
      else{
        return currentPosition;
      }
      break;
    case 'right':
      if(board.getSquare(currentPosition).position.x<board.width-1){
        return currentPosition+1;
      }
      else{
        return currentPosition;
      }
      break;
    case 'down':
      if(board.getSquare(currentPosition).position.y<board.height-1){
        return currentPosition+board.width;
      }
      else{
        return currentPosition;
      }
      break;
    default:
      return currentPosition;
  }
}

exports.update = update;
