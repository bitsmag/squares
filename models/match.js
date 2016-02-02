var board             = require('./board');
var matchController   = require('../controllers/matchController');
var matchSockets      = require('../sockets/matchSockets');
var matchesManager    = require('./matchesManager');

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
  var error = false;
  for(var i = 0; i < this.players.length; i++){
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
  var error = false;
  for(var i = 0; i < this.players.length; i++){
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
  var error = false;
  if(this.players.length===0){
    error = true;
  }
  for(var i = 0; i < this.players.length; i++){
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
    var nameDuplicate = this.isNameInUse(player.getName());
    if(this.players.length>=4){
      throw new Error('matchIsFull');
    }
    else if(nameDuplicate){
      throw new Error('nameInUse');
    }
    else{
      this.players.push(player);
    }
};

Match.prototype.removePlayer = function(player) {
    var index = this.players.indexOf(player);
    if (index > -1) {
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
  var activeColors = [];
  var players = this.getPlayers();
  for(var i = 0; i<players.length; i++){
    activeColors.push(players[i].getColor());
  }
  for(var i=0; i<activeColors.length; i++){
    try {
      var player = this.getPlayerByColor(activeColors[i]);
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
  var activeColors = [];
  var players = this.getPlayers();
  for(var i = 0; i<players.length; i++){
    activeColors.push(players[i].getColor());
  }
  // Set color of playerPosition-Squares
  for(var i=0; i<activeColors.length; i++){
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
  var nameInUse;
  for(var i = 0; i < this.players.length; i++){
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
  var timestamp,
    matchId,
    duplicate,
    unique = false;

  while (!unique){
    timestamp = Date.now().toString();
    matchId = 'x' + timestamp.substring(timestamp.length - 4, timestamp.lenght);

    duplicate = false;
    for(var i=0; i<matchesManager.manager.getMatches().length; i++){
      if(matchesManager.manager.getMatches()[i].getId() === matchId){
        duplicate = true;
      }
    }
    if(!duplicate){
      unique = true;
    }
  }
  return matchId;
};

exports.Match = Match;
