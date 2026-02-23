var assert = require('chai').assert;
var expect = require('chai').expect;
var match = require('../domain/models/match.ts');
var player = require('../domain/models/player.ts');
var matchesManager = require('../domain/models/matchesManager.ts');

describe('Hooks', function () {
  var m; // global var to remove Match after each test
  afterEach('destroy match after each test', function () {
    if (m) {
      m.destroy();
    }
  });

  describe('Match', function () {
    describe('#getPlayer01', function () {
      it('should return the player with the same name as the passed parameter', function () {
        m = matchesManager.manager.createMatch();
        var colors = ['blue', 'orange'];
        var p = new player.Player('bob', colors[0], m.getBoard().getStartSquares()[colors[0]], true);
        var p2 = new player.Player('mara', colors[1], m.getBoard().getStartSquares()[colors[1]], false);
        m.addPlayer(p);
        m.addPlayer(p2);

        var p3 = m.getPlayer('bob');
        expect(p).to.deep.equal(p3);
      });
    });
    describe('#getPlayer02', function () {
      it('should throw an error after trying to get a non-existing player', function () {
        m = matchesManager.manager.createMatch();
        var colors = ['blue', 'orange'];
        var p = new player.Player('bob', colors[0], m.getBoard().getStartSquares()[colors[0]], true);
        var p2 = new player.Player('mara', colors[1], m.getBoard().getStartSquares()[colors[1]], false);
        m.addPlayer(p);
        m.addPlayer(p2);

        var p3 = function () {
          m.getPlayer('milan');
        };
        expect(p3).to.throw(Error);
      });
    });
  });
});
