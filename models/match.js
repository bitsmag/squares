"use strict";
let board             = require('./board');
let matchController   = require('../controllers/matchController');
let matchSockets      = require('../sockets/matchSockets');
let matchesManager    = require('./matchesManager');

function Match(){
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

Match.prototype.getId = function() {
  return this.id;
};

Match.prototype.getPlayers = function() {
  return this.players;
};

Match.prototype.getPlayer = function(playerName) { // ERROR: playerNotFound
  let error = false;
  for(let i = 0; i < this.players.length; i++){
    if(this.players[i].getName() === playerName){
      return this.players[i];
    }
    else {
      error = true;
    }
  }
  if(error){
    throw new Error('playerNotFound');
  }
};

Match.prototype.getPlayerByColor = function(playerColor) { // ERROR: playerNotFound
  let error = false;
  for(let i = 0; i < this.players.length; i++){
    if(this.players[i].getColor() === playerColor){
      return this.players[i];
    }
    else {
      error = true;
    }
  }
  if(error){
    throw new Error('playerNotFound');
  }
};

Match.prototype.getMatchCreator = function() { // ERROR: matchCreatorNotFound
  let error = false;
  if(this.players.length===0){
    error = true;
  }
  for(let i = 0; i < this.players.length; i++){
    if(this.players[i].isMatchCreator()){
      return this.players[i];
    }
    else {
      error = true;
    }
  }
  if(error){
    throw new Error('matchCreatorNotFound');
  }
};

Match.prototype.getBoard = function() {
  return this.board;
};

Match.prototype.getController = function() {
  return this.controller;
};

Match.prototype.getDuration = function() {
  return this.duration;
};

Match.prototype.getCountdownDuration = function() {
  return this.countdownDuration;
};

Match.prototype.isActive = function() {
  return this.active;
};

Match.prototype.addPlayer = function(player) { // ERROR: matchIsFull, nameInUse
    let nameDuplicate = this.isNameInUse(player.getName());
    if(this.players.length>=4){
      throw new Error('matchIsFull');
    }
    else if(nameDuplicate){
      throw new Error('nameInUse');
    }
    else{
      // Set the color of the start squares on the board
      let startSquares = this.getBoard().getStartSquares();
      this.getBoard().getSquare(startSquares[player.getColor()]).setColor(player.getColor());
      // Add Player
      this.players.push(player);
    }
};

Match.prototype.removePlayer = function(player) {
    let index = this.players.indexOf(player);
    if (index > -1) {
      // Remove the color of the start squares on the board
      let startSquares = this.getBoard().getStartSquares();
      this.getBoard().getSquare(startSquares[player.getColor()]).setColor('');
      // Remove player
      this.players.splice(index, 1);
    }
    if(this.players.length < 1){
      this.destroy();
    }
};

Match.prototype.durationDecrement = function() {
  this.duration--;
};

Match.prototype.countdownDurationDecrement = function() {
  this.countdownDuration--;
};

Match.prototype.setActive = function(active) {
  this.active = active;
};

Match.prototype.updatePlayers = function(playerPositions) {
  // Set position property of players
  let activeColors = [];
  let players = this.getPlayers();
  for(let i = 0; i<players.length; i++){
    activeColors.push(players[i].getColor());
  }
  for(let i=0; i<activeColors.length; i++){
    try {
      let player = this.getPlayerByColor(activeColors[i]);
      player.setPosition(playerPositions[activeColors[i]]);
    }
    catch(err) {
      matchSockets.sendFatalErrorEvent(this);
      this.destroy();
      console.warn(err.message + ' // match.updatePlayers()');
      console.trace();
    }
  }
};

Match.prototype.updateBoard = function(playerPositions, specials) {
  let activeColors = [];
  let players = this.getPlayers();
  for(let i = 0; i<players.length; i++){
    activeColors.push(players[i].getColor());
  }
  // Set color of playerPosition-Squares
  for(let i=0; i<activeColors.length; i++){
    try {
      this.getBoard().getSquare(playerPositions[activeColors[i]]).setColor(activeColors[i]);
    }
    catch(err) {
      matchSockets.sendFatalErrorEvent(this);
      this.destroy();
      console.warn(err.message + ' // match.updateBoard()');
      console.trace();
    }
  }
};

Match.prototype.updateSpecials = function(specials) {
  // Set specials
  if(specials.doubleSpeed.length){
    try{
      this.getBoard().getSquare(specials.doubleSpeed[0]).setDoubleSpeedSpecial(true);
    }
    catch(err){
      console.warn(err.message + ' // match.updateBoard - ' + specials.doubleSpeed[0]);
    }
  }
};

Match.prototype.isNameInUse = function(name) {
  let nameInUse;
  for(let i = 0; i < this.players.length; i++){
    if(this.players[i].getName() === name){
      nameInUse = true;
    }
  }
  return nameInUse;
};

Match.prototype.destroy = function() {
  this.setActive(false);
  matchesManager.manager.removeMatch(this);
};

function createUniqueId(){
  let timestamp,
    matchId,
    duplicate,
    unique = false;

  while (!unique){
    timestamp = Date.now().toString();
    matchId = 'x' + timestamp.substring(timestamp.length - 4, timestamp.lenght);

    duplicate = false;
    for(let i=0; i<matchesManager.manager.getMatches().length; i++){
      if(matchesManager.manager.getMatches()[i].getId() === matchId){
        duplicate = true;
      }
    }
    if(!duplicate){
      unique = true;
    }
  }
  return matchId;
}

exports.Match = Match;
