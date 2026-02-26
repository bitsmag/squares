import { expect } from 'chai';
import { CreateMatchLobbyService, DisconnectionSource } from '../service/createMatchLobbyService';
import { manager } from '../domain/models/matchesManager';
import type { Match } from '../domain/models/match';
import { Player } from '../domain/models/player';
import type { MatchDomainEvent, MatchEventPublisher } from '../domain/engine/matchEvents';

function getMatchesSnapshot(): Match[] {
  return manager.getMatches().slice();
}

describe('CreateMatchLobbyService', () => {
  class TestMatchEventPublisher implements MatchEventPublisher {
    public events: MatchDomainEvent[] = [];

    publish(event: MatchDomainEvent): void {
      this.events.push(event);
    }
  }

  const publisher = new TestMatchEventPublisher();
  const service: CreateMatchLobbyService = new CreateMatchLobbyService(publisher);

  afterEach(() => {
    // Clean up all matches created during a test to keep global manager state isolated
    const matches = getMatchesSnapshot();
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
    expect(match.isStartInitiated()).to.equal(false);

    service.processMatchStartInitiation(match.getId());

    expect(match.isStartInitiated()).to.equal(true);
  });

  it('processDisconnectLobby returns LOBBY_CLOSED when start is already initiated', () => {
    const match = manager.createMatch();
    const host = new Player('host', match, true);
    match.setStartInitiated(true);

    const result: DisconnectionSource = service.processDisconnectLobby(match.getId(), host.getId());

    expect(result).to.deep.equal({ type: 'LOBBY_CLOSED' });
    // Match is still present in the manager
    expect(manager.getMatch(match.getId())).to.equal(match);
    expect(match.getPlayers().length).to.be.greaterThan(0);
  });

  it('processDisconnectLobby removes host and destroys match when host leaves before start', () => {
    const match = manager.createMatch();
    const host = new Player('host', match, true);
    const guest = new Player('guest', match, false);

    const result: DisconnectionSource = service.processDisconnectLobby(match.getId(), host.getId());

    expect(result).to.deep.equal({ type: 'HOST_LEFT' });
    // Match should be removed from manager
    expect(() => manager.getMatch(match.getId())).to.throw();
  });

  it('processDisconnectLobby removes guest but keeps match when guest leaves before start', () => {
    const match = manager.createMatch();
    const host = new Player('host', match, true);
    const guest = new Player('guest', match, false);

    const result: DisconnectionSource = service.processDisconnectLobby(match.getId(), guest.getId());

    expect(result).to.deep.equal({ type: 'GUEST_LEFT' });
    const storedMatch = manager.getMatch(match.getId());
    expect(storedMatch).to.equal(match);
    expect(storedMatch.getPlayers().length).to.equal(1);
    expect(storedMatch.getPlayers()[0].isHost()).to.equal(true);
  });

  it('processCreateMatchLobbyHost creates a match with a single host player', () => {
    const { matchId, playerId } = service.processCreateMatchLobbyHost('host');

    const match = manager.getMatch(matchId);
    const player = match.getPlayerById(playerId);

    expect(player.getName()).to.equal('host');
    expect(player.isHost()).to.equal(true);
    expect(match.getPlayers().length).to.equal(1);
  });

  it('processCreateMatchLobbyGuest adds a guest player to an existing match', () => {
    const { matchId } = service.processCreateMatchLobbyHost('host');

    const { playerId } = service.processCreateMatchLobbyGuest(matchId, 'guest');

    const match = manager.getMatch(matchId);
    const guestPlayer = match.getPlayerById(playerId);
    const players = match.getPlayers();
    const hostPlayer = players.find((p) => p.isHost());

    expect(hostPlayer && hostPlayer.isHost()).to.equal(true);
    expect(guestPlayer.isHost()).to.equal(false);
    expect(guestPlayer.getName()).to.equal('guest');
    expect(match.getPlayers().length).to.equal(2);
  });
});
