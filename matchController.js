var square = require('./square');
var matchSockets = require('./matchSockets');

function MatchController(match){
  this.match = match;
}

MatchController.prototype.countdown = function(x){
  function ticker(i){
    var j = i;
    setTimeout(function(){
      var secondsLeft = y - j;
      matchSockets.sendCountdownEvent(that.match.id, secondsLeft)
      if(secondsLeft>0){
        j++;
        ticker(j);
      }
      else{
        that.runMatch();
      }
    }, 1000);
  }
  var that = this;
  var i = 0;
  var y = x;
  ticker(i);
}

MatchController.prototype.runMatch = function(){
  this.match.running = true;
  this.timer(this.match.duration);
  this.matchTicker();
}

MatchController.prototype.timer = function(duration){
  function durationDecrement(){
    setTimeout(function() {
      that.match.duration--;
      if(that.match.duration>0){
        durationDecrement();
      }
      else{
        that.match.running = false;
      }
    }, 1000);
  }
  var that = this;
  durationDecrement();
}

MatchController.prototype.matchTicker = function(){
  function tick(){
    if(!that.match.running){
      clearInterval(tickerInterval);
    }
    else{
      that.updateBoard();
      that.checkForCircuits();
      matchSockets.sendTickUpdateEvent(that.match.id);
    }
  }
  var that = this;
  var tickerInterval = setInterval(tick, 500);
}

MatchController.prototype.updateBoard = function(){
  var positions = this.getNewPlayerPositions();

  // Set new positions on players
  this.match.getPlayerByColor('blue').position = positions.blue;
  this.match.getPlayerByColor('orange').position = positions.orange;
  this.match.getPlayerByColor('green').position = positions.green;
  this.match.getPlayerByColor('red').position = positions.red;

  // Set color on board
  // TODO: Don't apply color if player is not moving
  this.match.board.getSquare(positions.blue).color = 'blue';
  this.match.board.getSquare(positions.orange).color = 'orange';
  this.match.board.getSquare(positions.green).color = 'green';
  this.match.board.getSquare(positions.red).color = 'red';
}

MatchController.prototype.getNewPlayerPositions = function(){ // TODO: Make this function a little bit nicer...
  // Current Positions
  var blueCurrent = this.match.getPlayerByColor('blue').position;
  var orangeCurrent = this.match.getPlayerByColor('orange').position;
  var greenCurrent = this.match.getPlayerByColor('green').position;
  var redCurrent = this.match.getPlayerByColor('red').position;

  // Positions players wants to move to
  var blueFuture = this.calculateStep(blueCurrent, this.match.getPlayerByColor('blue').activeDirection);
  var orangeFuture = this.calculateStep(orangeCurrent, this.match.getPlayerByColor('orange').activeDirection);
  var greenFuture = this.calculateStep(greenCurrent, this.match.getPlayerByColor('green').activeDirection);
  var redFuture = this.calculateStep(redCurrent, this.match.getPlayerByColor('red').activeDirection);

  // If a player stands still it has priority on conflict calculation
  var blueP, orangeP, greenP, redP = false;
  if(blueCurrent === blueFuture) blueP = true;
  if(orangeCurrent === orangeFuture) orangeP = true;
  if(greenCurrent === greenFuture) greenP = true;
  if(redCurrent === redFuture) redP = true;

  // Deal with conflicts
  if(blueFuture === orangeFuture){
    if(!blueP && !orangeP){ // If noone has priority decide randomly
      if(Math.floor(Math.random()*2)===0){
        blueFuture = blueCurrent;
      }
      else{
        orangeFuture = orangeCurrent;
      }
    }
    else if(blueP){ // If blue has priority orange cant move
      orangeFuture = orangeCurrent;
    }
    else if(orangeP){ // If orange has priority blue cant move
      blueFuture = blueCurrent;
    }
  }
  if(blueFuture === redFuture){
    if(!blueP && !redP){
      if(Math.floor(Math.random()*2)===0){
        blueFuture = blueCurrent;
      }
      else{
        redFuture = redCurrent;
      }
    }
    else if(blueP){
      redFuture = redCurrent;
    }
    else if(redP){
      blueFuture = blueCurrent;
    }
  }
  if(blueFuture === greenFuture){
    if(!blueP && !greenP){
      if(Math.floor(Math.random()*2)===0){
        blueFuture = blueCurrent;
      }
      else{
        greenFuture = greenCurrent;
      }
    }
    else if(blueP){
      greenFuture = greenCurrent;
    }
    else if(greenP){
      blueFuture = blueCurrent;
    }
  }
  if(redFuture === greenFuture){
    if(!redP && ! greenP){
      if(Math.floor(Math.random()*2)===0){
        redFuture = redCurrent;
      }
      else{
        greenFuture = greenCurrent;
      }
    }
    else if(redP){
      greenFuture = greenCurrent;
    }
    else if(greenP){
      redFuture = redCurrent;
    }
  }
  if(redFuture === orangeFuture){
    if(!redP && !orangeP){
      if(Math.floor(Math.random()*2)===0){
        redFuture = redCurrent;
      }
      else{
        orangeFuture = orangeCurrent;
      }
    }
    else if(redP){
      orangeFuture = orangeCurrent;
    }
    else if(orangeP){
      redFuture = redCurrent;
    }
  }
  if(greenFuture === orangeFuture){
    if(!greenP && !orangeP){
      if(Math.floor(Math.random()*2)===0){
        greenFuture = greenCurrent;
      }
      else{
        orangeFuture = orangeCurrent;
      }
    }
    else if(greenP){
      orangeFuture = orangeCurrent;
    }
    else if(orangeP){
      greenFuture = greenCurrent;
    }
  }

  var positions = {blue: blueFuture,
    orange: orangeFuture,
    green: greenFuture,
    red: redFuture}
  return positions;
}

MatchController.prototype.calculateStep = function(currentPosition, activeDirection){
  switch(activeDirection){
    case 'left':
      if(this.match.board.getSquare(currentPosition).position.x>0){
        return currentPosition-1;
      }
      else{
        return currentPosition;
      }
      break;
    case 'up':
      if(this.match.board.getSquare(currentPosition).position.y>0){
        return currentPosition-this.match.board.width;
      }
      else{
        return currentPosition;
      }
      break;
    case 'right':
      if(this.match.board.getSquare(currentPosition).position.x<this.match.board.width-1){
        return currentPosition+1;
      }
      else{
        return currentPosition;
      }
      break;
    case 'down':
      if(this.match.board.getSquare(currentPosition).position.y<this.match.board.height-1){
        return currentPosition+this.match.board.width;
      }
      else{
        return currentPosition;
      }
      break;
    default:
      return currentPosition;
  }
}

MatchController.prototype.checkForCircuits = function(){

  for(var i = 0; i < this.match.players.length; i++){
    var theSquare = this.match.board.getSquare(this.match.players[i].position); // SquareID of the players position
    var theColor = this.match.players[i].color; // The players color
    var circuit = this.searchForCircuit(theSquare, theColor);
    if(circuit.isCircuit){
      this.match.players[i].score += circuit.stack.length;

      for(var j = 0; j < this.match.board.board.length; j++){
        if(this.match.board.board[j].color === this.match.players[i].color){
          this.match.board.board[j].color = '';
        }
      }


      // TODO remove only the squeares which created the circuit, calculate the right score
    }
}


  /*var theSquare = this.match.board.getSquare(this.match.getPlayerByColor('blue').position); // SquareID of the players position
  var theColor = 'blue'; // The players color

  var stack = this.searchForCircuit(theSquare, theColor); // Returns array of the squares building the circuit
  console.log(stack.isCircuit);*/
}

MatchController.prototype.searchForCircuit = function(theSquare, theColor){

  var that = this;
  var stack = new Array();
  var justPopped;
  isCircuit = false;
  dfs(theSquare, theColor);

  function getVertices(s, c){ // Returns all squares in the same color reachable from the current square
    var vertices = new Array();
    for(var i = 0; i < s.edgesTo.length; i++){
      var edgeSquare = that.match.board.getSquare(s.edgesTo[i]);
      if(edgeSquare.color === c && !(edgeSquare === justPopped)){
        vertices.push(edgeSquare);
      }
    }
    return vertices;
  }

  function setAllSquaresUnvisited(){
    for(var i = 0; i < that.match.board.board.length; i++){
      that.match.board.board[i].dfsVisited = false;
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



exports.MatchController = MatchController;
