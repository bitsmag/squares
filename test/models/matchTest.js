var assert = require('chai').assert;
var expect = require('chai').expect;
var match = require('../../models/match');
var player = require('../../models/player');
var matchesManager = require('../../models/matchesManager');

describe('Hooks', function() {
  var m; // global var to remove Match after each test
  afterEach('remove match from matchesManager after each test', function() {
    if(m){
      matchesManager.manager.removeMatch(m.id);
    }
  });

  describe('Match', function() {
    describe('#getPlayer01', function () {
      it('getting a player by name should return the same object as added before', function () {
        m = new match.Match();
        var p = new player.Player('bob', m.id, true);
        var p2 = new player.Player('mara', m.id, false);

        var p3 = m.getPlayer('bob');
        expect(p).to.deep.equal(p3);
      });
    });
    describe('#getPlayer02', function () {
      it('getting a player by name should return a error if no such player exists', function () {
        m = new match.Match();
        var p = new player.Player('bob', m.id, true);
        var p2 = new player.Player('mara', m.id, false);


        var p3 = m.getPlayer('milan');
        expect(p3).to.be.instanceof(Error);
      });
    });
    describe('#getPlayerByColor01', function () {
      it('getting a player by color should return the same object as added before', function () {
        m = new match.Match();
        var p = new player.Player('bob', m.id, true);
        var p2 = new player.Player('mara', m.id, false);

        var p3 = m.getPlayerByColor(p.color);
        expect(p).to.deep.equal(p3);
      });
    });
    describe('#getPlayerByColor02', function () {
      it('getting a player by color should return a error if no player with that color exists', function () {
        m = new match.Match();
        var p = new player.Player('bob', m.id, true);
        var p2 = new player.Player('mara', m.id, false);


        var p3 = m.getPlayerByColor('purple');
        expect(p3).to.be.instanceof(Error);
      });
    });
    describe('#getMatchCreator01', function () {
      it('getting the matchCreator should return the same object as added before', function () {
        m = new match.Match();
        var p = new player.Player('bob', m.id, true);
        var p2 = new player.Player('mara', m.id, false);

        var p3 = m.getMatchCreator();
        expect(p).to.deep.equal(p3);
      });
    });
    describe('#getMatchCreator02', function () {
      it('getting the matchCreator should return a error if no matchCreator exists', function () {
        m = new match.Match();
        var p = new player.Player('bob', m.id, false);
        var p2 = new player.Player('mara', m.id, false);

        var p3 = m.getMatchCreator();
        expect(p3).to.be.instanceof(Error);
      });
    });
  });
});

// addPlayer is tested implicit with player constructor
// TODO the match id should be unique (hard to test)
