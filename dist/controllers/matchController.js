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
exports.MatchController = void 0;
const positionCalc = __importStar(require("./matchTicker/positionCalc"));
const circuitsCheck = __importStar(require("./matchTicker/circuitsCheck"));
const randomSpecials = __importStar(require("./matchTicker/randomSpecials"));
const matchSocketService = __importStar(require("../services/matchSocketService"));
const socketErrorHandler_1 = __importDefault(require("../middleware/socketErrorHandler"));
class MatchController {
    constructor(match) {
        this.match = match;
    }
    startMatch() {
        const countdownDurationDecrementInterval = setInterval(() => {
            if (!this.match.isActive()) {
                clearInterval(countdownDurationDecrementInterval);
            }
            else {
                this.match.countdownDurationDecrement();
                matchSocketService.sendCountdownEvent(this.match);
                if (this.match.getCountdownDuration() === 0) {
                    clearInterval(countdownDurationDecrementInterval);
                    this.timer(this.match.getDuration());
                    this.matchTicker();
                }
            }
        }, 1000);
    }
    timer(_duration) {
        const durationDecrementInterval = setInterval(() => {
            if (!this.match.isActive()) {
                clearInterval(durationDecrementInterval);
            }
            else {
                this.match.durationDecrement();
                if (this.match.getDuration() === 0) {
                    clearInterval(durationDecrementInterval);
                    this.match.setActive(false);
                }
            }
        }, 1000);
    }
    matchTicker() {
        let tickCount = 0;
        const tick = () => {
            tickCount++;
            if (!this.match.isActive()) {
                matchSocketService.sendMatchEndEvent(this.match);
                clearInterval(tickerInterval);
            }
            else {
                let playerPositions;
                if (tickCount % 2 !== 0) {
                    const activeColors = [];
                    const players = this.match.getPlayers();
                    for (let i = 0; i < players.length; i++) {
                        activeColors.push(players[i].getColor());
                    }
                    playerPositions = positionCalc.calculateNewPlayerPositions(this.match, activeColors);
                }
                else {
                    const doubleSpeedColors = [];
                    const players = this.match.getPlayers();
                    for (let i = 0; i < players.length; i++) {
                        if (players[i].getDoubleSpeedSpecial()) {
                            doubleSpeedColors.push(players[i].getColor());
                        }
                    }
                    playerPositions = positionCalc.calculateNewPlayerPositions(this.match, doubleSpeedColors);
                }
                this.match.updatePlayers(playerPositions);
                this.match.updateBoard(playerPositions);
                const playerPoints = circuitsCheck.getPlayerPoints(this.match);
                const clearSpecials = [];
                Object.keys(playerPositions).forEach((color) => {
                    try {
                        const playerPositionSquare = this.match.getBoard().getSquare(playerPositions[color]);
                        if (playerPositionSquare.getGetPointsSpecial()) {
                            for (let i = 0; i < this.match.getBoard().getSquares().length; i++) {
                                const square = this.match.getBoard().getSquares()[i];
                                if (square.getColor() === color) {
                                    playerPoints[color].push(square);
                                }
                            }
                            playerPositionSquare.setGetPointsSpecial(false);
                            clearSpecials.push(playerPositionSquare.getId());
                        }
                        if (playerPositionSquare.getDoubleSpeedSpecial()) {
                            this.match.getPlayerByColor(color).startDoubleSpeedSpecial(this.match.getBoard().getDoubleSpeedDuration());
                            playerPositionSquare.setDoubleSpeedSpecial(false);
                            clearSpecials.push(playerPositionSquare.getId());
                        }
                    }
                    catch (err) {
                        (0, socketErrorHandler_1.default)(this.match, err, 'match.Controller.matchTicker()');
                    }
                });
                Object.keys(playerPositions).forEach((color) => {
                    try {
                        this.match.getPlayerByColor(color).increaseScore(playerPoints[color].length);
                    }
                    catch (err) {
                        (0, socketErrorHandler_1.default)(this.match, err, 'match.Controller.matchTicker()');
                    }
                });
                const clearSquares = [];
                Object.keys(playerPositions).forEach((color) => {
                    for (let i = 0; i < playerPoints[color].length; i++) {
                        clearSquares.push({ id: playerPoints[color][i].getId(), color: color });
                        playerPoints[color][i].setColor('');
                    }
                });
                const specials = randomSpecials.getSpecials(this.match);
                this.match.updateSpecials(specials);
                matchSocketService.sendUpdateBoardEvent(this.match, specials);
                matchSocketService.sendClearSquaresEvent(this.match, clearSquares, clearSpecials);
                matchSocketService.sendUpdateScoreEvent(this.match);
            }
        };
        const tickerInterval = setInterval(tick, 250);
    }
}
exports.MatchController = MatchController;
// Keep CommonJS compatibility for existing require() usages
module.exports = { MatchController };
