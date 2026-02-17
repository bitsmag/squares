var expect = require('chai').expect;
var randomSpecials = require('../controllers/matchTicker/randomSpecials');
var matchMod = require('../models/match');

describe('RandomSpecials', function() {
  it('can produce both specials when random returns low values', function() {
    var m = new matchMod.Match();
    // stub Math.random to deterministic sequence
    var seq = [0.05, 0.06, 0.01, 0.02]; // first two used for indices; then doubleSpeedChance=0.01 (<0.02), getPointsChance=0.02 (<0.028)
    var idx = 0;
    var orig = Math.random;
    Math.random = function(){ return seq[idx++ % seq.length]; };

    var specials = randomSpecials.getSpecials(m);
    expect(specials).to.have.property('doubleSpeed');
    expect(specials).to.have.property('getPoints');
    // One or zero entries depending on implementation but given our stub both should be possible
    // Restore
    Math.random = orig;
    m.destroy();
  });
});
