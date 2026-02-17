import type { Match } from './match';

export class MatchesManager {
  matches: Match[];

  constructor() {
    this.matches = [];
  }

  getMatches(): Match[] {
    return this.matches;
  }

  getMatch(matchId: string): Match {
    const foundMatch = this.matches.find((m) => m.id === matchId);
    if (!foundMatch) {
      throw new Error('matchNotFound');
    }
    return foundMatch;
  }

  addMatch(match: Match): void {
    this.matches.push(match);
  }

  removeMatch(match: Match): void {
    const index = this.matches.indexOf(match);
    if (index > -1) {
      this.matches.splice(index, 1);
    }
  }
}

// Singleton
const manager = (function () {
  let instance: MatchesManager | undefined;

  function createInstance(): MatchesManager {
    const theManager = new MatchesManager();
    return theManager;
  }
  if (!instance) {
    instance = createInstance();
  }
  return instance;
})();

// CommonJS compatibility
module.exports = { manager } as any;
