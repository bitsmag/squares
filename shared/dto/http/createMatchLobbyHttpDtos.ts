// HTTP DTOs for create match lobby routes

export interface CreateMatchLobbyHostRequestDTO {
  playerName: string;
}

export interface CreateMatchLobbyGuestRequestDTO {
  playerName: string;
  matchId: string;
}

// View-model data passed to createMatch.html

export interface CreateMatchLobbyAppDataDTO {
  matchId: string;
  playerId: string;
  playerName: string;
  isHost: boolean;
  lobbyMessage: string;
}
