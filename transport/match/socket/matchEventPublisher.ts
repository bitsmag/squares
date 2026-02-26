import type {
  MatchDomainEvent,
  MatchEventPublisher,
} from '../../../domain/engine/matchEvents';
import * as matchEmitters from './matchEmitters';
import socketErrorHandler from '../../util/socket/socketErrorHandler';
import { manager } from '../../../domain/models/matchesManager';

export class SocketMatchEventPublisher implements MatchEventPublisher {
  publish(event: MatchDomainEvent): void {
    switch (event.type) {
      case 'COUNTDOWN_TICKED': {
        matchEmitters.sendCountdownEvent(event.match);
        break;
      }
      case 'MATCH_DURATION_EXPIRED': {
        // Duration reached zero: remove match from registry and let ticker emit MATCH_ENDED
        manager.destroyMatch(event.match);
        break;
      }
      case 'MATCH_ENDED': {
        matchEmitters.sendMatchEndEvent(event.match);
        break;
      }
      case 'TICK_PROCESSED': {
        matchEmitters.sendUpdateBoardEvent(event.match, event.specials);
        matchEmitters.sendClearSquaresEvent(
          event.match,
          event.clearSquares,
          event.clearSpecials
        );
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
