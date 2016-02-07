"use strict";
function getSpecials(match){
  let specials = {doubleSpeed: []};

  let r = Math.random();
  if(r < 0.023){
    let randomSquare = Math.floor((Math.random() * match.getBoard().getSquares().length-1) + 1);
    specials.doubleSpeed.push(randomSquare);
  }

  return specials;
}

exports.getSpecials = getSpecials;
