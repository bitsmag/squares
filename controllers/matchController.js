var positionCalc      = require('./matchTicker/positionCalc');
var circuitsCheck     = require('./matchTicker/circuitsCheck');
var randomSpecials    = require('./matchTicker/randomSpecials');
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
    tickCount++;
    if(!that.match.isActive()){
      matchSockets.sendMatchEndEvent(that.match);
      clearInterval(tickerInterval);
    }
    else{
      // Calculate new playerPositions - only doubleSpeed players can move every tick
      var playerPositions;
      if(tickCount%2===0){
        playerPositions = positionCalc.calculateNewPlayerPositions(that.match, ['red', 'orange', 'green', 'blue']);
      }
      else{
        var doubleSpeedColors = [];
        var players = that.match.getPlayers();
        for(var i = 0; i<players.length; i++){
          if(players[i].getDoubleSpeedSpecial()){
            doubleSpeedColors.push(players[i].getColor())
          }
        }
        playerPositions = positionCalc.calculateNewPlayerPositions(that.match, doubleSpeedColors);
      }

      // Update Players and Board
      that.match.updatePlayers(playerPositions);
      that.match.updateBoard(playerPositions);

      // Check for circuits / get points
      var playerPoints = circuitsCheck.getPlayerPoints(that.match);

      // Update score for active players
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

      // Check if a player collected a special
      var clearSpecials = [];
      for(i=0; i<activeColors.length; i++){
        try{
          var square = that.match.getBoard().getSquare(playerPositions[activeColors[i]]);
          if(square.getDoubleSpeedSpecial()){
            that.match.getPlayerByColor(activeColors[i]).startDoubleSpeedSpecial(that.match.getBoard().getDoubleSpeedDuration());
            square.setDoubleSpeedSpecial(false);
            clearSpecials.push(square.getId());
          }
        }
        catch(err){
          matchSockets.sendFatalErrorEvent(that.match);
          that.match.destroy();
          console.warn(err.message + ' // match.Controller.matchTicker()');
          console.trace();
        }
      }

      // Get all squares of a player who made points this tick
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

      // Get randomSpecials and update the board
      var specials = randomSpecials.getSpecials(that.match);
      that.match.updateSpecials(specials);

      // Send sockets
      matchSockets.sendUpdateBoardEvent(that.match, specials);
      matchSockets.sendClearSquaresEvent(that.match, clearSquares, clearSpecials);
      matchSockets.sendUpdateScoreEvent(that.match);
    }
  }
  var tickCount = 0;
  var that = this;
  var tickerInterval = setInterval(tick, 250);
}

exports.MatchController = MatchController;
