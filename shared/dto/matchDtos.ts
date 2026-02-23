import type { PlayerColor, SquareColor } from '../../domain/models/colors';

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
