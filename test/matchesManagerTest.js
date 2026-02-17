var assert = require('chai').assert;
var expect = require('chai').expect;
var match = require('../models/match');
var matchesManager = require('../models/matchesManager');


  describe('MatchesManager', function() {
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
        var m = new match.Match();
        expect(mm.getMatch(m.id)).to.deep.equal(m);
        //after
        m.destroy();
      });
    });
    describe('#getMatch02', function () {
      it('should throw an error after trying to get a non-existing match', function () {
        var mm = matchesManager.manager;
        var m = function(){
          mm.getMatch('x1111');
        };
        expect(m).to.throw(Error);
      });
    });
    describe('#destroyMatch01', function () {
      it('should destroy the only match so there are no more matches in the manager', function () {
        var mm = matchesManager.manager;
        var m = new match.Match();
        m.destroy();
        expect(mm.getMatches().length).to.equal(0);
      });
    });
    describe('#destroyMatch02', function () {
      it('should destroy one of three matches so there are two matches left in the manager', function () {
        var mm = matchesManager.manager;
        var m = new match.Match();
        var m1 = new match.Match();
        var m2 = new match.Match();
        m.destroy();
        expect(mm.matches.length).to.equal(2);
        //after
        m1.destroy();
        m2.destroy();
      });
    });
    describe('#destroyMatch03', function () {
      it('should throw an error after trying to get a destroyed match', function () {
        var mm = matchesManager.manager;
        var m = new match.Match();
        var m1 = new match.Match();
        m.destroy();

        var m2 = function(){
          mm.getMatch(m);
        };
        expect(m2).to.throw(Error);
        //after
        m1.destroy();
      });
    });
  });
