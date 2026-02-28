import type { MatchesManager } from '../domain/runtime/matchesManager';
import type { Direction } from '../domain/valueObjects/direction';
import type { MatchEventPublisher } from '../domain/engine/matchEvents';
import { MatchPresenceService } from './matchPresenceService';
import { MatchStartCoordinator } from './matchStartCoordinator';

export class MatchService {
  constructor(
    private readonly matchesManager: MatchesManager,
    private readonly presenceService: MatchPresenceService,
    private readonly startCoordinator: MatchStartCoordinator,
    private readonly eventPublisher: MatchEventPublisher
  ) {}

  startMatchWhenPlayersAreConnected(matchId: string): void {
    const match = this.matchesManager.getMatch(matchId);
    const expected = match.players.length;
    if (this.presenceService.areAllPlayersConnected(matchId, expected)) {
      this.startCoordinator.cancelCountdown(matchId);
      this.eventPublisher.publish({ type: 'MATCH_PREPARE_REQUESTED', match });
      this.startCoordinator.startMatch(match);
    } else {
      this.startCoordinator.startMatchWithCountdown(match);
    }
  }

  setDirection(matchId: string, playerId: string, direction: Direction): void {
    const match = this.matchesManager.getMatch(matchId);
    const player = match.getPlayerById(playerId);

    player.activeDirection = direction;
  }

  removePlayer(matchId: string, playerId: string): void {
    const match = this.matchesManager.getMatch(matchId);
    const player = match.getPlayerById(playerId);
    match.removePlayer(player);
  }
}
