var expect = require('chai').expect;
var matchMod = require('../models/match');
var playerMod = require('../models/player');
var boardMod = require('../models/board');
var circuitsCheck = require('../controllers/matchTicker/circuitsCheck');
describe('CircuitsCheck', function () {
    it('detects a 3x3 loop and awards enclosed + loop squares', function () {
        var m = new matchMod.Match();
        var b = m.getBoard();
        // Build a 3x3 loop from coordinates x=1..3, y=1..3 (border squares)
        var borderCoords = [];
        for (var y = 1; y <= 3; y++) {
            for (var x = 1; x <= 3; x++) {
                if (!(x === 2 && y === 2))
                    borderCoords.push({ x: x, y: y });
            }
        }
        // paint border squares blue
        borderCoords.forEach(function (c) {
            var s = b.getSquareByCoordinates(c.x, c.y);
            s.setColor('blue');
        });
        // center remains uncolored (will be enclosed)
        var center = b.getSquareByCoordinates(2, 2);
        // Create a blue player and place him on one of the border squares
        var p = new playerMod.Player('bob', m, true);
        p.setPosition(b.getSquareByCoordinates(1, 1).getId());
        var points = circuitsCheck.getPlayerPoints(m);
        expect(points).to.have.property('blue');
        // Expect 9 points: 8 border + 1 center
        expect(points.blue.length).to.equal(9);
        // center should be included
        var centerIds = points.blue.map(function (s) { return s.getId(); });
        expect(centerIds).to.include(center.getId());
        m.destroy();
    });
});
