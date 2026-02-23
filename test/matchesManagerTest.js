var assert = require('chai').assert;
var expect = require('chai').expect;
var match = require('../domain/models/match.ts');
var matchesManager = require('../domain/models/matchesManager.ts');

describe('MatchesManager', function () {
  describe('#manager', function () {
    it('should always return the same object (singelon)', function () {
      var mm = matchesManager.manager;
      var mm1 = matchesManager.manager;
      expect(mm).to.deep.equal(mm1);
    });
  });
  describe('#getMatch01', function () {
    it('should return the match with the same id as the passed parameter', function () {
      var mm = matchesManager.manager;
      var m = mm.createMatch();
      expect(mm.getMatch(m.id)).to.deep.equal(m);
      // after
      mm.destroyMatch(m);
    });
  });
  describe('#getMatch02', function () {
    it('should throw an error after trying to get a non-existing match', function () {
      var mm = matchesManager.manager;
      var m = function () {
        mm.getMatch('x1111');
      };
      expect(m).to.throw(Error);
    });
  });
  describe('#destroyMatch01', function () {
    it('should destroy the only match so there are no more matches in the manager', function () {
      var mm = matchesManager.manager;
      var m = mm.createMatch();
      mm.destroyMatch(m);
      expect(mm.getMatches().length).to.equal(0);
    });
  });
  describe('#destroyMatch02', function () {
    it('should destroy one of three matches so there are two matches left in the manager', function () {
      var mm = matchesManager.manager;
      var m = mm.createMatch();
      var m1 = mm.createMatch();
      var m2 = mm.createMatch();
      mm.destroyMatch(m);
      expect(mm.getMatches().length).to.equal(2);
      // after
      mm.destroyMatch(m1);
      mm.destroyMatch(m2);
    });
  });
  describe('#destroyMatch03', function () {
    it('should throw an error after trying to get a destroyed match', function () {
      var mm = matchesManager.manager;
      var m = mm.createMatch();
      var m1 = mm.createMatch();
      mm.destroyMatch(m);

      var m2 = function () {
        mm.getMatch(m.id);
      };
      expect(m2).to.throw(Error);
      // after
      mm.destroyMatch(m1);
    });
  });
});
