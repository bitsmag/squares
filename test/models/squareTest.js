var assert = require('chai').assert;
var square = require('../../models/square');

describe('Square', function() {
  describe('#construct01', function () {
    it('the square should get the color blue if the start position for blue is the same as the squareID', function () {
      var startPoints = {blue: 6,
                          orange: 8,
                          green: 72,
                          red: 80}
      var s  = new square.Square(6,  [1, 9],           {x: 0, y: 0}, startPoints);
      assert.equal(s.color, 'blue');
    });
  });
  describe('#construct02', function () {
    it('the square should get the color green if the start position for green is the same as the squareID', function () {
      var startPoints = {blue: 6,
                          orange: 8,
                          green: 40,
                          red: 80}
      var s  = new square.Square(40,  [1, 9],           {x: 0, y: 0}, startPoints);
      assert.equal(s.color, 'green');
    });
  });
});

// TODO how to test the other params?
