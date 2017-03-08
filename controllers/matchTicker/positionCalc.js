"use strict";
let matchSockets      = require('../../sockets/matchSockets');

function calculateNewPlayerPositions(match, playerList){
  let activeColors = [];
  let players = match.getPlayers();
  for(let i = 0; i<players.length; i++){
    activeColors.push(players[i].getColor());
  }

  // Get currentPos, futurePos & prio of active Players

  let currentPos = {blue: null, orange: null, green: null, red: null};
  let futurePos = {blue: null, orange: null, green: null, red: null};
  let prio = {blue: false, orange: false, green: false, red: false};

  for(let i = 0; i<activeColors.length; i++){
    let player;
    let error = false;
    try {
      player = match.getPlayerByColor(activeColors[i]);
    }
    catch(err){
      error = true;
      matchSockets.sendFatalErrorEvent(match);
      match.destroy();
      console.warn(err.message + ' // positionCalc.calculateNewPlayerPositions()');
      console.trace();
    }
    if(!error){
      currentPos[activeColors[i]] = player.getPosition();
      futurePos[activeColors[i]] = calculateFuturePos(player.getPosition(), player.getActiveDirection(), match.getBoard(), match);
      // If the player is not in the playerList it remains at the old position
      if(playerList.indexOf(activeColors[i]) === -1){
        futurePos[activeColors[i]]=currentPos[activeColors[i]];
      }
      if(currentPos[activeColors[i]]===futurePos[activeColors[i]]){
              prio[activeColors[i]] = true;
      }
    }
  }

  // Solving Conflict (1) - multiple players want to move on the same square:
  // If there is a confict between players there are winners (those who can
  // move on to the square they want) and loosers (those who must remain on
  // their current position). If a player has priority on a square (still
  // standing players) he wins. If no player has priority loosers are chosen
  // randomly.

  let loosers = [];

  for(let i=0; i<activeColors.length; i++){
    for(let j=0; j<activeColors.length; j++){
      if(i !== j && futurePos[activeColors[i]]===futurePos[activeColors[j]]){
        if(prio[activeColors[i]]){
          loosers.push(activeColors[j]);
        }
        else if(prio[activeColors[j]]){
          loosers.push(activeColors[i]);
        }
        else {
          let uniqueRandomNumbers = {};
          for(let k=0; k<activeColors.length; k++){
            uniqueRandomNumbers[activeColors[k]] = Math.random();
          }
          if(uniqueRandomNumbers[activeColors[i]] === Math.max(uniqueRandomNumbers[activeColors[i]], uniqueRandomNumbers[activeColors[j]])){
            loosers.push(activeColors[j]);
          }
          else {
            loosers.push(activeColors[i]);
          }
        }
      }
    }
  }

  // Solving Conflict (2) - two players want to jump 'over' each other (switch squares):
  // Both players must remain on their current squares.

  for(let i=0; i<activeColors.length; i++){
    for(let j=0; j<activeColors.length; j++){
      if(i !== j && futurePos[activeColors[i]] === currentPos[activeColors[j]] && futurePos[activeColors[j]] === currentPos[activeColors[i]]){
        loosers.push(activeColors[i]);
        loosers.push(activeColors[j]);
      }
    }
  }

  // Loosers must remain on their current squares

  loosers = loosers.reduce(function(a,b){if(a.indexOf(b)<0)a.push(b);return a;},[]);
  for(let i=0; i<loosers.length; i++){
    futurePos[loosers[i]] = currentPos[loosers[i]];
  }

  // Return only the positions of the Players which has been passed as args (playerList)
  Object.keys(futurePos).forEach(function(color) {
    if(playerList.indexOf(color) === -1){
      delete futurePos[color];
    }
  });

  return futurePos;
}

function calculateFuturePos(currentPosition, activeDirection, board, match){
  let square;
  let error = false;
  try{
    square = board.getSquare(currentPosition);
  }
  catch(err){
    error = true;
    matchSockets.sendFatalErrorEvent(match);
    match.destroy();
    console.warn(err.message + ' // positionCalc.calculateFuturePos()');
    console.trace();
  }
  if(!error){
    switch(activeDirection){
      case 'left':
        if(square.getPosition().x>0){
          return currentPosition-1;
        }
        else{
          return currentPosition;
        }
        break;
      case 'up':
        if(square.getPosition().y>0){
          return currentPosition-board.getWidth();
        }
        else{
          return currentPosition;
        }
        break;
      case 'right':
        if(square.getPosition().x<board.getWidth()-1){
          return currentPosition+1;
        }
        else{
          return currentPosition;
        }
        break;
      case 'down':
        if(square.getPosition().y<board.getHeight()-1){
          return currentPosition+board.getWidth();
        }
        else{
          return currentPosition;
        }
        break;
      default:
        return currentPosition;
    }
  }
}

exports.calculateNewPlayerPositions = calculateNewPlayerPositions;
