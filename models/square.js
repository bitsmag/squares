function Square(squareId, edgesTo, position){
  this.id = squareId;
  this.edgesTo = edgesTo;
  this.position = position;
  this.color = '';
  this.doubleSpeedSpecial = false;
  this.dfsVisited = false;
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
