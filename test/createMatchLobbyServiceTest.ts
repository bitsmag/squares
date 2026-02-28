import { expect } from 'chai';
import { CreateMatchLobbyService, DisconnectionSource } from '../service/createMatchLobbyService';
import { MatchesManager } from '../domain/models/matchesManager';
import type { Match } from '../domain/models/match';
import type { MatchDomainEvent, MatchEventPublisher } from '../domain/engine/matchEvents';

function getMatchesSnapshot(manager: MatchesManager): Match[] {
  return manager.getMatches().slice();
}

describe('CreateMatchLobbyService', () => {
  class TestMatchEventPublisher implements MatchEventPublisher {
    public events: MatchDomainEvent[] = [];

    publish(event: MatchDomainEvent): void {
      this.events.push(event);
    }
  }

  const manager = new MatchesManager();
  const publisher = new TestMatchEventPublisher();
  const service: CreateMatchLobbyService = new CreateMatchLobbyService(manager, publisher);

  afterEach(() => {
    // Clean up all matches created during a test to keep global manager state isolated
    const matches = getMatchesSnapshot(manager);
    matches.forEach((m) => {
      try {
        manager.destroyMatch(m);
      } catch (_e) {
        // ignore, destroy is idempotent for our purposes
      }
    });
  });

  it('processMatchStartInitiation marks the match as start-initiated', () => {
    const match = manager.createMatch();
    expect(match.startInitiated).to.equal(false);

    service.processMatchStartInitiation(match.id);

    expect(match.startInitiated).to.equal(true);
  });

  it('processDisconnectLobby returns LOBBY_CLOSED when start is already initiated', () => {
    const { matchId, playerId } = service.processCreateMatchLobbyHost('host');
    const match = manager.getMatch(matchId);
    match.startInitiated = true;

    const result: DisconnectionSource = service.processDisconnectLobby(matchId, playerId);

    expect(result).to.deep.equal({ type: 'LOBBY_CLOSED' });
    // Match is still present in the manager
    expect(manager.getMatch(matchId)).to.equal(match);
    expect(match.players.length).to.be.greaterThan(0);
  });

  it('processDisconnectLobby removes host and destroys match when host leaves before start', () => {
    const { matchId, playerId: hostId } = service.processCreateMatchLobbyHost('host');
    const { playerId: guestId } = service.processCreateMatchLobbyGuest(matchId, 'guest');

    const result: DisconnectionSource = service.processDisconnectLobby(matchId, hostId);

    expect(result).to.deep.equal({ type: 'HOST_LEFT' });
    // Match should be removed from manager
    expect(() => manager.getMatch(matchId)).to.throw();
  });

  it('processDisconnectLobby removes guest but keeps match when guest leaves before start', () => {
    const { matchId, playerId: hostId } = service.processCreateMatchLobbyHost('host');
    const { playerId: guestId } = service.processCreateMatchLobbyGuest(matchId, 'guest');

    const result: DisconnectionSource = service.processDisconnectLobby(matchId, guestId);

    expect(result).to.deep.equal({ type: 'GUEST_LEFT' });
    const storedMatch = manager.getMatch(matchId);
    expect(storedMatch.players.length).to.equal(1);
    expect(storedMatch.players[0].host).to.equal(true);
  });

  it('processCreateMatchLobbyHost creates a match with a single host player', () => {
    const { matchId, playerId } = service.processCreateMatchLobbyHost('host');

    const match = manager.getMatch(matchId);
    const player = match.getPlayerById(playerId);

    expect(player.name).to.equal('host');
    expect(player.host).to.equal(true);
    expect(match.players.length).to.equal(1);
  });

  it('processCreateMatchLobbyGuest adds a guest player to an existing match', () => {
    const { matchId } = service.processCreateMatchLobbyHost('host');

    const { playerId } = service.processCreateMatchLobbyGuest(matchId, 'guest');

    const match = manager.getMatch(matchId);
    const guestPlayer = match.getPlayerById(playerId);
    const players = match.players;
    const hostPlayer = players.find((p) => p.host);

    expect(hostPlayer && hostPlayer.host).to.equal(true);
    expect(guestPlayer.host).to.equal(false);
    expect(guestPlayer.name).to.equal('guest');
    expect(match.players.length).to.equal(2);
  });
});
