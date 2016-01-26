var matchSockets      = require('../../sockets/matchSockets');

function getPlayerPoints(match){
  var playerPoints = {blue: 0, orange: 0, green: 0, red: 0};
  for(var i = 0; i < match.getPlayers().length; i++){
    var playerPositionSquare;
    var error = false;
    try{
      playerPositionSquare = match.getBoard().getSquare(match.getPlayers()[i].getPosition());
    }
    catch (err){
      error = true;
      matchSockets.sendFatalErrorEvent(match);
      match.destroy();
      console.warn(err.message + ' // circuitsCheck.checkForCircuits()');
      console.trace();
    }
    if(!error){
      var playerColor = match.getPlayers()[i].getColor();
      var points = getPoints(playerPositionSquare, playerColor, match);
      playerPoints[playerColor] = points;
    }
  }
  return playerPoints;
};

function getPoints(theSquare, theColor, match){

  var stack = new Array();
  var justPopped; // If a square does not lead to a new way it gets popped of the stack. This var is necessary so the same square is not checked again in the following iteration.
  var prefDir = ''; // Prefered direction how the algorithm goes through the field it should only change direction if there is no other way
  var points = 0;

  function getVertices(s, c){ // Returns all squares in the same color reachable from the current square (neighbors)
    var vertices = new Array();
    // function to order elements of array
    vertices.move = function (old_index, new_index) {
      if (new_index >= this.length) {
        var k = new_index - this.length;
        while ((k--) + 1) {
          this.push(undefined);
        }
      }
      this.splice(new_index, 0, this.splice(old_index, 1)[0]);
    };
    // Get all vertices
    for(var i = 0; i < s.getEdgesTo().length; i++){
      var edgeSquare;
      var error = false;
      try{
        edgeSquare = match.getBoard().getSquare(s.getEdgesTo()[i]);
      }
      catch (err){
        error = true;
        matchSockets.sendFatalErrorEvent(match);
        match.destroy();
        console.warn(err.message + ' // circuitsCheck.checkForCircuits()');
        console.trace();
      }
      if(!error){
        if(edgeSquare.getColor() === c && !(edgeSquare === justPopped)){
          vertices.push(edgeSquare);
        }
      }
    }
    // If there is a vertex which matches the prefered direction move it index 0 so it gets processed first

    for(var i = 0; i < vertices.length; i++){
      if(s.getPosition().x<vertices[i].getPosition().x && prefDir === 'right' ||
          s.getPosition().x>vertices[i].getPosition().x && prefDir === 'left' ||
          s.getPosition().y>vertices[i].getPosition().y && prefDir === 'down' ||
          s.getPosition().y<vertices[i].getPosition().y  && prefDir === 'up'){
        vertices.move(i, 0);
      }
    }
    return vertices;
  }

  function setAllSquaresUnvisited(){ // dfsVisited is a helper property for the algorithm -> set it to false for each square in the end
    for(var i = 0; i < match.getBoard().getSquares().length; i++){
        match.getBoard().getSquares()[i].setDfsVisited(false);
    }
  }

  function setPrefDir(theSquare, nextSquare){ // Returns the direction the algorithm is "going"
    if(stack.length>0){
      if(theSquare.getPosition().x<nextSquare.getPosition().x){
        prefDir = 'right';
      }
      else if(theSquare.getPosition().x>nextSquare.getPosition().x){
        prefDir = 'left';
      }
      else if(theSquare.getPosition().y>nextSquare.getPosition().y){
        prefDir = 'down';
      }
      else if(theSquare.getPosition().y<nextSquare.getPosition().y){
        prefDir = 'up';
      }
    }
  }

  function checkValidity(stack, alreadyVisitedVertex){ // Will check if a circuit is valid. returns the value of the circuit if valid, otherwise 0
    // Check if the found circuit is valid
    // There must be a square which is surrounded by the circuit but is not part of the circuit itself
    var pointCount = 0;
    // To build up a valid circuit there must be at least 8 squares
    if(stack.length>7){
      // All squares between theSquare and the alreadyVisitedSquare are part of the circuit
      var alreadyVisitedSquareIndex = stack.indexOf(alreadyVisitedVertex);
      var circuitArray = stack.slice(alreadyVisitedSquareIndex, stack.length);
      // Iterate through alle "rows" (yValues) of the board
      for(var j = 0; j<9; j++){
        // Collect all xValues of the squares in the ciruit which are in the same "row"
        var xVals = [];
        for(var k = 0; k<circuitArray.length; k++){
          if(circuitArray[k].getPosition().y == j){
            xVals.push(circuitArray[k].getPosition().x);
          }
        }
        xVals.sort(function(a, b){return a-b}); // Sort the values
        // Iterate through all xValues in one row - if there are gaps in the sequence its a valid circuit
        for(var k = 1; k < xVals.length; k++) {
          var diff = xVals[k] - xVals[k-1];
          if(diff != 1) {
            pointCount += diff-1; // Each square surrounded by the circuit is one point
          }
        }
      }
      if(pointCount>0){
        pointCount += circuitArray.length; // Each square which is part of the circuit is one point
      }
    }
    return pointCount;
  }

  function dfs(theSquare, theColor){ // The actual algorithm (Depth First Search)

    // (A) If no square is passed and stack is empty end of dfs is reached
    if(theSquare || stack.length > 0){

       // (B) Use the square on top of the stack if none is passed
      if(theSquare){
        stack.push(theSquare);
      }
      else{
        theSquare = stack[stack.length-1];
      }

      // (C) The square is visited now
      theSquare.setDfsVisited(true);

      // (D) Get all vertices from the current square
      var vertices = getVertices(theSquare, theColor);

      // (E) Iterate through all vertices
      for(var i = 0; i < vertices.length; i++){

        if(points<1){ // If there is a valid circuit recognized (there are points) the following code must not be executed (actually the loop should stop)
                      // TODO Make this loop recursive so this ugly if statement is not necessary

          // (E.1) The vertex is already visited and not the same as before -> circuit!
          if(vertices[i].isDfsVisited() && !(vertices[i] === stack[stack.length-2])){

            // Check if the found circuit is valid
            points = checkValidity(stack, vertices[i]);

            // If the circuit is not valid (zero points) and there is not other vertex of theSquare to check
            // pop the square of the stack and start dfs again
            if(points === 0 && i===vertices.length-1){
              stack.pop(theSquare);
              // Keep the popped of Square and the direction we're coming from (its the preferred dirrection for the next step)
              justPopped = theSquare;
              setPrefDir(theSquare, stack[stack.length-1]);
              dfs(null, theColor);
            }
          }

          // (E.2) The vertex is already visited and the same as before
          else if(vertices[i].isDfsVisited() && (vertices[i] === stack[stack.length-2])){

            // If there is not other vertex of theSquare to check
            // pop the square of the stack and start dfs again
            if(i===vertices.length-1){
              stack.pop(theSquare);
              // Keep the popped of Square and the direction we're coming from (its the preferred dirrection for the next step)
              justPopped = theSquare;
              setPrefDir(theSquare, stack[stack.length-1]);
              dfs(null, theColor);
            }
          }

          // (E.3) The vertex is not visited yet -> A new way is found
          else if(!vertices[i].isDfsVisited()){
            // There is no popped of Square but keep in mind the direction we're coming from (its the preferred dirrection for the next step)
            justPopped = null;
            setPrefDir(theSquare, vertices[i]);
            dfs(vertices[i], theColor);
          }
        }
      }
    }
  }

  dfs(theSquare, theColor);
  setAllSquaresUnvisited();
  return points;
}

exports.getPlayerPoints = getPlayerPoints;
