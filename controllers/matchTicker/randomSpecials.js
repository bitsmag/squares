"use strict";
function getSpecials(match){
  let specials = {doubleSpeed: [], getPoints: []};
  
  let randomDoubleSpeedSquare = 0;
  let randomGetPointsSquare = 0;
  while(randomDoubleSpeedSquare===randomGetPointsSquare){
	  randomDoubleSpeedSquare = Math.floor((Math.random() * match.getBoard().getSquares().length-1) + 1);
	  randomGetPointsSquare = Math.floor((Math.random() * match.getBoard().getSquares().length-1) + 1);
  }

  let doubleSpeedChance = Math.random();
  if(doubleSpeedChance < 0.020){
    specials.doubleSpeed.push(randomDoubleSpeedSquare);
  }
  
  let getPointsChance = Math.random();
  if(getPointsChance < 0.028){
    specials.getPoints.push(randomGetPointsSquare);
  }

  return specials;
}

exports.getSpecials = getSpecials;
