"use strict";
let positionCalc      = require('./matchTicker/positionCalc');
let circuitsCheck     = require('./matchTicker/circuitsCheck');
let randomSpecials    = require('./matchTicker/randomSpecials');
let matchSockets      = require('../sockets/matchSockets');

function MatchController(match){
  this.match = match;
}

MatchController.prototype.startMatch = function(){
  let that = this;
  let countdownDurationDecrementInterval = setInterval(countdownDurationDecrement, 1000);

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
};

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
  let that = this;
  let durationDecrementInterval = setInterval(durationDecrement, 1000);
};

MatchController.prototype.matchTicker = function(){
  function tick(){
    tickCount++;
    if(!that.match.isActive()){
      matchSockets.sendMatchEndEvent(that.match);
      clearInterval(tickerInterval);
    }
    else{
      // Calculate new playerPositions - only doubleSpeed players can move every tick
      let playerPositions;
      if(tickCount%2===0){
        playerPositions = positionCalc.calculateNewPlayerPositions(that.match, ['red', 'orange', 'green', 'blue']);
      }
      else{
        let doubleSpeedColors = [];
        let players = that.match.getPlayers();
        for(let i = 0; i<players.length; i++){
          if(players[i].getDoubleSpeedSpecial()){
            doubleSpeedColors.push(players[i].getColor());
          }
        }
        playerPositions = positionCalc.calculateNewPlayerPositions(that.match, doubleSpeedColors);
      }

      // Update Players and Board
      that.match.updatePlayers(playerPositions);
      that.match.updateBoard(playerPositions);

      // Check for circuits / get points
      let playerPoints = circuitsCheck.getPlayerPoints(that.match);

      // Update score for active players
      let activeColors = [];
      let players = that.match.getPlayers();
      for(let i = 0; i<players.length; i++){
        activeColors.push(players[i].getColor());
      }
      for(let i = 0; i<activeColors.length; i++){
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
      let clearSpecials = [];
      for(let i = 0; i<activeColors.length; i++){
        try{
          let square = that.match.getBoard().getSquare(playerPositions[activeColors[i]]);
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
      let clearSquares = [];
      for(let color in playerPoints){
        if(playerPoints[color] > 0){
          for(let i = 0; i < that.match.getBoard().getSquares().length; i++){
            let square = that.match.getBoard().getSquares()[i];
            if(square.getColor() === color){
              square.setColor('');
              clearSquares.push(square.getId());
            }
          }
        }
      }

      // Get randomSpecials and update the board
      let specials = randomSpecials.getSpecials(that.match);
      that.match.updateSpecials(specials);

      // Send sockets
      matchSockets.sendUpdateBoardEvent(that.match, specials);
      matchSockets.sendClearSquaresEvent(that.match, clearSquares, clearSpecials);
      matchSockets.sendUpdateScoreEvent(that.match);
    }
  }
  let tickCount = 0;
  let that = this;
  let tickerInterval = setInterval(tick, 250);
};

exports.MatchController = MatchController;
