var assert = require('chai').assert
var expect = require('chai').expect;

var board = require('../../models/board');

describe('Board', function() {
  describe('#construct01', function () {
    it('property board should be an array with length = 79', function () {
      var b = new board.Board();
      assert.equal(81, b.board.length);
    });
  });
  describe('#getSquare01', function () {
    it('should return a square with the same id as the passed parameter if a square with this id exists', function () {
      var b = new board.Board();
      assert.equal(5, b.getSquare(5).id);
    });
  });
  describe('#getSquare02', function () {
    it('should throw an error if no square with the passed id exists', function () {
      var b = new board.Board();

      var s = b.getSquare(9999);
      expect(s).to.be.instanceof(Error);

    });
  });
});
