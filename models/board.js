var square = require('./square');

function Board(){
  this.board = [];
  this.width = 9;
  this.height = 9;
  this.startPoints = {blue: 0,
                      orange: 8,
                      green: 72,
                      red: 80}
  this.matchDuration = 4000;
  this.countdownDuration = 5;

  var square0  = new square.Square(0,  [1, 9],           {x: 0, y: 0}, this.startPoints);
  var square1  = new square.Square(1,  [0, 10, 2],       {x: 1, y: 0}, this.startPoints);
  var square2  = new square.Square(2,  [1, 11, 3],       {x: 2, y: 0}, this.startPoints);
  var square3  = new square.Square(3,  [2, 12, 4],       {x: 3, y: 0}, this.startPoints);
  var square4  = new square.Square(4,  [3, 13, 5],       {x: 4, y: 0}, this.startPoints);
  var square5  = new square.Square(5,  [4, 14, 6],       {x: 5, y: 0}, this.startPoints);
  var square6  = new square.Square(6,  [5, 15, 7],       {x: 6, y: 0}, this.startPoints);
  var square7  = new square.Square(7,  [6, 16, 8],       {x: 7, y: 0}, this.startPoints);
  var square8  = new square.Square(8,  [7, 17],          {x: 8, y: 0}, this.startPoints);

  this.board.push(square0, square1, square2, square3, square4, square5, square6, square7, square8);

  var square9  = new square.Square(9,  [0, 10, 18],      {x: 0, y: 1}, this.startPoints);
  var square10 = new square.Square(10, [9, 1, 11, 19],   {x: 1, y: 1}, this.startPoints);
  var square11 = new square.Square(11, [10, 2, 12, 20],  {x: 2, y: 1}, this.startPoints);
  var square12 = new square.Square(12, [11, 3, 13, 21],  {x: 3, y: 1}, this.startPoints);
  var square13 = new square.Square(13, [12, 4, 14, 22],  {x: 4, y: 1}, this.startPoints);
  var square14 = new square.Square(14, [13, 5, 15, 23],  {x: 5, y: 1}, this.startPoints);
  var square15 = new square.Square(15, [14, 6, 16, 24],  {x: 6, y: 1}, this.startPoints);
  var square16 = new square.Square(16, [15, 7, 17, 25],  {x: 7, y: 1}, this.startPoints);
  var square17 = new square.Square(17, [8, 16, 26],      {x: 8, y: 1}, this.startPoints);

  this.board.push(square9, square10, square11, square12, square13, square14, square15, square16, square17);

  var square18 = new square.Square(18, [9, 19, 27],      {x: 0, y: 2}, this.startPoints);
  var square19 = new square.Square(19, [18, 10, 20, 28], {x: 1, y: 2}, this.startPoints);
  var square20 = new square.Square(20, [19, 11, 21, 29], {x: 2, y: 2}, this.startPoints);
  var square21 = new square.Square(21, [20, 12, 22, 30], {x: 3, y: 2}, this.startPoints);
  var square22 = new square.Square(22, [21, 13, 23, 31], {x: 4, y: 2}, this.startPoints);
  var square23 = new square.Square(23, [22, 14, 24, 32], {x: 5, y: 2}, this.startPoints);
  var square24 = new square.Square(24, [23, 15, 25, 33], {x: 6, y: 2}, this.startPoints);
  var square25 = new square.Square(25, [24, 16, 26, 34], {x: 7, y: 2}, this.startPoints);
  var square26 = new square.Square(26, [17, 25, 35],     {x: 8, y: 2}, this.startPoints);

  this.board.push(square18, square19, square20, square21, square22, square23, square24, square25, square26);

  var square27 = new square.Square(27, [18, 28, 36],     {x: 0, y: 3}, this.startPoints);
  var square28 = new square.Square(28, [19, 29, 37, 27], {x: 1, y: 3}, this.startPoints);
  var square29 = new square.Square(29, [20, 30, 38, 28], {x: 2, y: 3}, this.startPoints);
  var square30 = new square.Square(30, [21, 31, 39, 29], {x: 3, y: 3}, this.startPoints);
  var square31 = new square.Square(31, [22, 32, 40, 30], {x: 4, y: 3}, this.startPoints);
  var square32 = new square.Square(32, [23, 33, 41, 31], {x: 5, y: 3}, this.startPoints);
  var square33 = new square.Square(33, [24, 34, 42, 32], {x: 6, y: 3}, this.startPoints);
  var square34 = new square.Square(34, [25, 35, 43, 33], {x: 7, y: 3}, this.startPoints);
  var square35 = new square.Square(35, [26, 34, 44],     {x: 8, y: 3}, this.startPoints);

  this.board.push(square27, square28, square29, square30, square31, square32, square33, square34, square35);

  var square36 = new square.Square(36, [27, 37, 45],     {x: 0, y: 4}, this.startPoints);
  var square37 = new square.Square(37, [28, 38, 46, 36], {x: 1, y: 4}, this.startPoints);
  var square38 = new square.Square(38, [29, 39, 47, 37], {x: 2, y: 4}, this.startPoints);
  var square39 = new square.Square(39, [30, 40, 48, 38], {x: 3, y: 4}, this.startPoints);
  var square40 = new square.Square(40, [31, 41, 49, 39], {x: 4, y: 4}, this.startPoints);
  var square41 = new square.Square(41, [32, 42, 50, 40], {x: 5, y: 4}, this.startPoints);
  var square42 = new square.Square(42, [33, 43, 51, 41], {x: 6, y: 4}, this.startPoints);
  var square43 = new square.Square(43, [34, 44, 52, 42], {x: 7, y: 4}, this.startPoints);
  var square44 = new square.Square(44, [35, 43, 53],     {x: 8, y: 4}, this.startPoints);

  this.board.push(square36, square37, square38, square39, square40, square41, square42, square43, square44);

  var square45 = new square.Square(45, [36, 46, 54],     {x: 0, y: 5}, this.startPoints);
  var square46 = new square.Square(46, [37, 47, 55, 45], {x: 1, y: 5}, this.startPoints);
  var square47 = new square.Square(47, [38, 48, 56, 46], {x: 2, y: 5}, this.startPoints);
  var square48 = new square.Square(48, [39, 49, 57, 47], {x: 3, y: 5}, this.startPoints);
  var square49 = new square.Square(49, [40, 50, 58, 48], {x: 4, y: 5}, this.startPoints);
  var square50 = new square.Square(50, [41, 51, 59, 49], {x: 5, y: 5}, this.startPoints);
  var square51 = new square.Square(51, [42, 52, 60, 50], {x: 6, y: 5}, this.startPoints);
  var square52 = new square.Square(52, [43, 53, 61, 51], {x: 7, y: 5}, this.startPoints);
  var square53 = new square.Square(53, [44, 52, 62],     {x: 8, y: 5}, this.startPoints);

  this.board.push(square45, square46, square47, square48, square49, square50, square51, square52, square53);

  var square54 = new square.Square(54, [45, 55, 63],     {x: 0, y: 6}, this.startPoints);
  var square55 = new square.Square(55, [46, 56, 64, 54], {x: 1, y: 6}, this.startPoints);
  var square56 = new square.Square(56, [47, 57, 65, 55], {x: 2, y: 6}, this.startPoints);
  var square57 = new square.Square(57, [48, 58, 66, 56], {x: 3, y: 6}, this.startPoints);
  var square58 = new square.Square(58, [49, 59, 67, 57], {x: 4, y: 6}, this.startPoints);
  var square59 = new square.Square(59, [50, 60, 68, 58], {x: 5, y: 6}, this.startPoints);
  var square60 = new square.Square(60, [51, 61, 69, 59], {x: 6, y: 6}, this.startPoints);
  var square61 = new square.Square(61, [52, 62, 70, 60], {x: 7, y: 6}, this.startPoints);
  var square62 = new square.Square(62, [53, 61, 71],     {x: 8, y: 6}, this.startPoints);

  this.board.push(square54, square55, square56, square57, square58, square59, square60, square61, square62);

  var square63 = new square.Square(63, [54, 64, 72],     {x: 0, y: 7}, this.startPoints);
  var square64 = new square.Square(64, [55, 65, 73, 63], {x: 1, y: 7}, this.startPoints);
  var square65 = new square.Square(65, [56, 66, 74, 64], {x: 2, y: 7}, this.startPoints);
  var square66 = new square.Square(66, [57, 67, 75, 65], {x: 3, y: 7}, this.startPoints);
  var square67 = new square.Square(67, [58, 68, 76, 66], {x: 4, y: 7}, this.startPoints);
  var square68 = new square.Square(68, [59, 69, 77, 67], {x: 5, y: 7}, this.startPoints);
  var square69 = new square.Square(69, [60, 70, 78, 68], {x: 6, y: 7}, this.startPoints);
  var square70 = new square.Square(70, [61, 71, 79, 69], {x: 7, y: 7}, this.startPoints);
  var square71 = new square.Square(71, [62, 70, 80],     {x: 8, y: 7}, this.startPoints);

  this.board.push(square63, square64, square65, square66, square67, square68, square69, square70, square71);

  var square72 = new square.Square(72, [63, 73],         {x: 0, y: 8}, this.startPoints);
  var square73 = new square.Square(73, [72, 64, 74],     {x: 1, y: 8}, this.startPoints);
  var square74 = new square.Square(74, [73, 65, 75],     {x: 2, y: 8}, this.startPoints);
  var square75 = new square.Square(75, [74, 66, 76],     {x: 3, y: 8}, this.startPoints);
  var square76 = new square.Square(76, [75, 67, 77],     {x: 4, y: 8}, this.startPoints);
  var square77 = new square.Square(77, [76, 68, 78],     {x: 5, y: 8}, this.startPoints);
  var square78 = new square.Square(78, [77, 69, 79],     {x: 6, y: 8}, this.startPoints);
  var square79 = new square.Square(79, [78, 70, 80],     {x: 7, y: 8}, this.startPoints);
  var square80 = new square.Square(80, [79, 71],         {x: 8, y: 8}, this.startPoints);

  this.board.push(square72, square73, square74, square75, square76, square77, square78, square79, square80);



  this.board.push(square0, square1, square2, square3, square4, square5, square6, square7, square8);

  Board.prototype.getSquare = function(id) {
    for(var i = 0; i < this.board.length; i++){
      if(this.board[i].id === id){
        return this.board[i];
      }
    }
    return null;
  };

}

exports.Board = Board;
