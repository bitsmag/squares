var assert             = require('chai').assert;
var expect             = require('chai').expect;

var board              = require('../models/board');

describe('Board', function() {
  describe('#getSquare01', function () {
    it('should return the square with the same id as the passed parameter', function () {
      var b = new board.Board();
      assert.equal(5, b.getSquare(5).getId());
    });
  });
  describe('#getSquare02', function () {
    it('should throw an error if no square with the passed id exists', function () {
      var b = new board.Board();
      var s = function(){
        b.getSquare(9999)
      };
      expect(s).to.throw(Error);
    });
  });
});
