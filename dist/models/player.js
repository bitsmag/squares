"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
class Player {
    constructor(name, match, matchCreator) {
        this.name = name;
        this.color = '';
        this.position = 0;
        this.activeDirection = null;
        this.score = 0;
        this.doubleSpeedSpecial = false;
        this.matchCreator = matchCreator;
        this.socket = null;
        if (!match.isActive()) {
            const unusedColor = getUnusedColor(match);
            this.color = unusedColor;
            this.position = match.getBoard().getStartSquares()[unusedColor];
            match.addPlayer(this);
        }
        else {
            throw new Error('matchIsActive');
        }
    }
    getName() {
        return this.name;
    }
    getColor() {
        return this.color;
    }
    getPosition() {
        return this.position;
    }
    getActiveDirection() {
        return this.activeDirection;
    }
    getScore() {
        return this.score;
    }
    getDoubleSpeedSpecial() {
        return this.doubleSpeedSpecial;
    }
    isMatchCreator() {
        return this.matchCreator;
    }
    getSocket() {
        return this.socket;
    }
    setActiveDirection(dir) {
        if (dir === 'left' || dir === 'right' || dir === 'up' || dir === 'down') {
            this.activeDirection = dir;
        }
    }
    setSocket(socket) {
        this.socket = socket;
    }
    setPosition(pos) {
        this.position = pos;
    }
    increaseScore(points) {
        this.score += points;
    }
    startDoubleSpeedSpecial(_duration) {
        if (!this.doubleSpeedSpecial) {
            this.doubleSpeedSpecial = true;
            const duration = _duration || this.getDefaultDoubleSpeedDuration();
            setTimeout(() => {
                this.doubleSpeedSpecial = false;
            }, duration);
        }
    }
    // helper to retrieve a safe default when migrating from JS where board provided it
    getDefaultDoubleSpeedDuration() {
        return 5000;
    }
}
exports.Player = Player;
function getUnusedColor(match) {
    const unusedColors = ['blue', 'orange', 'green', 'red'];
    const players = match.getPlayers();
    for (let i = 0; i < players.length; i++) {
        const index = unusedColors.indexOf(players[i].getColor());
        if (index > -1) {
            unusedColors.splice(index, 1);
        }
    }
    if (unusedColors.length > 0) {
        return unusedColors[0];
    }
    else {
        throw new Error('matchIsFull');
    }
}
// CommonJS compatibility
module.exports = { Player };
