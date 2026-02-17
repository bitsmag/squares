"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchesManager = void 0;
class MatchesManager {
    constructor() {
        this.matches = [];
    }
    getMatches() {
        return this.matches;
    }
    getMatch(matchId) {
        const foundMatch = this.matches.find((m) => m.id === matchId);
        if (!foundMatch) {
            throw new Error('matchNotFound');
        }
        return foundMatch;
    }
    addMatch(match) {
        this.matches.push(match);
    }
    removeMatch(match) {
        const index = this.matches.indexOf(match);
        if (index > -1) {
            this.matches.splice(index, 1);
        }
    }
}
exports.MatchesManager = MatchesManager;
// Singleton
const manager = (function () {
    let instance;
    function createInstance() {
        const theManager = new MatchesManager();
        return theManager;
    }
    if (!instance) {
        instance = createInstance();
    }
    return instance;
})();
// CommonJS compatibility
module.exports = { manager };
