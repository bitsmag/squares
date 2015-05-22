
update = function(match){
  var positions = getNewPlayerPositions(match);

  // Set position property of players
  match.getPlayerByColor('blue').position = positions.blue;
  match.getPlayerByColor('orange').position = positions.orange;
  match.getPlayerByColor('green').position = positions.green;
  match.getPlayerByColor('red').position = positions.red;

  // Set color property on board
  // TODO: Don't apply color if player is not moving
  match.board.getSquare(positions.blue).color = 'blue';
  match.board.getSquare(positions.orange).color = 'orange';
  match.board.getSquare(positions.green).color = 'green';
  match.board.getSquare(positions.red).color = 'red';
}

getNewPlayerPositions = function(match){ // Uses players directions to calculate the position of each player after the current matchTick
                                                              // Handles conflicts (two players wants to be on the same square)
                                                              // TODO: Make this function a little bit nicer...
  // Current Positions
  var blueCurrent = match.getPlayerByColor('blue').position;
  var orangeCurrent = match.getPlayerByColor('orange').position;
  var greenCurrent = match.getPlayerByColor('green').position;
  var redCurrent = match.getPlayerByColor('red').position;

  // Positions players wants to move to
  var blueFuture = calculateStep(blueCurrent, match.getPlayerByColor('blue').activeDirection, match.board);
  var orangeFuture = calculateStep(orangeCurrent, match.getPlayerByColor('orange').activeDirection);
  var greenFuture = calculateStep(greenCurrent, match.getPlayerByColor('green').activeDirection);
  var redFuture = calculateStep(redCurrent, match.getPlayerByColor('red').activeDirection);

  // If a player stands still it has priority on conflict calculation
  var blueP, orangeP, greenP, redP = false;
  if(blueCurrent === blueFuture) blueP = true;
  if(orangeCurrent === orangeFuture) orangeP = true;
  if(greenCurrent === greenFuture) greenP = true;
  if(redCurrent === redFuture) redP = true;

  // Deal with conflicts
  if(blueFuture === orangeFuture){
    if(!blueP && !orangeP){ // If noone has priority decide randomly
      if(Math.floor(Math.random()*2)===0){
        blueFuture = blueCurrent;
      }
      else{
        orangeFuture = orangeCurrent;
      }
    }
    else if(blueP){ // If blue has priority orange cant move
      orangeFuture = orangeCurrent;
    }
    else if(orangeP){ // If orange has priority blue cant move
      blueFuture = blueCurrent;
    }
  }
  if(blueFuture === redFuture){
    if(!blueP && !redP){
      if(Math.floor(Math.random()*2)===0){
        blueFuture = blueCurrent;
      }
      else{
        redFuture = redCurrent;
      }
    }
    else if(blueP){
      redFuture = redCurrent;
    }
    else if(redP){
      blueFuture = blueCurrent;
    }
  }
  if(blueFuture === greenFuture){
    if(!blueP && !greenP){
      if(Math.floor(Math.random()*2)===0){
        blueFuture = blueCurrent;
      }
      else{
        greenFuture = greenCurrent;
      }
    }
    else if(blueP){
      greenFuture = greenCurrent;
    }
    else if(greenP){
      blueFuture = blueCurrent;
    }
  }
  if(redFuture === greenFuture){
    if(!redP && ! greenP){
      if(Math.floor(Math.random()*2)===0){
        redFuture = redCurrent;
      }
      else{
        greenFuture = greenCurrent;
      }
    }
    else if(redP){
      greenFuture = greenCurrent;
    }
    else if(greenP){
      redFuture = redCurrent;
    }
  }
  if(redFuture === orangeFuture){
    if(!redP && !orangeP){
      if(Math.floor(Math.random()*2)===0){
        redFuture = redCurrent;
      }
      else{
        orangeFuture = orangeCurrent;
      }
    }
    else if(redP){
      orangeFuture = orangeCurrent;
    }
    else if(orangeP){
      redFuture = redCurrent;
    }
  }
  if(greenFuture === orangeFuture){
    if(!greenP && !orangeP){
      if(Math.floor(Math.random()*2)===0){
        greenFuture = greenCurrent;
      }
      else{
        orangeFuture = orangeCurrent;
      }
    }
    else if(greenP){
      orangeFuture = orangeCurrent;
    }
    else if(orangeP){
      greenFuture = greenCurrent;
    }
  }

  var positions = {blue: blueFuture,
    orange: orangeFuture,
    green: greenFuture,
    red: redFuture}
  return positions;
}

calculateStep = function(currentPosition, activeDirection, board){ // Uses players direction to calculate the Position a player wants to move to
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
