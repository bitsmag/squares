export interface LobbyHostRequestDTO {
  playerName: string;
}

export interface LobbyGuestRequestDTO {
  playerName: string;
  matchId: string;
}

export interface LobbyAppDataDTO {
  matchId: string;
  playerId: string;
  playerName: string;
  isHost: boolean;
  lobbyMessage: string;
}
