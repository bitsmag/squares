import { Match } from './match';

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

  createMatch(): Match {
    const id = this.createUniqueId();
    const match = new Match(id);
    this.addMatch(match);
    return match;
  }

  destroyMatch(match: Match): void {
    match.active = false;
    this.removeMatch(match);
  }

  private createUniqueId(): string {
    let timestamp: string;
    let matchId = '';
    let unique = false;

    while (!unique) {
      timestamp = Date.now().toString();
      matchId = 'x' + timestamp.substring(timestamp.length - 4);

      const duplicate = this.matches.some((m) => m.id === matchId);
      unique = !duplicate;
    }

    return matchId;
  }
}

