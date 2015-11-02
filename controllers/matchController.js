var square = require('../models/square');
var matchSockets = require('../clientInterface/matchSockets');
var positionUpdater = require('./matchTicker/positionUpdater');
var circuitsChecker = require('./matchTicker/circuitsChecker');

function MatchController(match){
  this.match = match;
}

MatchController.prototype.runMatch = function(){
  this.countdown(this.match.countdownDuration); // After Countdown is finished match is started
}

MatchController.prototype.countdown = function(countdownDuration){ // The Countdown to start the match
  function decrementCountdown(x){
    var secondsAlreadyCounted = x;
    setTimeout(function(){
      var secondsLeft = countdownDuration - secondsAlreadyCounted;
      matchSockets.sendCountdownEvent(that.match.id, secondsLeft)
      if(secondsLeft>0){
        secondsAlreadyCounted++;
        decrementCountdown(secondsAlreadyCounted);
      }
      else{
        // Start the match
        that.match.running = true;
        that.timer(that.match.duration);
        that.matchTicker();
      }
    }, 1000);
  }
  var that = this;
  decrementCountdown(0);
}

MatchController.prototype.timer = function(duration){ // The timer which indicates the duration of the match
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
    console.log(process.hrtime() + ' tick');
    if(!that.match.running){
      clearInterval(tickerInterval);
    }
    else{
      console.log(process.hrtime() + ' update positions');
      positionUpdater.update(that.match); // Set new player position and colors on board
      console.log(process.hrtime() + ' positions updated');

      matchSockets.sendUpdateBoardEvent(that.match.id);

      console.log(process.hrtime() + ' checking for circuits');
      var playerPoints = circuitsChecker.check(that.match); // Returns the points made by each player this tick
      console.log(process.hrtime() + ' circuits checked');

      console.log(process.hrtime() + ' add points to score and clean board');
      // Add Points to player.score
      that.match.getPlayerByColor('blue').score += playerPoints.blue;
      that.match.getPlayerByColor('orange').score += playerPoints.orange;
      that.match.getPlayerByColor('green').score += playerPoints.green;
      that.match.getPlayerByColor('red').score += playerPoints.red;

      // Remove color from squares
      for(var color in playerPoints){
        if(playerPoints[color] > 0){
          clearSquares(color);
        }
      }
      clearSquares = function(color) {
        for(var j = 0; j < that.match.board.board.length; j++){
          if(that.match.board.board[j].color === color){
            that.match.board.board[j].color = '';
          }
        }
      }
      console.log(process.hrtime() + ' points added and board cleaned');
      matchSockets.sendUpdateScoreEvent(that.match.id);
    }
  }
  var that = this;
  var tickerInterval = setInterval(tick, 300);
}

exports.MatchController = MatchController;
