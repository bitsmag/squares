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
const path_1 = __importDefault(require("path"));
const validation = require("../middleware/validation");
const match = __importStar(require("../models/match"));
const player = __importStar(require("../models/player"));
const matchesManager = __importStar(require("../models/matchesManager"));
const router = function (app) {
    app.get('/', function (_req, res) {
        res.sendFile(path_1.default.join(__dirname, '..', 'views', 'index.html'));
    });
    app.get('/createMatch/:playerName', validation.validate('params', validation.schemas.createMatchParams), function (req, res) {
        const playerName = req.params.playerName;
        const newMatch = new match.Match();
        const _newPlayer = new player.Player(playerName, newMatch, true);
        res.render('createMatch.html', {
            matchId: newMatch.getId(),
            playerName: playerName,
        });
    });
    app.get('/match/:matchCreatorFlag/:matchId/:playerName', validation.validate('params', validation.schemas.matchRouteParams), function (req, res, next) {
        const matchCreatorFlag = req.params.matchCreatorFlag;
        const matchId = req.params.matchId;
        const playerName = req.params.playerName;
        let matchObj;
        try {
            matchObj = matchesManager.manager.getMatch(matchId);
        }
        catch (err) {
            return next(err);
        }
        if (!matchObj)
            return next(new Error('matchNotFound'));
        if (matchCreatorFlag === 't') {
            if (!matchObj.isActive() && playerName === matchObj.getMatchCreator().getName()) {
                matchObj.setActive(true);
                res.render('match.html', { matchId: matchId, playerName: playerName });
            }
            else {
                const e = new Error('unknown');
                e.userMessage = 'There was an unknown issue - please try again.';
                return next(e);
            }
        }
        else if (matchCreatorFlag === 'f') {
            try {
                const _newPlayer = new player.Player(playerName, matchObj, false);
                return res.render('match.html', { matchId: matchId, playerName: playerName });
            }
            catch (err) {
                if (err && err.message === 'matchIsFull')
                    err.userMessage = "Sorry, you're too late. The match is full already.";
                else if (err && err.message === 'matchIsActive')
                    err.userMessage = "Sorry, you're too late. The match has already started.";
                else if (err && err.message === 'nameInUse')
                    err.userMessage = 'Sorry, it seems that your name is already used by another player. Please choose a diffrent name.';
                return next(err);
            }
        }
        else {
            const e = new Error('unknown');
            e.userMessage = 'There was an unknown issue - please try again.';
            return next(e);
        }
    });
};
exports.default = router;
module.exports = router;
