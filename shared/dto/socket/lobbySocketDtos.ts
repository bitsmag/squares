import type { PlayerColor } from '../../../domain/valueObjects/valueObjects';

// Incoming lobby socket DTOs

export interface RegisterPlayerLobbyDTO {
  matchId: string;
  playerId: string;
  playerName: string;
  isHost: boolean;
}

// Outgoing lobby socket DTOs

export interface LobbyPlayersDTO {
  matchId: string;
  players: { playerName: string; playerColor: PlayerColor }[];
}
