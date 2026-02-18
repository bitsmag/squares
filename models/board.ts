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

    const square0 = new squareModule.Square(0, [1, 9], { x: 0, y: 0 });
    const square1 = new squareModule.Square(1, [0, 10, 2], { x: 1, y: 0 });
    const square2 = new squareModule.Square(2, [1, 11, 3], { x: 2, y: 0 });
    const square3 = new squareModule.Square(3, [2, 12, 4], { x: 3, y: 0 });
    const square4 = new squareModule.Square(4, [3, 13, 5], { x: 4, y: 0 });
    const square5 = new squareModule.Square(5, [4, 14, 6], { x: 5, y: 0 });
    const square6 = new squareModule.Square(6, [5, 15, 7], { x: 6, y: 0 });
    const square7 = new squareModule.Square(7, [6, 16, 8], { x: 7, y: 0 });
    const square8 = new squareModule.Square(8, [7, 17], { x: 8, y: 0 });

    this.squares.push(
      square0,
      square1,
      square2,
      square3,
      square4,
      square5,
      square6,
      square7,
      square8
    );

    const square9 = new squareModule.Square(9, [0, 10, 18], { x: 0, y: 1 });
    const square10 = new squareModule.Square(10, [9, 1, 11, 19], { x: 1, y: 1 });
    const square11 = new squareModule.Square(11, [10, 2, 12, 20], { x: 2, y: 1 });
    const square12 = new squareModule.Square(12, [11, 3, 13, 21], { x: 3, y: 1 });
    const square13 = new squareModule.Square(13, [12, 4, 14, 22], { x: 4, y: 1 });
    const square14 = new squareModule.Square(14, [13, 5, 15, 23], { x: 5, y: 1 });
    const square15 = new squareModule.Square(15, [14, 6, 16, 24], { x: 6, y: 1 });
    const square16 = new squareModule.Square(16, [15, 7, 17, 25], { x: 7, y: 1 });
    const square17 = new squareModule.Square(17, [8, 16, 26], { x: 8, y: 1 });

    this.squares.push(
      square9,
      square10,
      square11,
      square12,
      square13,
      square14,
      square15,
      square16,
      square17
    );

    const square18 = new squareModule.Square(18, [9, 19, 27], { x: 0, y: 2 });
    const square19 = new squareModule.Square(19, [18, 10, 20, 28], { x: 1, y: 2 });
    const square20 = new squareModule.Square(20, [19, 11, 21, 29], { x: 2, y: 2 });
    const square21 = new squareModule.Square(21, [20, 12, 22, 30], { x: 3, y: 2 });
    const square22 = new squareModule.Square(22, [21, 13, 23, 31], { x: 4, y: 2 });
    const square23 = new squareModule.Square(23, [22, 14, 24, 32], { x: 5, y: 2 });
    const square24 = new squareModule.Square(24, [23, 15, 25, 33], { x: 6, y: 2 });
    const square25 = new squareModule.Square(25, [24, 16, 26, 34], { x: 7, y: 2 });
    const square26 = new squareModule.Square(26, [17, 25, 35], { x: 8, y: 2 });

    this.squares.push(
      square18,
      square19,
      square20,
      square21,
      square22,
      square23,
      square24,
      square25,
      square26
    );

    const square27 = new squareModule.Square(27, [18, 28, 36], { x: 0, y: 3 });
    const square28 = new squareModule.Square(28, [19, 29, 37, 27], { x: 1, y: 3 });
    const square29 = new squareModule.Square(29, [20, 30, 38, 28], { x: 2, y: 3 });
    const square30 = new squareModule.Square(30, [21, 31, 39, 29], { x: 3, y: 3 });
    const square31 = new squareModule.Square(31, [22, 32, 40, 30], { x: 4, y: 3 });
    const square32 = new squareModule.Square(32, [23, 33, 41, 31], { x: 5, y: 3 });
    const square33 = new squareModule.Square(33, [24, 34, 42, 32], { x: 6, y: 3 });
    const square34 = new squareModule.Square(34, [25, 35, 43, 33], { x: 7, y: 3 });
    const square35 = new squareModule.Square(35, [26, 34, 44], { x: 8, y: 3 });

    this.squares.push(
      square27,
      square28,
      square29,
      square30,
      square31,
      square32,
      square33,
      square34,
      square35
    );

    const square36 = new squareModule.Square(36, [27, 37, 45], { x: 0, y: 4 });
    const square37 = new squareModule.Square(37, [28, 38, 46, 36], { x: 1, y: 4 });
    const square38 = new squareModule.Square(38, [29, 39, 47, 37], { x: 2, y: 4 });
    const square39 = new squareModule.Square(39, [30, 40, 48, 38], { x: 3, y: 4 });
    const square40 = new squareModule.Square(40, [31, 41, 49, 39], { x: 4, y: 4 });
    const square41 = new squareModule.Square(41, [32, 42, 50, 40], { x: 5, y: 4 });
    const square42 = new squareModule.Square(42, [33, 43, 51, 41], { x: 6, y: 4 });
    const square43 = new squareModule.Square(43, [34, 44, 52, 42], { x: 7, y: 4 });
    const square44 = new squareModule.Square(44, [35, 43, 53], { x: 8, y: 4 });

    this.squares.push(
      square36,
      square37,
      square38,
      square39,
      square40,
      square41,
      square42,
      square43,
      square44
    );

    const square45 = new squareModule.Square(45, [36, 46, 54], { x: 0, y: 5 });
    const square46 = new squareModule.Square(46, [37, 47, 55, 45], { x: 1, y: 5 });
    const square47 = new squareModule.Square(47, [38, 48, 56, 46], { x: 2, y: 5 });
    const square48 = new squareModule.Square(48, [39, 49, 57, 47], { x: 3, y: 5 });
    const square49 = new squareModule.Square(49, [40, 50, 58, 48], { x: 4, y: 5 });
    const square50 = new squareModule.Square(50, [41, 51, 59, 49], { x: 5, y: 5 });
    const square51 = new squareModule.Square(51, [42, 52, 60, 50], { x: 6, y: 5 });
    const square52 = new squareModule.Square(52, [43, 53, 61, 51], { x: 7, y: 5 });
    const square53 = new squareModule.Square(53, [44, 52, 62], { x: 8, y: 5 });

    this.squares.push(
      square45,
      square46,
      square47,
      square48,
      square49,
      square50,
      square51,
      square52,
      square53
    );

    const square54 = new squareModule.Square(54, [45, 55, 63], { x: 0, y: 6 });
    const square55 = new squareModule.Square(55, [46, 56, 64, 54], { x: 1, y: 6 });
    const square56 = new squareModule.Square(56, [47, 57, 65, 55], { x: 2, y: 6 });
    const square57 = new squareModule.Square(57, [48, 58, 66, 56], { x: 3, y: 6 });
    const square58 = new squareModule.Square(58, [49, 59, 67, 57], { x: 4, y: 6 });
    const square59 = new squareModule.Square(59, [50, 60, 68, 58], { x: 5, y: 6 });
    const square60 = new squareModule.Square(60, [51, 61, 69, 59], { x: 6, y: 6 });
    const square61 = new squareModule.Square(61, [52, 62, 70, 60], { x: 7, y: 6 });
    const square62 = new squareModule.Square(62, [53, 61, 71], { x: 8, y: 6 });

    this.squares.push(
      square54,
      square55,
      square56,
      square57,
      square58,
      square59,
      square60,
      square61,
      square62
    );

    const square63 = new squareModule.Square(63, [54, 64, 72], { x: 0, y: 7 });
    const square64 = new squareModule.Square(64, [55, 65, 73, 63], { x: 1, y: 7 });
    const square65 = new squareModule.Square(65, [56, 66, 74, 64], { x: 2, y: 7 });
    const square66 = new squareModule.Square(66, [57, 67, 75, 65], { x: 3, y: 7 });
    const square67 = new squareModule.Square(67, [58, 68, 76, 66], { x: 4, y: 7 });
    const square68 = new squareModule.Square(68, [59, 69, 77, 67], { x: 5, y: 7 });
    const square69 = new squareModule.Square(69, [60, 70, 78, 68], { x: 6, y: 7 });
    const square70 = new squareModule.Square(70, [61, 71, 79, 69], { x: 7, y: 7 });
    const square71 = new squareModule.Square(71, [62, 70, 80], { x: 8, y: 7 });

    this.squares.push(
      square63,
      square64,
      square65,
      square66,
      square67,
      square68,
      square69,
      square70,
      square71
    );

    const square72 = new squareModule.Square(72, [63, 73], { x: 0, y: 8 });
    const square73 = new squareModule.Square(73, [72, 64, 74], { x: 1, y: 8 });
    const square74 = new squareModule.Square(74, [73, 65, 75], { x: 2, y: 8 });
    const square75 = new squareModule.Square(75, [74, 66, 76], { x: 3, y: 8 });
    const square76 = new squareModule.Square(76, [75, 67, 77], { x: 4, y: 8 });
    const square77 = new squareModule.Square(77, [76, 68, 78], { x: 5, y: 8 });
    const square78 = new squareModule.Square(78, [77, 69, 79], { x: 6, y: 8 });
    const square79 = new squareModule.Square(79, [78, 70, 80], { x: 7, y: 8 });
    const square80 = new squareModule.Square(80, [79, 71], { x: 8, y: 8 });

    this.squares.push(
      square72,
      square73,
      square74,
      square75,
      square76,
      square77,
      square78,
      square79,
      square80
    );
  }

  getSquares(): any[] {
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

  getSquare(id: number): any {
    let error = false;
    for (let i = 0; i < this.squares.length; i++) {
      if (this.squares[i].getId() === id) {
        return this.squares[i];
      } else {
        error = true;
      }
    }
    if (error) {
      throw new Error('squareNotFound');
    }
  }

  getSquareByCoordinates(x: number, y: number): any {
    let error = false;
    for (let i = 0; i < this.squares.length; i++) {
      if (this.squares[i].getPosition().x === x && this.squares[i].getPosition().y === y) {
        return this.squares[i];
      } else {
        error = true;
      }
    }
    if (error) {
      throw new Error('squareNotFound');
    }
  }
}

// CommonJS compatibility
module.exports = { Board } as any;
