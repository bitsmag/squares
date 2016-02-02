function getSpecials(match){
  var specials = {doubleSpeed: []};

  var r = Math.random();
  if(r < 0.023){
    var randomSquare = Math.floor((Math.random() * match.getBoard().getSquares().length-1) + 1);
    specials.doubleSpeed.push(randomSquare);
  }

  return specials;
}

exports.getSpecials = getSpecials;
