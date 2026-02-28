import type { Match } from '../entities/match';
import type { PlayerColor } from '../valueObjects/colors';

export type MatchSpecials = {
  doubleSpeed: number[];
  getPoints: number[];
};

export type ClearedSquare = {
  id: number;
  color: PlayerColor;
};

export type MatchDomainEvent =
  | { type: 'MATCH_PREPARE_REQUESTED'; match: Match }
  | { type: 'COUNTDOWN_TICKED'; match: Match }
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
