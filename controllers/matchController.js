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
    if(!that.match.running){
      clearInterval(tickerInterval);
    }
    else{
      positionUpdater.update(that.match); // Set new player position and colors on board
      var playerPoints = circuitsChecker.check(that.match); // Returns the points made by each player this tcik

      // Add Pints to player.score
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

      matchSockets.sendTickUpdateEvent(that.match.id);
    }
  }
  var that = this;
  var tickerInterval = setInterval(tick, 500);
}





exports.MatchController = MatchController;
