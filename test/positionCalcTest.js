var expect = require('chai').expect;
var matchMod = require('../models/match');
var playerMod = require('../models/player');
var positionCalc = require('../controllers/matchTicker/positionCalc');

describe('PositionCalc', function () {
  it('calculates simple right move for a single player', function () {
    var m = new matchMod.Match();
    // create a player (match creator)
    var p = new playerMod.Player('alice', m, true);
    // ensure starting position is 0 for blue
    expect(p.getColor()).to.equal('blue');
    p.setActiveDirection('right');
    // current pos should be 0
    expect(p.getPosition()).to.equal(0);
    var result = positionCalc.calculateNewPlayerPositions(m, [p.getColor()]);
    expect(result).to.have.property('blue');
    expect(result.blue).to.equal(1);
    m.destroy();
  });
});
