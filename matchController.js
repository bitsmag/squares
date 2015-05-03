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
    setTimeout(function(){
      if(that.match.running){
        that.calculateBoard();
        matchSockets.sendUpdateBoardEvent(that.match.id);
        tick();
      }
    }, 500);
  }
  var that = this;
  tick();
}

MatchController.prototype.calculateBoard = function(){
  // Current Positions
  var blueCurrent = this.match.getPlayerByColor('blue').position;
  var orangeCurrent = this.match.getPlayerByColor('orange').position;
  var greenCurrent = this.match.getPlayerByColor('green').position;
  var redCurrent = this.match.getPlayerByColor('red').position;

  // Positions players want to move to
  var blueFuture = this.calculateStep(blueCurrent, this.match.getPlayerByColor('blue').activeDirection);
  var orangeFuture = this.calculateStep(orangeCurrent, this.match.getPlayerByColor('orange').activeDirection);
  var greenFuture = this.calculateStep(greenCurrent, this.match.getPlayerByColor('green').activeDirection);
  var redFuture = this.calculateStep(redCurrent, this.match.getPlayerByColor('red').activeDirection);

  // Decide randomly on conflicts
  if(blueFuture === orangeFuture){
    if(Math.floor(Math.random()*2)===0){
      blueFuture = blueCurrent;
    }
    else{
      orangeFuture = orangeCurrent;
    }
  }
  if(blueFuture === redFuture){
    if(Math.floor(Math.random()*2)===0){
      blueFuture = blueCurrent;
    }
    else{
      redFuture = redCurrent;
    }
  }
  if(blueFuture === greenFuture){
    if(Math.floor(Math.random()*2)===0){
      blueFuture = blueCurrent;
    }
    else{
      greenFuture = greenCurrent;
    }
  }
  if(redFuture === redFuture){
    if(Math.floor(Math.random()*2)===0){
      redFuture = redCurrent;
    }
    else{
      orangeFuture = orangeCurrent;
    }
  }
  if(greenFuture === greenFuture){
    if(Math.floor(Math.random()*2)===0){
      greenFuture = greenCurrent;
    }
    else{
      orangeFuture = orangeCurrent;
    }
  }
  if(greenFuture === greenFuture){
    if(Math.floor(Math.random()*2)===0){
      greenFuture = greenCurrent;
    }
    else{
      redFuture = redCurrent;
    }
  }

  // Set new positions on players
  this.match.getPlayerByColor('blue').position = blueFuture;
  this.match.getPlayerByColor('orange').position = orangeFuture;
  this.match.getPlayerByColor('green').position = greenFuture;
  this.match.getPlayerByColor('red').position = redFuture;

  // Set color on board
  this.match.board.getSquare(blueFuture).color = 'blue';
  this.match.board.getSquare(orangeFuture).color = 'orange';
  this.match.board.getSquare(greenFuture).color = 'green';
  this.match.board.getSquare(redFuture).color = 'red';
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
