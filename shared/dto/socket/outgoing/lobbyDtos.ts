import type { PlayerColor } from '../../../../domain/valueObjects/colors';

// Shared DTOs for lobby (createMatchSockets) events

export interface LobbyPlayersDTO {
  matchId: string;
  players: { playerName: string; playerColor: PlayerColor }[];
}
