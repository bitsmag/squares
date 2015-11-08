var square = require('../models/square');
var matchSockets = require('../clientInterface/matchSockets');
var positionUpdater = require('./matchTicker/positionUpdater');
var circuitsChecker = require('./matchTicker/circuitsChecker');

function MatchController(match){
  this.match = match;
}

MatchController.prototype.runMatch = function(){
  // After Countdown is finished match is started
  this.countdown(this.match.countdownDuration);
}

// The Countdown to start the match
MatchController.prototype.countdown = function(countdownDuration){
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

// The timer which indicates the duration of the match
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
      // Copy current board so we have the old board status after positionUpdater.update and can send it to the clients
      // The client will draw the old board and execute animations on it to create the new board
      var board = JSON.parse(JSON.stringify(that.match.board.board));
      // Set new player position and colors on board
      var playerStatus = positionUpdater.update(that.match);

      //matchSockets.sendUpdateBoardEvent(that.match.id);
      matchSockets.sendUpdateBoardEventX(board, that.match.id, playerStatus);

      // Check for circuits / get points made by each player this tick
      var playerPoints = circuitsChecker.check(that.match);

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
      matchSockets.sendUpdateScoreEvent(that.match.id);
    }
  }
  var that = this;
  var tickerInterval = setInterval(tick, 500);
}

exports.MatchController = MatchController;
