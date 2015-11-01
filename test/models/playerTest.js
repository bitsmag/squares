var assert = require('chai').assert;
var expect = require('chai').expect;
var match = require('../../models/match');
var player = require('../../models/player');
var matchesManager = require('../../models/matchesManager');

// describe('Hooks', function() {
//   var m; // global var to remove Match after each test
//   afterEach('remove match from matchesManager after each test', function() {
//     if(m){
//       matchesManager.manager.removeMatch(m.id);
//     }
//   });
describe('Hooks', function() {
  var m; // global var to remove Match after each test
  afterEach('remove match from matchesManager after each test', function() {
    if(m){
      matchesManager.manager.removeMatch(m.id);
    }
  });
  describe('Player', function() {
    describe('#construct01', function () {
      it('after creating one player, ther should be one player in the match', function () {
        m = new match.Match();
        var p = new player.Player('bob', m.id, true);
        assert.equal(1, m.players.length);
      });
    });
    describe('#construct02', function () {
      it('after creating three players with the same matchID, there should be three players in the match', function () {
        m = new match.Match();
        var p = new player.Player('bob', m.id, true);
        var p2 = new player.Player('mike', m.id, false);
        var p3 = new player.Player('eva', m.id, false);
        assert.equal(3, m.players.length);
      });
    });
    describe.skip('#construct03', function () { // TODO integration test, when the 4th player is created the matchReadyEvent should be sent
      it('after creating five players with the same matchID, an error should be thrown', function () {
        m = new match.Match();
        var p = new player.Player('bob', m.id, true);
        var p2 = new player.Player('mike', m.id, false);
        var p3 = new player.Player('eva', m.id, false);
        var p4 = new player.Player('jenny', m.id, false);


        var p5 = new player.Player('klaus', m.id, false);
        expect(p5).to.be.instanceof(Error);
      });
    });
    describe('#construct04', function () {
      it('creating a player with a name already used in this match should throw an error', function () {
        m = new match.Match();
        var p = new player.Player('bob', m.id, true);

        var p2 = new player.Player('bob', m.id, false);
        expect(p2).to.be.instanceof(Error);
      });
    });
    describe('#construct05', function () {
      it('creating a player as matchCreator should throw an error if another matchCreator already exists in this match', function () {
        m = new match.Match();
        var p = new player.Player('bob', m.id, true);

        var p2 = new player.Player('mara', m.id, true);
        expect(p2).to.be.instanceof(Error);
      });
    });
  });
});
