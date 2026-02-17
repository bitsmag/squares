"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Match = void 0;
const boardModule = __importStar(require("./board"));
const matchController = __importStar(require("../controllers/matchController"));
const matchesManager = __importStar(require("./matchesManager"));
const socketErrorHandler_1 = __importDefault(require("../middleware/socketErrorHandler"));
class Match {
    constructor() {
        this.id = '';
        this.players = [];
        this.board = new boardModule.Board();
        this.controller = new matchController.MatchController(this);
        this.duration = this.board.getMatchDuration();
        this.countdownDuration = this.board.getCountdownDuration();
        this.active = false;
        this.id = createUniqueId();
        matchesManager.manager.addMatch(this);
    }
    getId() {
        return this.id;
    }
    getPlayers() {
        return this.players;
    }
    getPlayer(playerName) {
        const foundPlayer = this.players.find((p) => p.getName() === playerName);
        if (!foundPlayer) {
            throw new Error('playerNotFound');
        }
        return foundPlayer;
    }
    getPlayerByColor(playerColor) {
        const foundPlayer = this.players.find((p) => p.getColor() === playerColor);
        if (!foundPlayer) {
            throw new Error('playerNotFound');
        }
        return foundPlayer;
    }
    getMatchCreator() {
        if (this.players.length === 0) {
            throw new Error('matchCreatorNotFound');
        }
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].isMatchCreator()) {
                return this.players[i];
            }
        }
        throw new Error('matchCreatorNotFound');
    }
    getBoard() {
        return this.board;
    }
    getController() {
        return this.controller;
    }
    getDuration() {
        return this.duration;
    }
    getCountdownDuration() {
        return this.countdownDuration;
    }
    isActive() {
        return this.active;
    }
    addPlayer(player) {
        const nameDuplicate = this.isNameInUse(player.getName());
        if (this.players.length >= 4) {
            throw new Error('matchIsFull');
        }
        else if (nameDuplicate) {
            throw new Error('nameInUse');
        }
        else {
            const startSquares = this.getBoard().getStartSquares();
            this.getBoard().getSquare(startSquares[player.getColor()]).setColor(player.getColor());
            this.players.push(player);
        }
    }
    removePlayer(player) {
        const index = this.players.indexOf(player);
        if (index > -1) {
            const startSquares = this.getBoard().getStartSquares();
            this.getBoard().getSquare(startSquares[player.getColor()]).setColor('');
            this.players.splice(index, 1);
        }
        if (this.players.length < 1) {
            this.destroy();
        }
    }
    durationDecrement() {
        this.duration--;
    }
    countdownDurationDecrement() {
        this.countdownDuration--;
    }
    setActive(active) {
        this.active = active;
    }
    updatePlayers(playerPositions) {
        Object.keys(playerPositions).forEach((color) => {
            try {
                const player = this.getPlayerByColor(color);
                player.setPosition(playerPositions[color]);
            }
            catch (err) {
                (0, socketErrorHandler_1.default)(this, err, 'match.updatePlayers()');
            }
        });
    }
    updateBoard(playerPositions, _specials) {
        Object.keys(playerPositions).forEach((color) => {
            try {
                this.getBoard().getSquare(playerPositions[color]).setColor(color);
            }
            catch (err) {
                (0, socketErrorHandler_1.default)(this, err, 'match.updateBoard()');
            }
        });
    }
    updateSpecials(specials) {
        if (specials.doubleSpeed.length) {
            try {
                this.getBoard().getSquare(specials.doubleSpeed[0]).setDoubleSpeedSpecial(true);
            }
            catch (err) {
                (0, socketErrorHandler_1.default)(this, err, 'match.updateSpecials()');
            }
        }
        if (specials.getPoints.length) {
            try {
                this.getBoard().getSquare(specials.getPoints[0]).setGetPointsSpecial(true);
            }
            catch (err) {
                (0, socketErrorHandler_1.default)(this, err, 'match.updateSpecials()');
            }
        }
    }
    isNameInUse(name) {
        let nameInUse;
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].getName() === name) {
                nameInUse = true;
            }
        }
        return nameInUse;
    }
    destroy() {
        this.setActive(false);
        matchesManager.manager.removeMatch(this);
    }
}
exports.Match = Match;
function createUniqueId() {
    let timestamp, matchId, duplicate, unique = false;
    while (!unique) {
        timestamp = Date.now().toString();
        matchId = 'x' + timestamp.substring(timestamp.length - 4, timestamp.length);
        duplicate = false;
        for (let i = 0; i < matchesManager.manager.getMatches().length; i++) {
            if (matchesManager.manager.getMatches()[i].getId() === matchId) {
                duplicate = true;
            }
        }
        if (!duplicate) {
            unique = true;
        }
    }
    return matchId;
}
// CommonJS compatibility
module.exports = { Match };
