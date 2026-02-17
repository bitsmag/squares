'use strict';
const positionCalc = require('./matchTicker/positionCalc');
const circuitsCheck = require('./matchTicker/circuitsCheck');
const randomSpecials = require('./matchTicker/randomSpecials');
const matchSockets = require('../sockets/matchSockets');
const socketErrorHandler = require('../middleware/socketErrorHandler');

function MatchController(match) {
  this.match = match;
}

MatchController.prototype.startMatch = function () {
  const that = this;
  const countdownDurationDecrementInterval = setInterval(countdownDurationDecrement, 1000);

  function runMatch() {
    that.timer(that.match.getDuration());
    that.matchTicker();
  }

  function countdownDurationDecrement() {
    if (!that.match.isActive()) {
      clearInterval(countdownDurationDecrementInterval);
    } else {
      that.match.countdownDurationDecrement();
      matchSockets.sendCountdownEvent(that.match);
      if (that.match.getCountdownDuration() === 0) {
        clearInterval(countdownDurationDecrementInterval);
        runMatch();
      }
    }
  }
};

MatchController.prototype.timer = function (_duration) {
  function durationDecrement() {
    if (!that.match.isActive()) {
      clearInterval(durationDecrementInterval);
    } else {
      that.match.durationDecrement();
      if (that.match.getDuration() === 0) {
        clearInterval(durationDecrementInterval);
        that.match.setActive(false);
      }
    }
  }
  const that = this;
  const durationDecrementInterval = setInterval(durationDecrement, 1000);
};

MatchController.prototype.matchTicker = function () {
  function tick() {
    tickCount++;
    if (!that.match.isActive()) {
      matchSockets.sendMatchEndEvent(that.match);
      clearInterval(tickerInterval);
    } else {
      // Calculate new playerPositions (for the players which are relevant this tick)
      let playerPositions;
      if (tickCount % 2 !== 0) {
        // Every second tick all (active) players can move
        const activeColors = [];
        const players = that.match.getPlayers();
        for (let i = 0; i < players.length; i++) {
          activeColors.push(players[i].getColor());
        }
        playerPositions = positionCalc.calculateNewPlayerPositions(that.match, activeColors);
      } else {
        // Players who collected a doubleSpeed-special can move every tick
        const doubleSpeedColors = [];
        const players = that.match.getPlayers();
        for (let i = 0; i < players.length; i++) {
          if (players[i].getDoubleSpeedSpecial()) {
            doubleSpeedColors.push(players[i].getColor());
          }
        }
        playerPositions = positionCalc.calculateNewPlayerPositions(that.match, doubleSpeedColors);
      }

      // Update Players and Board
      that.match.updatePlayers(playerPositions);
      that.match.updateBoard(playerPositions);

      // Check for circuits / get points
      const playerPoints = circuitsCheck.getPlayerPoints(that.match);

      // Check if a player collected a special
      const clearSpecials = [];
      Object.keys(playerPositions).forEach(function (color) {
        try {
          const playerPositionSquare = that.match.getBoard().getSquare(playerPositions[color]);
          // getPointsSpecial
          if (playerPositionSquare.getGetPointsSpecial()) {
            for (let i = 0; i < that.match.getBoard().getSquares().length; i++) {
              const square = that.match.getBoard().getSquares()[i];
              if (square.getColor() === color) {
                playerPoints[color].push(square);
              }
            }
            playerPositionSquare.setGetPointsSpecial(false);
            clearSpecials.push(playerPositionSquare.getId());
          }
          // doubleSpeedSpecial
          if (playerPositionSquare.getDoubleSpeedSpecial()) {
            that.match
              .getPlayerByColor(color)
              .startDoubleSpeedSpecial(that.match.getBoard().getDoubleSpeedDuration());
            playerPositionSquare.setDoubleSpeedSpecial(false);
            clearSpecials.push(playerPositionSquare.getId());
          }
        } catch (err) {
          socketErrorHandler(that.match, err, 'match.Controller.matchTicker()');
        }
      });

      // Update score for active players
      Object.keys(playerPositions).forEach(function (color) {
        try {
          that.match.getPlayerByColor(color).increaseScore(playerPoints[color].length);
        } catch (err) {
          socketErrorHandler(that.match, err, 'match.Controller.matchTicker()');
        }
      });

      // Get all squares which earned points this tick
      const clearSquares = [];

      Object.keys(playerPositions).forEach(function (color) {
        for (let i = 0; i < playerPoints[color].length; i++) {
          clearSquares.push({ id: playerPoints[color][i].getId(), color: color });
          playerPoints[color][i].setColor('');
        }
      });

      // Get randomSpecials and update the board
      const specials = randomSpecials.getSpecials(that.match);
      that.match.updateSpecials(specials);

      // Send sockets
      matchSockets.sendUpdateBoardEvent(that.match, specials);
      matchSockets.sendClearSquaresEvent(that.match, clearSquares, clearSpecials);
      matchSockets.sendUpdateScoreEvent(that.match);
    }
  }
  let tickCount = 0;
  const that = this;
  const tickerInterval = setInterval(tick, 250);
};

exports.MatchController = MatchController;
