import * as squareModule from './square';
import type { Square } from './square';

export class Board {
  squares: Square[];
  width: number;
  height: number;
  startSquares: { [color: string]: number };
  matchDuration: number;
  countdownDuration: number;
  doubleSpeedDuration: number;

  constructor() {
    this.squares = [];
    this.width = 9;
    this.height = 9;
    this.startSquares = { blue: 0, orange: 8, green: 72, red: 80 };
    this.matchDuration = 60;
    this.countdownDuration = 4;
    this.doubleSpeedDuration = 5000;

    // Programmatically generate all squares with their adjacency edges
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const id = y * this.width + x;
        const edgesTo: number[] = [];
        if (x > 0) edgesTo.push(id - 1);                // left
        if (y > 0) edgesTo.push(id - this.width);        // up
        if (x < this.width - 1) edgesTo.push(id + 1);    // right
        if (y < this.height - 1) edgesTo.push(id + this.width); // down
        this.squares.push(new squareModule.Square(id, edgesTo, { x, y }));
      }
    }
  }

  getSquares(): Square[] {
    return this.squares;
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  getStartSquares(): { [color: string]: number } {
    return this.startSquares;
  }

  getMatchDuration(): number {
    return this.matchDuration;
  }

  getCountdownDuration(): number {
    return this.countdownDuration;
  }

  getDoubleSpeedDuration(): number {
    return this.doubleSpeedDuration;
  }

  getSquare(id: number): Square {
    const found = this.squares.find((sq) => sq.getId() === id);
    if (!found) throw new Error('squareNotFound');
    return found;
  }

  getSquareByCoordinates(x: number, y: number): Square {
    const found = this.squares.find((sq) => sq.getPosition().x === x && sq.getPosition().y === y);
    if (!found) throw new Error('squareNotFound');
    return found;
  }
}
