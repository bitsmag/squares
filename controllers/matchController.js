'use strict';
const positionCalc = require('./matchTicker/positionCalc');
const circuitsCheck = require('./matchTicker/circuitsCheck');
const randomSpecials = require('./matchTicker/randomSpecials');
const matchSocketService = require('../services/matchSocketService');
const socketErrorHandler = require('../middleware/socketErrorHandler');

function MatchController(match) {
  this.match = match;
}

MatchController.prototype.startMatch = function () {
  const countdownDurationDecrementInterval = setInterval(() => {
    if (!this.match.isActive()) {
      clearInterval(countdownDurationDecrementInterval);
    } else {
      this.match.countdownDurationDecrement();
      matchSocketService.sendCountdownEvent(this.match);
      if (this.match.getCountdownDuration() === 0) {
        clearInterval(countdownDurationDecrementInterval);
        this.timer(this.match.getDuration());
        this.matchTicker();
      }
    }
  }, 1000);
};

MatchController.prototype.timer = function (_duration) {
  const durationDecrementInterval = setInterval(() => {
    if (!this.match.isActive()) {
      clearInterval(durationDecrementInterval);
    } else {
      this.match.durationDecrement();
      if (this.match.getDuration() === 0) {
        clearInterval(durationDecrementInterval);
        this.match.setActive(false);
      }
    }
  }, 1000);
};

MatchController.prototype.matchTicker = function () {
  const tick = () => {
    tickCount++;
    if (!this.match.isActive()) {
      matchSocketService.sendMatchEndEvent(this.match);
      clearInterval(tickerInterval);
    } else {
      // Calculate new playerPositions (for the players which are relevant this tick)
      let playerPositions;
      if (tickCount % 2 !== 0) {
        // Every second tick all (active) players can move
        const activeColors = [];
        const players = this.match.getPlayers();
        for (let i = 0; i < players.length; i++) {
          activeColors.push(players[i].getColor());
        }
        playerPositions = positionCalc.calculateNewPlayerPositions(this.match, activeColors);
      } else {
        // Players who collected a doubleSpeed-special can move every tick
        const doubleSpeedColors = [];
        const players = this.match.getPlayers();
        for (let i = 0; i < players.length; i++) {
          if (players[i].getDoubleSpeedSpecial()) {
            doubleSpeedColors.push(players[i].getColor());
          }
        }
        playerPositions = positionCalc.calculateNewPlayerPositions(this.match, doubleSpeedColors);
      }

      // Update Players and Board
      this.match.updatePlayers(playerPositions);
      this.match.updateBoard(playerPositions);

      // Check for circuits / get points
      const playerPoints = circuitsCheck.getPlayerPoints(this.match);

      // Check if a player collected a special
      const clearSpecials = [];
      Object.keys(playerPositions).forEach((color) => {
        try {
          const playerPositionSquare = this.match.getBoard().getSquare(playerPositions[color]);
          // getPointsSpecial
          if (playerPositionSquare.getGetPointsSpecial()) {
            for (let i = 0; i < this.match.getBoard().getSquares().length; i++) {
              const square = this.match.getBoard().getSquares()[i];
              if (square.getColor() === color) {
                playerPoints[color].push(square);
              }
            }
            playerPositionSquare.setGetPointsSpecial(false);
            clearSpecials.push(playerPositionSquare.getId());
          }
          // doubleSpeedSpecial
          if (playerPositionSquare.getDoubleSpeedSpecial()) {
            this.match
              .getPlayerByColor(color)
              .startDoubleSpeedSpecial(this.match.getBoard().getDoubleSpeedDuration());
            playerPositionSquare.setDoubleSpeedSpecial(false);
            clearSpecials.push(playerPositionSquare.getId());
          }
        } catch (err) {
          socketErrorHandler(this.match, err, 'match.Controller.matchTicker()');
        }
      });

      // Update score for active players
      Object.keys(playerPositions).forEach((color) => {
        try {
          this.match.getPlayerByColor(color).increaseScore(playerPoints[color].length);
        } catch (err) {
          socketErrorHandler(this.match, err, 'match.Controller.matchTicker()');
        }
      });

      // Get all squares which earned points this tick
      const clearSquares = [];

      Object.keys(playerPositions).forEach((color) => {
        for (let i = 0; i < playerPoints[color].length; i++) {
          clearSquares.push({ id: playerPoints[color][i].getId(), color: color });
          playerPoints[color][i].setColor('');
        }
      });

      // Get randomSpecials and update the board
      const specials = randomSpecials.getSpecials(this.match);
      this.match.updateSpecials(specials);

      // Send sockets
      matchSocketService.sendUpdateBoardEvent(this.match, specials);
      matchSocketService.sendClearSquaresEvent(this.match, clearSquares, clearSpecials);
      matchSocketService.sendUpdateScoreEvent(this.match);
    }
  }
  let tickCount = 0;
  const tickerInterval = setInterval(tick, 250);
};

exports.MatchController = MatchController;
