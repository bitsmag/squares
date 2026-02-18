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

export const manager = new MatchesManager();
