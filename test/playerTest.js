var assert             = require('chai').assert;
var expect             = require('chai').expect;
var match              = require('../models/match');
var player             = require('../models/player');
var matchesManager     = require('../models/matchesManager');

describe('Hooks', function() {
  var m; // global var to remove Match after each test
  afterEach('remove match from matchesManager after each test', function() {
    if(m){
      m.destroy();
    }
  });
  describe('Player', function() {
    describe('#construct01', function () {
      it('should create one player and add it to the passed match so there is one player in the match', function () {
        m = new match.Match();
        var p = new player.Player('bob', m, true);
        assert.equal(1, m.getPlayers().length);
      });
    });
    describe('#construct02', function () {
      it('should create three players and add them to the passed match so there are three players in the match', function () {
        m = new match.Match();
        var p = new player.Player('bob', m, true);
        var p2 = new player.Player('mike', m, false);
        var p3 = new player.Player('eva', m, false);
        assert.equal(3, m.players.length);
      });
    });
    describe('#construct03', function () {
      it('should throw an error after creating five players for the same match', function () {
        m = new match.Match();
        var p = new player.Player('bob', m, true);
        var p2 = new player.Player('mike', m, false);
        var p3 = new player.Player('eva', m, false);
        var p4 = new player.Player('jenny', m, false);
        var p5 = function(){
          new player.Player('klaus', m, false);
        };
        expect(p5).to.throw(Error);
      });
    });
    describe('#construct04', function () {
      it('should throw an error after creating a player with a name which is already in use in this match', function () {
        m = new match.Match();
        var p = new player.Player('bob', m, true);
        var p2 = function(){
          new player.Player('bob', m, false);
        };
        expect(p2).to.throw(Error);
      });
    });
    describe('#construct05', function () {
      it('should throw an error after creating a player with for active match', function () {
        m = new match.Match();
        m.setActive(true);
        var p1 = function(){
          new player.Player('bob', m, true);
        };
        expect(p1).to.throw(Error);
      });
    });
  });
});
