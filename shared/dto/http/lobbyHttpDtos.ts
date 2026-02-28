export interface CreateMatchLobbyHostRequestDTO {
  playerName: string;
}

export interface CreateMatchLobbyGuestRequestDTO {
  playerName: string;
  matchId: string;
}

export interface CreateMatchLobbyAppDataDTO {
  matchId: string;
  playerId: string;
  playerName: string;
  isHost: boolean;
  lobbyMessage: string;
}
