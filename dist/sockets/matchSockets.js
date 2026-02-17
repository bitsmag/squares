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
exports.respond = respond;
const matchesManager = __importStar(require("../models/matchesManager"));
const socketErrorHandler_1 = __importDefault(require("../middleware/socketErrorHandler"));
const matchSocketService = __importStar(require("../services/matchSocketService"));
const validation = require("../middleware/validation");
function respond(socket) {
    let match;
    let player;
    socket.on('connectionInfo', function (playerInfo) {
        const result = validation.validateSocketPayload(validation.schemas.socketConnectionInfoMatch, playerInfo || {});
        if (!result.valid) {
            (0, socketErrorHandler_1.default)(match, new Error('Invalid connectionInfo payload'), 'matchSockets.connectionInfoValidation');
            console.warn('Invalid connectionInfo payload', result.errors);
            return;
        }
        const matchId = result.value.matchId;
        const playerName = result.value.playerName;
        let error = false;
        try {
            match = matchesManager.manager.getMatch(matchId);
            player = match.getPlayer(playerName);
        }
        catch (err) {
            error = true;
            (0, socketErrorHandler_1.default)(match, err, 'matchSockets.on(connectionInfo)');
        }
        if (!error) {
            player.setSocket(socket);
            if (player.isMatchCreator()) {
                matchSocketService.sendPrepareMatchEvent(match);
                match.getController().startMatch();
            }
            else {
                const data = { playerNames: [] };
                for (let i = 0; i < match.getPlayers().length; i++) {
                    data.playerNames.push(match.getPlayers()[i].getName());
                }
                player.getSocket().emit('connectedPlayers', data);
                matchSocketService.sendPlayerConnectedEvent(match, player);
            }
        }
    });
    socket.on('disconnect', function () {
        if (match) {
            match.removePlayer(player);
            matchSocketService.sendPlayerDisconnectedEvent(match, player);
        }
    });
    socket.on('goLeft', function () {
        if (player)
            player.setActiveDirection('left');
    });
    socket.on('goUp', function () {
        if (player)
            player.setActiveDirection('up');
    });
    socket.on('goRight', function () {
        if (player)
            player.setActiveDirection('right');
    });
    socket.on('goDown', function () {
        if (player)
            player.setActiveDirection('down');
    });
}
module.exports = {
    respond,
    sendPlayerConnectedEvent: matchSocketService.sendPlayerConnectedEvent,
    sendPlayerDisconnectedEvent: matchSocketService.sendPlayerDisconnectedEvent,
    sendMatchCreatorDisconnectedEvent: matchSocketService.sendMatchCreatorDisconnectedEvent,
    sendPrepareMatchEvent: matchSocketService.sendPrepareMatchEvent,
    sendUpdateBoardEvent: matchSocketService.sendUpdateBoardEvent,
    sendClearSquaresEvent: matchSocketService.sendClearSquaresEvent,
    sendUpdateScoreEvent: matchSocketService.sendUpdateScoreEvent,
    sendMatchEndEvent: matchSocketService.sendMatchEndEvent,
    sendCountdownEvent: matchSocketService.sendCountdownEvent,
    sendFatalErrorEvent: matchSocketService.sendFatalErrorEvent,
};
