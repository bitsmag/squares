var square = require('./square');
var matchSockets = require('./matchSockets');

function MatchController(match){
  this.match = match;
}

MatchController.prototype.countdown = function(x){
  function ticker(i){
    var j = i;
    setTimeout(function(){
      var secondsLeft = y - j;
      matchSockets.sendCountdownEvent(that.match.id, secondsLeft)
      if(secondsLeft>0){
        j++;
        ticker(j);
      }
      else{
        that.runMatch();
      }
    }, 1000);
  }
  var that = this;
  var i = 0;
  var y = x;
  ticker(i);
}

MatchController.prototype.runMatch = function(){
  this.match.running = true;
  this.timer(this.match.duration);
  this.matchTicker();
}

MatchController.prototype.timer = function(duration){
  function durationDecrement(){
    setTimeout(function() {
      that.match.duration--;
      if(that.match.duration>0){
        durationDecrement();
      }
      else{
        that.match.running = false;
      }
    }, 1000);
  }
  var that = this;
  durationDecrement();
}

MatchController.prototype.matchTicker = function(){
  function tick(){
    if(!that.match.running){
      clearInterval(tickerInterval);
    }
    else{
      that.updateBoard();
      matchSockets.sendUpdateBoardEvent(that.match.id);
    }
  }
  var that = this;
  var tickerInterval = setInterval(tick, 500);
}

MatchController.prototype.updateBoard = function(){
  var positions = this.getNewPlayerPositions();

  // Set new positions on players
  this.match.getPlayerByColor('blue').position = positions.blue;
  this.match.getPlayerByColor('orange').position = positions.orange;
  this.match.getPlayerByColor('green').position = positions.green;
  this.match.getPlayerByColor('red').position = positions.red;

  // Set color on board
  // TODO: Don't apply color if player is not moving
  this.match.board.getSquare(positions.blue).color = 'blue';
  this.match.board.getSquare(positions.orange).color = 'orange';
  this.match.board.getSquare(positions.green).color = 'green';
  this.match.board.getSquare(positions.red).color = 'red';
}

MatchController.prototype.getNewPlayerPositions = function(){ // TODO: Make this function a little bit nicer...
  // Current Positions
  var blueCurrent = this.match.getPlayerByColor('blue').position;
  var orangeCurrent = this.match.getPlayerByColor('orange').position;
  var greenCurrent = this.match.getPlayerByColor('green').position;
  var redCurrent = this.match.getPlayerByColor('red').position;

  // Positions players wants to move to
  var blueFuture = this.calculateStep(blueCurrent, this.match.getPlayerByColor('blue').activeDirection);
  var orangeFuture = this.calculateStep(orangeCurrent, this.match.getPlayerByColor('orange').activeDirection);
  var greenFuture = this.calculateStep(greenCurrent, this.match.getPlayerByColor('green').activeDirection);
  var redFuture = this.calculateStep(redCurrent, this.match.getPlayerByColor('red').activeDirection);

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

MatchController.prototype.calculateStep = function(currentPosition, activeDirection){
  switch(activeDirection){
    case 'left':
      if(this.match.board.getSquare(currentPosition).position.x>0){
        return currentPosition-1;
      }
      else{
        return currentPosition;
      }
      break;
    case 'up':
      if(this.match.board.getSquare(currentPosition).position.y>0){
        return currentPosition-this.match.board.width;
      }
      else{
        return currentPosition;
      }
      break;
    case 'right':
      if(this.match.board.getSquare(currentPosition).position.x<this.match.board.width-1){
        return currentPosition+1;
      }
      else{
        return currentPosition;
      }
      break;
    case 'down':
      if(this.match.board.getSquare(currentPosition).position.y<this.match.board.height-1){
        return currentPosition+this.match.board.width;
      }
      else{
        return currentPosition;
      }
      break;
    default:
      return currentPosition;
  }
}

exports.MatchController = MatchController;
