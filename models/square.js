function Square(squareId, edgesTo, position, startSquares){
  this.id = squareId;
  this.edgesTo = edgesTo;
  this.position = position;
  this.color = '';
  this.doubleSpeedSpecial = false;
  this.dfsVisited = false;


  switch(squareId){
    case startSquares.blue:
      this.color = 'blue';
      break;
    case startSquares.orange:
      this.color = 'orange';
      break;
    case startSquares.green:
      this.color = 'green';
      break;
    case startSquares.red:
      this.color = 'red';
      break;
  }
}

Square.prototype.getId = function() {
  return this.id;
};

Square.prototype.getEdgesTo = function() {
  return this.edgesTo;
};

Square.prototype.getPosition = function() {
  return this.position;
};

Square.prototype.getColor = function() {
  return this.color;
};

Square.prototype.getDoubleSpeedSpecial = function() {
    return this.doubleSpeedSpecial;
};

Square.prototype.isDfsVisited = function() {
  return this.dfsVisited;
};

Square.prototype.setColor = function(color) {
    this.color = color;
};

Square.prototype.setDoubleSpeedSpecial = function(doubleSpeedSpecial) {
    this.doubleSpeedSpecial = doubleSpeedSpecial;
};

Square.prototype.setDfsVisited = function(visited) {
  this.dfsVisited = visited;
};
exports.Square = Square;
