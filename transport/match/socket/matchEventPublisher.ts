import type { MatchDomainEvent, MatchEventPublisher } from '../../../domain/engine/matchEvents';
import * as matchEmitters from './matchEmitters';
import socketErrorHandler from '../../util/socket/socketErrorHandler';
import type { MatchesManager } from '../../../domain/models/matchesManager';

export class SocketMatchEventPublisher implements MatchEventPublisher {
  constructor(private readonly matchesManager: MatchesManager) {}

  publish(event: MatchDomainEvent): void {
    switch (event.type) {
      case 'MATCH_PREPARE_REQUESTED': {
        matchEmitters.sendPrepareMatchEvent(event.match);
        break;
      }
      case 'COUNTDOWN_TICKED': {
        matchEmitters.sendCountdownEvent(event.match);
        break;
      }
      case 'MATCH_ENDED': {
        // Normal end of match: notify clients and clean up server-side
        matchEmitters.sendMatchEndEvent(event.match);
        this.matchesManager.destroyMatch(event.match);
        break;
      }
      case 'TICK_PROCESSED': {
        matchEmitters.sendUpdateBoardEvent(event.match, event.specials);
        matchEmitters.sendClearSquaresEvent(event.match, event.clearSquares, event.clearSpecials);
        matchEmitters.sendUpdateScoreEvent(event.match);
        break;
      }
      case 'FATAL_ERROR': {
        socketErrorHandler(event.match, event.error);
        break;
      }
    }
  }
}
