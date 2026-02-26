// HTTP DTOs for match routes

export interface GetMatchRequestDTO {
  matchId: string;
  playerId: string;
}

// View-model data passed to match.html

export interface MatchAppDataDTO {
  matchId: string;
  playerId: string;
  playerName: string;
}
