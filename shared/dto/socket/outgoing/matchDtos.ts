import type { PlayerColor, SquareColor } from '../../../../domain/valueObjects/colors';

// Shared DTOs for match socket events

export interface SquareDTO {
  id: number;
  color: SquareColor;
}

export interface BoardDTO {
  width: number;
  height: number;
  squares: SquareDTO[];
}

export interface PrepareMatchPlayerDTO {
  playerName: string;
  playerColor: PlayerColor;
}

export interface PrepareMatchDTO {
  players: PrepareMatchPlayerDTO[];
  board: BoardDTO;
}

// One outer DTO per outbound event

export interface UpdateBoardDTO {
  playerStatuses: Record<
    PlayerColor,
    {
      pos: number | null;
      dir: string | null;
      doubleSpeed: boolean | null;
    }
  >;
  specials: {
    doubleSpeed: number[];
    getPoints: number[];
  };
  duration: number;
}

export interface ClearSquaresDTO {
  clearSquares: { id: number; color: PlayerColor }[];
  clearSpecials: number[];
}

export interface UpdateScoreDTO {
  scores: Record<PlayerColor, number | null>;
}

export interface CountdownDTO {
  countdownDuration: number;
}
