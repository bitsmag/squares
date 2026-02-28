var expect = require('chai').expect;

// NOTE: Tests load the TypeScript sources directly (mocha is run with ts-node in this project).
var matchMod = require('../domain/entities/match.ts');
var playerMod = require('../domain/entities/player.ts');
var circuitsCheck = require('../domain/engine/utilities/circuitsCheck.ts');

describe('circuitsCheck.getPlayerPoints', function () {
  it('detects a 3x3 loop and awards enclosed + loop squares', function () {
    // Arrange
    var match = new matchMod.Match('test-match');
    var board = match.board;

    // Build a 3x3 loop from coordinates x=1..3, y=1..3 (border squares)
    var borderCoords = [];
    for (var y = 1; y <= 3; y++) {
      for (var x = 1; x <= 3; x++) {
        if (!(x === 2 && y === 2)) borderCoords.push({ x: x, y: y });
      }
    }

    // Paint border squares blue
    borderCoords.forEach(function (c) {
      var s = board.getSquareByCoordinates(c.x, c.y);
      s.color = 'blue';
    });

    // Center remains uncolored (will be enclosed)
    var center = board.getSquareByCoordinates(2, 2);

    // Create a blue player and place them on one of the border squares
    var startSquare = board.getSquareByCoordinates(1, 1);
    var player = new playerMod.Player('bob', 'blue', startSquare.id, true);

    // We only need the player to exist in match.players for circuitsCheck
    match.players.push(player);

    // Act
    var points = circuitsCheck.getPlayerPoints(match);

    // Assert
    expect(points).to.have.property('blue');
    // Expect 9 squares: 8 border + 1 center
    expect(points.blue.length).to.equal(9);

    var ids = points.blue.map(function (sq) {
      return sq.id;
    });
    expect(ids).to.include(center.id);
  });

  it('returns no points when there is no closed loop', function () {
    // Arrange
    var match = new matchMod.Match('no-loop');
    var board = match.board;

    // Paint a simple line of blue squares (no enclosure)
    for (var x = 1; x <= 4; x++) {
      var sq = board.getSquareByCoordinates(x, 1);
      sq.color = 'blue';
    }

    var start = board.getSquareByCoordinates(1, 1);
    var player = new playerMod.Player('alice', 'blue', start.id, true);
    match.players.push(player);

    // Act
    var points = circuitsCheck.getPlayerPoints(match);

    // Assert
    expect(points).to.have.property('blue');
    expect(points.blue.length).to.equal(0);
  });
});
