check = function(match){ // returns how many points each player made this tick
  var playerPoints = {blue: 0, orange: 0, green: 0, red: 0};
  for(var i = 0; i < match.players.length; i++){
    var theSquare = match.board.getSquare(match.players[i].position); // SquareID of the players position
    var theColor = match.players[i].color; // The players color

    var circuit = runDfs(theSquare, theColor, match.board);
    if(circuit.isCircuit){
      // TODO calculate the correct score
      playerPoints[theColor] = circuit.stack.length;
    }
  }
  return playerPoints;
}

runDfs = function(theSquare, theColor, board){

  var stack = new Array();
  var justPopped;
  isCircuit = false;
  dfs(theSquare, theColor);

  function getVertices(s, c){ // Returns all squares in the same color reachable from the current square
    var vertices = new Array();
    for(var i = 0; i < s.edgesTo.length; i++){
      var edgeSquare = board.getSquare(s.edgesTo[i]);
      if(edgeSquare.color === c && !(edgeSquare === justPopped)){
        vertices.push(edgeSquare);
      }
    }
    return vertices;
  }

  function setAllSquaresUnvisited(){
    for(var i = 0; i < board.board.length; i++){
      board.board[i].dfsVisited = false;
    }
  }

  function dfs(theSquare, theColor){
    if(theSquare || stack.length > 0){ // (A) If no square is passed and stack is empty end of dfs is reached

      // (B) Use the square on top of the stack in none is passed
      if(theSquare){
        stack.push(theSquare);
      }
      else{
        theSquare = stack[stack.length-1];
      }

      theSquare.dfsVisited = true; // (C) The square is visited now

      var vertices = getVertices(theSquare, theColor);  // (D) Get all vertices from the current square

      for(var i = 0; i < vertices.length; i++){
        if(!isCircuit){ // (E) Check some stuff if no circuit is recognized yet
          if(vertices[i].dfsVisited && !(vertices[i] === stack[stack.length-2])){ // (F) Visited and not the same as before
              if(stack.length>1){
                isCircuit = true;
              }
          }
          else if(vertices[i].dfsVisited && (vertices[i] === stack[stack.length-2])){ // (G) Visited and the same as before
            if(i===vertices.length-1){ // (H) Last vertex to check
              stack.pop(theSquare);
              justPopped = theSquare;
              dfs(null, theColor);
            }
          }
          else if(!vertices[i].dfsVisited){ // (I) Not visited yet - A new way is found
            justPopped = null;
            dfs(vertices[i], theColor);
          }
        }
      }
    }
  }
  setAllSquaresUnvisited();
  return {isCircuit: isCircuit,
    stack: stack};
}

exports.check = check;
