var positionCalc      = require('./matchTicker/positionCalc');
var circuitsCheck     = require('./matchTicker/circuitsCheck');
var matchSockets      = require('../sockets/matchSockets');

function MatchController(match){
  this.match = match;
}

MatchController.prototype.startMatch = function(){
  function runMatch(){
    that.timer(that.match.getDuration());
    that.matchTicker();
  }
  function countdownDurationDecrement(){
    if(!that.match.isActive()){
      clearInterval(countdownDurationDecrementInterval);
    }
    else {
      that.match.countdownDurationDecrement();
      matchSockets.sendCountdownEvent(that.match);
      if(that.match.getCountdownDuration()===0){
        clearInterval(countdownDurationDecrementInterval);
        runMatch();
      }
    }
  }
  var that = this;
  var countdownDurationDecrementInterval = setInterval(countdownDurationDecrement, 1000);
}

MatchController.prototype.timer = function(duration){
  function durationDecrement(){
    if(!that.match.isActive()){
      clearInterval(durationDecrementInterval);
    }
    else{
      that.match.durationDecrement();
      if(that.match.getDuration()===0){
        clearInterval(durationDecrementInterval);
        that.match.setActive(false);
      }
    }
  }
  var that = this;
  var durationDecrementInterval = setInterval(durationDecrement, 1000);
}

MatchController.prototype.matchTicker = function(){
  function tick(){
    if(!that.match.isActive()){
      clearInterval(tickerInterval);
    }
    else{
      var playerPositions = positionCalc.calculateNewPlayerPositions(that.match);
      that.match.updatePlayers(playerPositions);
      that.match.updateBoard(playerPositions);

      var playerPoints = circuitsCheck.getPlayerPoints(that.match);

      var activeColors = [];
      var players = that.match.getPlayers();
      for(var i = 0; i<players.length; i++){
        activeColors.push(players[i].getColor())
      }

      for(i=0; i<activeColors.length; i++){
        try{
          that.match.getPlayerByColor(activeColors[i]).increaseScore(playerPoints[activeColors[i]]);
        }
        catch(err){
          matchSockets.sendFatalErrorEvent(that.match);
          that.match.destroy();
          console.warn(err.message + ' // match.Controller.matchTicker()');
          console.trace();
        }
      }

      var clearSquares = [];
      for(var color in playerPoints){
        if(playerPoints[color] > 0){
          for(var i = 0; i < that.match.getBoard().getSquares().length; i++){
            var square = that.match.getBoard().getSquares()[i];
            if(square.getColor() === color){
              square.setColor('');
              clearSquares.push(square.getId())
            }
          }
        }
      }

      matchSockets.sendUpdateBoardEvent(that.match);
      matchSockets.sendClearSquaresEvent(that.match, clearSquares);
      matchSockets.sendUpdateScoreEvent(that.match);
    }
  }
  var that = this;
  var tickerInterval = setInterval(tick, 300);
}

exports.MatchController = MatchController;
