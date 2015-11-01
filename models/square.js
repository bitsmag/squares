function Square(squareID, edgesTo, position, startPoints){
  this.id = squareID;
  this.edgesTo = edgesTo;
  this.position = position;
  this.color = '';
  this.dfsVisited = false; // property for dfs algorithm circuitsChecker

  // Set the color if the square is the startpoint of some player
  switch(squareID){
    case startPoints.blue:
      this.color = 'blue';
      break;
    case startPoints.orange:
      this.color = 'orange';
      break;
    case startPoints.green:
      this.color = 'green';
      break;
    case startPoints.red:
      this.color = 'red';
      break;
  }

  //ownedBy
  //occupiedBy
}

exports.Square = Square;
