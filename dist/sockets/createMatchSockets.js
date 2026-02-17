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
const matchSocketService = __importStar(require("../services/matchSocketService"));
const socketErrorHandler_1 = __importDefault(require("../middleware/socketErrorHandler"));
const validation = require("../middleware/validation");
function respond(socket) {
    let match;
    let player;
    let startBtnClicked = false;
    socket.on('connectionInfo', function (playerInfo) {
        const result = validation.validateSocketPayload(validation.schemas.socketConnectionInfoCreate, playerInfo || {});
        if (!result.valid) {
            (0, socketErrorHandler_1.default)(match, new Error('Invalid connectionInfo payload'), 'createMatchSockets.connectionInfoValidation');
            console.warn('Invalid connectionInfo payload', result.errors);
            return;
        }
        const matchId = result.value.matchId;
        let error = false;
        try {
            match = matchesManager.manager.getMatch(matchId);
            player = match.getMatchCreator();
        }
        catch (err) {
            error = true;
            (0, socketErrorHandler_1.default)(match, err, 'createMatchSockets.on(connectionInfo)');
        }
        if (!error) {
            player.setSocket(socket);
        }
    });
    socket.on('disconnect', function () {
        if (match) {
            if (!startBtnClicked) {
                matchSocketService.sendMatchCreatorDisconnectedEvent(match);
                match.removePlayer(player);
                match.destroy();
            }
        }
    });
    socket.on('startBtnClicked', function () {
        startBtnClicked = true;
    });
}
module.exports = { respond };
