import type { Match } from '../models/match';
import type { PlayerColor } from '../models/colors';

export type MatchSpecials = {
  doubleSpeed: number[];
  getPoints: number[];
};

export type ClearedSquare = {
  id: number;
  color: PlayerColor;
};

export type MatchDomainEvent =
  | { type: 'COUNTDOWN_TICKED'; match: Match }
  | { type: 'MATCH_DURATION_EXPIRED'; match: Match }
  | { type: 'MATCH_ENDED'; match: Match }
  | {
      type: 'TICK_PROCESSED';
      match: Match;
      specials: MatchSpecials;
      clearSquares: ClearedSquare[];
      clearSpecials: number[];
    }
  | { type: 'FATAL_ERROR'; match?: Match; error: unknown };

export interface MatchEventPublisher {
  publish(event: MatchDomainEvent): void;
}
