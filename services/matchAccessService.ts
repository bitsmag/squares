import { manager } from '../models/matchesManager';
import { Player } from '../models/player';

export type MatchAccessResult = { matchId: string; playerName: string };

export class MatchAccessError extends Error {
  code: MatchAccessErrorCode;

  constructor(code: MatchAccessErrorCode, message?: string) {
    super(message || code);
    this.code = code;
  }
}

export type MatchAccessErrorCode =
  | 'matchNotFound'
  | 'hostMismatch'
  | 'alreadyActive'
  | 'matchFull'
  | 'matchActive'
  | 'nameInUse'
  | 'unknown';

export function getUserMessage(code: MatchAccessErrorCode): string {
  switch (code) {
    case 'matchNotFound':
      return 'The match you are looking for was not found.';
    case 'hostMismatch':
      return 'There was an unknown issue - please try again.';
    case 'alreadyActive':
      return 'There was an unknown issue - please try again.';
    case 'matchFull':
      return "Sorry, you're too late. The match is full already.";
    case 'matchActive':
      return "Sorry, you're too late. The match has already started.";
    case 'nameInUse':
      return 'Sorry, it seems that your name is already used by another player. Please choose a different name.';
    case 'unknown':
    default:
      return 'There was an unknown issue - please try again.';
  }
}

// Step 1: surface API (to be implemented in later steps)
export function startHost(_matchId: string, _playerName: string): MatchAccessResult {
  try {
    const match = manager.getMatch(_matchId);

    if (match.isActive()) {
      throw new MatchAccessError('alreadyActive');
    }

    if (match.getMatchCreator().getName() !== _playerName) {
      throw new MatchAccessError('hostMismatch');
    }

    match.setActive(true); //Tis should be done in registerConnection when the host connects with socket, 
    
    return { matchId: _matchId, playerName: _playerName };
  } catch (err) {
    if (err instanceof MatchAccessError) {
      throw err;
    }
    if (err instanceof Error && err.message === 'matchNotFound') {
      throw new MatchAccessError('matchNotFound');
    }
    throw new MatchAccessError('unknown');
  }
}

export function joinGuest(_matchId: string, _playerName: string): MatchAccessResult {
  try {
    const match = manager.getMatch(_matchId);
    new Player(_playerName, match, false);
    return { matchId: _matchId, playerName: _playerName };
  } catch (err) {
    if (err instanceof MatchAccessError) {
      throw err;
    }
    if (err instanceof Error) {
      if (err.message === 'matchNotFound') {
        throw new MatchAccessError('matchNotFound');
      }
      if (err.message === 'matchIsFull') {
        throw new MatchAccessError('matchFull');
      }
      if (err.message === 'matchIsActive') {
        throw new MatchAccessError('matchActive');
      }
      if (err.message === 'nameInUse') {
        throw new MatchAccessError('nameInUse');
      }
    }
    throw new MatchAccessError('unknown');
  }
}
