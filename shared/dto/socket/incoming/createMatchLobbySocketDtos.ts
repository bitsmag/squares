// Socket DTOs for createMatchLobby incoming events

export interface RegisterPlayerLobbyDTO {
  matchId: string;
  playerId: string;
  playerName: string;
  isHost: boolean;
}
