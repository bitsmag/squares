// HTTP DTOs for match routes

export interface GetMatchRequestDTO {
  matchCreatorFlag: 't' | 'f';
  matchId: string;
  playerId: string;
}

// View-model data passed to match.html

export interface MatchAppDataDTO {
  matchId: string;
  playerId: string;
}
