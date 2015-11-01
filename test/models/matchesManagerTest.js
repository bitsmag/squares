var assert = require('chai').assert;
var expect = require('chai').expect;
var match = require('../../models/match');
var matchesManager = require('../../models/matchesManager');


  describe('MatchesManager', function() {
    describe('#manager', function () {
      it('The matchesManager should be always the exact same object', function () {
        var mm = matchesManager.manager;
        var mm2 = matchesManager.manager;
        expect(mm).to.deep.equal(mm2);
      });
    });
    describe('#getMatch01', function () {
      it('getting a match by id should return the exact same match as added before', function () {
        var mm = matchesManager.manager;
        var m = new match.Match();
        expect(mm.getMatch(m.id)).to.deep.equal(m);
        //after
        matchesManager.manager.removeMatch(m.id);
      });
    });
    describe('#getMatch02', function () {
      it('getting a match by id should throw an error if there is no match with the passed id', function () {
        var mm = matchesManager.manager;
        var m = new match.Match();
        var wrongID = (m.id === 'x1111' ? 'x2222' : 'x1111');

        var x = mm.getMatch(wrongID);
        expect(x).to.be.instanceof(Error);
        //after
        matchesManager.manager.removeMatch(m.id);
      });
    });
    describe('#removeMatch01', function () {
      it('after creating one match and then removing one match from the manager there should be no more matches in the manager', function () {
        var mm = matchesManager.manager;
        var m = new match.Match();
        mm.removeMatch(m.id);
        expect(mm.matches.length).to.equal(0);
      });
    });
    describe('#removeMatch02', function () {
      it('after creating five matches and then removing one match from the manager there should be four matches in the manager', function () {
        var mm = matchesManager.manager;
        var m = new match.Match();
        var m2 = new match.Match();
        var m3 = new match.Match();
        var m4 = new match.Match();
        var m5 = new match.Match();
        mm.removeMatch(m.id);
        expect(mm.matches.length).to.equal(4);
        //after
        mm.removeMatch(m2.id);
        mm.removeMatch(m3.id);
        mm.removeMatch(m4.id);
        mm.removeMatch(m5.id);
      });
    });
    describe('#removeMatch03', function () {
      it('after creating five matches and then removing one match from the manager the removed match should not be in the manager anymore', function () {
        var mm = matchesManager.manager;
        var m = new match.Match();
        var m2 = new match.Match();
        var m3 = new match.Match();
        var m4 = new match.Match();
        var m5 = new match.Match();
        mm.removeMatch(m.id);

        var x = mm.getMatch(m.id);
        expect(x).to.be.instanceof(Error);
        //after
        mm.removeMatch(m2.id);
        mm.removeMatch(m3.id);
        mm.removeMatch(m4.id);
        mm.removeMatch(m5.id);
      });
    });
    describe('#removeMatch04', function () {
      it('passing a id which does not belong to any match should throw an error', function () {
        var mm = matchesManager.manager;
        m = new match.Match();
        var wrongID = (m.id === 1111 ? 2222 : 1111);

        var x = mm.removeMatch(wrongID);
        expect(x).to.be.instanceof(Error);
        //after
        mm.removeMatch(m.id);
      });
    });
  });


// addMatch is tested implicit with match constructor
