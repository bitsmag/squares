import * as squareModule from './square';
import type { Square } from './square';
import { Board } from './board';
import type { PlayerColor } from '../valueObjects/colors';

export type BoardSettings = {
  width: number;
  height: number;
  startSquares: { [color in PlayerColor]: number };
  matchDurationSeconds: number;
  countdownSeconds: number;
  doubleSpeedDurationMs: number;
};

export const defaultBoardSettings: BoardSettings = {
  width: 9,
  height: 9,
  startSquares: { blue: 0, orange: 8, green: 72, red: 80 },
  matchDurationSeconds: 60,
  countdownSeconds: 4,
  doubleSpeedDurationMs: 5000,
};

export function createGridSquares(width: number, height: number): Square[] {
  const squares: Square[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const id = y * width + x;
      const edgesTo: number[] = [];
      if (x > 0) edgesTo.push(id - 1); // left
      if (y > 0) edgesTo.push(id - width); // up
      if (x < width - 1) edgesTo.push(id + 1); // right
      if (y < height - 1) edgesTo.push(id + width); // down
      squares.push(new squareModule.Square(id, edgesTo, { x, y }));
    }
  }
  return squares;
}

export function createDefaultBoard(): Board {
  const squares = createGridSquares(defaultBoardSettings.width, defaultBoardSettings.height);
  return new Board(defaultBoardSettings, squares);
}
