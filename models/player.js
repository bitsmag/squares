function Player(name, match, matchCreator){ //ERROR: matchNotFound, matchIsFull, nameInUse, matchIsActive
    this.name = name;
    this.color = '';
    this.position = 0;
    this.activeDirection = null;
    this.score = 0;
    this.matchCreator = matchCreator;
    this.socket = null;

    if(!match.isActive()){
      var unusedColor;
      var error = false;
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

function getUnusedColor(match) { // ERROR: matchIsFull
  var usedColors = {blue: false,
                    orange: false,
                    green: false,
                    red: false};
  for(var i = 0; i<match.getPlayers().length; i++){
    switch(match.getPlayers()[i].getColor()) {
      case 'blue':
        usedColors.blue = true;
        break;
      case 'orange':
        usedColors.orange = true;
        break;
      case 'green':
        usedColors.green = true;
        break;
      case 'red':
        usedColors.red = true;
        break;
    }
  }
  if(!usedColors.blue){
    return 'blue';
  }
  else if(!usedColors.orange){
    return 'orange';
  }
  else if(!usedColors.green){
    return 'green';
  }
  else if(!usedColors.red){
    return 'red';
  }
  else{
    throw new Error('matchIsFull');
  }
}
exports.Player = Player;
