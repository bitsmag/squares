'use strict';
const board = require('./board');
const matchController = require('../controllers/matchController');
const matchesManager = require('./matchesManager');
const socketErrorHandler = require('../middleware/socketErrorHandler');

function Match() {
  this.id = '';
  this.players = [];
  this.board = new board.Board();
  this.controller = new matchController.MatchController(this);
  this.duration = this.board.getMatchDuration();
  this.countdownDuration = this.board.getCountdownDuration();
  this.active = false;

  this.id = createUniqueId();
  matchesManager.manager.addMatch(this);
}

Match.prototype.getId = function () {
  return this.id;
};

Match.prototype.getPlayers = function () {
  return this.players;
};

Match.prototype.getPlayer = function (playerName) {
  const foundPlayer = this.players.find(p => p.getName() === playerName);
  if (!foundPlayer) {
    throw new Error('playerNotFound');
  }
  return foundPlayer;
};

Match.prototype.getPlayerByColor = function (playerColor) {
  // ERROR: playerNotFound
  const foundPlayer = this.players.find(p => p.getColor() === playerColor);
  if (!foundPlayer) {
    throw new Error('playerNotFound');
  }
  return foundPlayer;
};

Match.prototype.getMatchCreator = function () {
  // ERROR: matchCreatorNotFound
  let error = false;
  if (this.players.length === 0) {
    error = true;
  }
  for (let i = 0; i < this.players.length; i++) {
    if (this.players[i].isMatchCreator()) {
      return this.players[i];
    } 
  }
  throw new Error('matchCreatorNotFound');
};

Match.prototype.getBoard = function () {
  return this.board;
};

Match.prototype.getController = function () {
  return this.controller;
};

Match.prototype.getDuration = function () {
  return this.duration;
};

Match.prototype.getCountdownDuration = function () {
  return this.countdownDuration;
};

Match.prototype.isActive = function () {
  return this.active;
};

Match.prototype.addPlayer = function (player) {
  // ERROR: matchIsFull, nameInUse
  const nameDuplicate = this.isNameInUse(player.getName());
  if (this.players.length >= 4) {
    throw new Error('matchIsFull');
  } else if (nameDuplicate) {
    throw new Error('nameInUse');
  } else {
    // Set the color of the start squares on the board
    const startSquares = this.getBoard().getStartSquares();
    this.getBoard().getSquare(startSquares[player.getColor()]).setColor(player.getColor());
    // Add Player
    this.players.push(player);
  }
};

Match.prototype.removePlayer = function (player) {
  const index = this.players.indexOf(player);
  if (index > -1) {
    // Remove the color of the start squares on the board
    const startSquares = this.getBoard().getStartSquares();
    this.getBoard().getSquare(startSquares[player.getColor()]).setColor('');
    // Remove player
    this.players.splice(index, 1);
  }
  if (this.players.length < 1) {
    this.destroy();
  }
};

Match.prototype.durationDecrement = function () {
  this.duration--;
};

Match.prototype.countdownDurationDecrement = function () {
  this.countdownDuration--;
};

Match.prototype.setActive = function (active) {
  this.active = active;
};

Match.prototype.updatePlayers = function (playerPositions) {
  // Set position property of players
  Object.keys(playerPositions).forEach((color) => {
    try {
      const player = this.getPlayerByColor(color);
      player.setPosition(playerPositions[color]);
    } catch (err) {
      socketErrorHandler(this, err, 'match.updatePlayers()');
    }
  });
};

Match.prototype.updateBoard = function (playerPositions, _specials) {
  // Set color of playerPosition-Squares
  Object.keys(playerPositions).forEach((color) => {
    try {
      this.getBoard().getSquare(playerPositions[color]).setColor(color);
    } catch (err) {
      socketErrorHandler(this, err, 'match.updateBoard()');
    }
  });
};

Match.prototype.updateSpecials = function (specials) {
  // Set specials
  if (specials.doubleSpeed.length) {
    try {
      this.getBoard().getSquare(specials.doubleSpeed[0]).setDoubleSpeedSpecial(true);
    } catch (err) {
      socketErrorHandler(this, err, 'match.updateSpecials()');
    }
  }
  if (specials.getPoints.length) {
    try {
      this.getBoard().getSquare(specials.getPoints[0]).setGetPointsSpecial(true);
    } catch (err) {
      socketErrorHandler(this, err, 'match.updateSpecials()');
    }
  }
};

Match.prototype.isNameInUse = function (name) {
  let nameInUse;
  for (let i = 0; i < this.players.length; i++) {
    if (this.players[i].getName() === name) {
      nameInUse = true;
    }
  }
  return nameInUse;
};

Match.prototype.destroy = function () {
  this.setActive(false);
  matchesManager.manager.removeMatch(this);
};

function createUniqueId() {
  let timestamp,
    matchId,
    duplicate,
    unique = false;

  while (!unique) {
    timestamp = Date.now().toString();
    matchId = 'x' + timestamp.substring(timestamp.length - 4, timestamp.length);

    duplicate = false;
    for (let i = 0; i < matchesManager.manager.getMatches().length; i++) {
      if (matchesManager.manager.getMatches()[i].getId() === matchId) {
        duplicate = true;
      }
    }
    if (!duplicate) {
      unique = true;
    }
  }
  return matchId;
}

exports.Match = Match;
