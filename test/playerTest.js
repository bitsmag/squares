var assert = require('chai').assert;
var expect = require('chai').expect;
var match = require('../domain/models/match.ts');
var player = require('../domain/models/player.ts');
var matchesManager = require('../domain/models/matchesManager.ts');

describe('Hooks', function () {
  var m; // global var to remove Match after each test
  afterEach('remove match from matchesManager after each test', function () {
    if (m) {
      m.destroy();
    }
  });
  describe('Player', function () {
    describe('#construct01', function () {
      it('should create one player and add it to the passed match so there is one player in the match', function () {
        m = matchesManager.manager.createMatch();
        var color = 'blue';
        var position = m.getBoard().getStartSquares()[color];
        var p = new player.Player('bob', color, position, true);
        m.addPlayer(p);
        assert.equal(1, m.getPlayers().length);
      });
    });
    describe('#construct02', function () {
      it('should create three players and add them to the passed match so there are three players in the match', function () {
        m = matchesManager.manager.createMatch();
        var colors = ['blue', 'orange', 'green'];
        var p = new player.Player('bob', colors[0], m.getBoard().getStartSquares()[colors[0]], true);
        var p2 = new player.Player('mike', colors[1], m.getBoard().getStartSquares()[colors[1]], false);
        var p3 = new player.Player('eva', colors[2], m.getBoard().getStartSquares()[colors[2]], false);
        m.addPlayer(p);
        m.addPlayer(p2);
        m.addPlayer(p3);
        assert.equal(3, m.players.length);
      });
    });
    describe('#construct03', function () {
      it('should throw an error after creating five players for the same match', function () {
        m = matchesManager.manager.createMatch();
        var colors = ['blue', 'orange', 'green', 'red'];
        var players = colors.map(function (color, index) {
          var pos = m.getBoard().getStartSquares()[color];
          return new player.Player('p' + index, color, pos, index === 0);
        });
        players.forEach(function (p) {
          m.addPlayer(p);
        });

        var extraPlayer = function () {
          var pos = m.getBoard().getStartSquares()['blue'];
          m.addPlayer(new player.Player('extra', 'blue', pos, false));
        };
        expect(extraPlayer).to.throw(Error);
      });
    });
    describe('#construct04', function () {
      it('should throw an error after creating a player with a name which is already in use in this match', function () {
        m = matchesManager.manager.createMatch();
        var color = 'blue';
        var pos = m.getBoard().getStartSquares()[color];
        var p = new player.Player('bob', color, pos, true);
        m.addPlayer(p);

        var duplicate = function () {
          m.addPlayer(new player.Player('bob', color, pos, false));
        };
        expect(duplicate).to.throw(Error);
      });
    });
    describe('#construct05', function () {
      it('should throw an error after creating a player with for active match', function () {
        m = matchesManager.manager.createMatch();
        m.setActive(true);
        var color = 'blue';
        var pos = m.getBoard().getStartSquares()[color];
        var addingToActiveMatch = function () {
          m.addPlayer(new player.Player('bob', color, pos, true));
        };
        expect(addingToActiveMatch).to.throw(Error);
      });
    });
  });
});
