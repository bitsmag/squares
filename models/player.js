"use strict";
function Player(name, match, matchCreator){ //ERROR: matchNotFound, matchIsFull, nameInUse, matchIsActive
    this.name = name;
    this.color = '';
    this.position = 0;
    this.activeDirection = null;
    this.score = 0;
    this.doubleSpeedSpecial = false;
    this.matchCreator = matchCreator;
    this.socket = null;

    if(!match.isActive()){
      let unusedColor;
      let error = false;
      try{
        unusedColor = getUnusedColor(match);
      }
      catch(err){
        error = true;
        throw err;
      }
      if(!error){
        this.color = unusedColor;
        this.position = match.getBoard().getStartSquares()[unusedColor];
        try {
          match.addPlayer(this);
        }
        catch(err){
          throw err;
        }
      }
    }
    else{
      throw new Error('matchIsActive');
    }
}

Player.prototype.getName = function() {
    return this.name;
};

Player.prototype.getColor = function() {
    return this.color;
};

Player.prototype.getPosition = function() {
    return this.position;
};

Player.prototype.getActiveDirection = function() {
    return this.activeDirection;
};

Player.prototype.getScore = function() {
    return this.score;
};

Player.prototype.getDoubleSpeedSpecial = function() {
    return this.doubleSpeedSpecial;
};

Player.prototype.isMatchCreator = function() {
    return this.matchCreator;
};

Player.prototype.getSocket = function() {
    return this.socket;
};

Player.prototype.setActiveDirection = function(dir) {
  if(dir === 'left' || dir === 'right' || dir === 'up' || dir === 'down'){
    this.activeDirection = dir;
  }
};

Player.prototype.setSocket = function(socket) {
  this.socket = socket;
};


Player.prototype.setPosition = function(pos) {
    this.position = pos;
};

Player.prototype.increaseScore = function(points) {
    this.score += points;
};

Player.prototype.startDoubleSpeedSpecial = function(duration) {
  if(!this.doubleSpeedSpecial){
    this.doubleSpeedSpecial = true;
    let that = this;
    setTimeout(function(){
      that.doubleSpeedSpecial = false;
    }, 5000);
  }
};

function getUnusedColor(match) { // ERROR: matchIsFull
  let unusedColors = ['blue', 'orange', 'green', 'red'];
  let players = match.getPlayers();

  for(let i = 0; i < players.length; i++){
    let index = unusedColors.indexOf(players[i].getColor());
    if(index > -1){
      unusedColors.splice(index, 1);
    }
  }

  if(unusedColors.length > 0){
    return unusedColors[0];
  }
  else{
    throw new Error('matchIsFull');
  }
}
exports.Player = Player;
