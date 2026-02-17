var assert             = require('chai').assert;
var expect             = require('chai').expect;
var match              = require('../models/match');
var player             = require('../models/player');
var matchesManager     = require('../models/matchesManager');

describe('Hooks', function() {
  var m; // global var to remove Match after each test
  afterEach('destroy match after each test', function() {
    if(m){
      m.destroy();
    }
  });

  describe('Match', function() {
    describe('#getPlayer01', function () {
      it('should return the player with the same name as the passed parameter', function () {
        m = new match.Match();
        var p = new player.Player('bob', m, true);
        var p2 = new player.Player('mara', m, false);

        var p3 = m.getPlayer('bob');
        expect(p).to.deep.equal(p3);
      });
    });
    describe('#getPlayer02', function () {
      it('should throw an error after trying to get a non-existing player', function () {
        m = new match.Match();
        var p = new player.Player('bob', m, true);
        var p2 = new player.Player('mara', m, false);

        var p3 = function(){
          m.getPlayer('milan');
        };
        expect(p3).to.throw(Error);
      });
    });
  });
});
