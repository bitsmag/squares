"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlayerPoints = getPlayerPoints;
const socketErrorHandler_1 = __importDefault(require("../../middleware/socketErrorHandler"));
function getPlayerPoints(match) {
    const playerPoints = { blue: [], orange: [], green: [], red: [] };
    for (let i = 0; i < match.getPlayers().length; i++) {
        let playerPositionSquare;
        let error = false;
        try {
            playerPositionSquare = match.getBoard().getSquare(match.getPlayers()[i].getPosition());
        }
        catch (err) {
            error = true;
            (0, socketErrorHandler_1.default)(match, err, 'circuitsCheck.getPlayerPoints()');
        }
        if (!error && playerPositionSquare) {
            const playerColor = match.getPlayers()[i].getColor();
            const squaresEarningPoints = getPoints(playerPositionSquare, playerColor, match);
            playerPoints[playerColor] = squaresEarningPoints;
        }
    }
    return playerPoints;
}
function getPoints(theSquare, theColor, match) {
    const stack = [];
    let justPopped;
    let prefDir = '';
    let squaresEarningPoints = [];
    function getVertices(s, c) {
        const vertices = [];
        vertices.move = function (old_index, new_index) {
            if (new_index >= this.length) {
                let k = new_index - this.length;
                while (k-- + 1) {
                    this.push(undefined);
                }
            }
            this.splice(new_index, 0, this.splice(old_index, 1)[0]);
        };
        for (let i = 0; i < s.getEdgesTo().length; i++) {
            let edgeSquare;
            let error = false;
            try {
                edgeSquare = match.getBoard().getSquare(s.getEdgesTo()[i]);
            }
            catch (err) {
                error = true;
                (0, socketErrorHandler_1.default)(match, err, 'circuitsCheck.getVertices()');
            }
            if (!error && edgeSquare) {
                if (edgeSquare.getColor() === c && edgeSquare !== justPopped) {
                    vertices.push(edgeSquare);
                }
            }
        }
        for (let i = 0; i < vertices.length; i++) {
            if ((s.getPosition().x < vertices[i].getPosition().x && prefDir === 'right') ||
                (s.getPosition().x > vertices[i].getPosition().x && prefDir === 'left') ||
                (s.getPosition().y > vertices[i].getPosition().y && prefDir === 'down') ||
                (s.getPosition().y < vertices[i].getPosition().y && prefDir === 'up')) {
                vertices.move(i, 0);
            }
        }
        return vertices;
    }
    function setAllSquaresUnvisited() {
        for (let i = 0; i < match.getBoard().getSquares().length; i++) {
            match.getBoard().getSquares()[i].setDfsVisited(false);
        }
    }
    function setPrefDir(theSquareInner, nextSquare) {
        if (stack.length > 0) {
            if (theSquareInner.getPosition().x < nextSquare.getPosition().x) {
                prefDir = 'right';
            }
            else if (theSquareInner.getPosition().x > nextSquare.getPosition().x) {
                prefDir = 'left';
            }
            else if (theSquareInner.getPosition().y > nextSquare.getPosition().y) {
                prefDir = 'down';
            }
            else if (theSquareInner.getPosition().y < nextSquare.getPosition().y) {
                prefDir = 'up';
            }
        }
    }
    function checkValidity(stackInner, alreadyVisitedVertex) {
        const points = [];
        if (stackInner.length > 7) {
            const circuitArray = stackInner.slice(stackInner.indexOf(alreadyVisitedVertex), stackInner.length);
            for (let j = 0; j < 9; j++) {
                const squaresInSameRow = [];
                for (let k = 0; k < circuitArray.length; k++) {
                    if (circuitArray[k].getPosition().y == j) {
                        squaresInSameRow.push(circuitArray[k]);
                    }
                }
                squaresInSameRow.sort(function (a, b) {
                    return a.getPosition().x - b.getPosition().x;
                });
                for (let k = 1; k < squaresInSameRow.length; k++) {
                    const diff = squaresInSameRow[k].getPosition().x - squaresInSameRow[k - 1].getPosition().x;
                    if (diff != 1) {
                        for (let l = 1; l < diff; l++) {
                            points.push(match.getBoard().getSquareByCoordinates(squaresInSameRow[k].getPosition().x - l, j));
                        }
                    }
                }
            }
            if (points.length > 0) {
                for (const sq of circuitArray) {
                    points.push(sq);
                }
            }
        }
        return points.length > 0 ? points : [];
    }
    function dfs(theSquareInner, theColorInner) {
        if (theSquareInner || stack.length > 0) {
            if (theSquareInner) {
                stack.push(theSquareInner);
            }
            else {
                theSquareInner = stack[stack.length - 1];
            }
            theSquareInner.setDfsVisited(true);
            const vertices = getVertices(theSquareInner, theColorInner);
            for (let i = 0; i < vertices.length; i++) {
                if (squaresEarningPoints.length < 1) {
                    if (vertices[i].isDfsVisited() && vertices[i] !== stack[stack.length - 2]) {
                        squaresEarningPoints = checkValidity(stack, vertices[i]);
                        if (squaresEarningPoints.length === 0 && i === vertices.length - 1) {
                            stack.pop();
                            justPopped = theSquareInner;
                            setPrefDir(theSquareInner, stack[stack.length - 1]);
                            dfs(null, theColorInner);
                        }
                    }
                    else if (vertices[i].isDfsVisited() && vertices[i] === stack[stack.length - 2]) {
                        if (i === vertices.length - 1) {
                            stack.pop();
                            justPopped = theSquareInner;
                            setPrefDir(theSquareInner, stack[stack.length - 1]);
                            dfs(null, theColorInner);
                        }
                    }
                    else if (!vertices[i].isDfsVisited()) {
                        justPopped = null;
                        setPrefDir(theSquareInner, vertices[i]);
                        dfs(vertices[i], theColorInner);
                    }
                }
            }
        }
    }
    dfs(theSquare, theColor);
    setAllSquaresUnvisited();
    return squaresEarningPoints;
}
// CommonJS compatibility
module.exports = { getPlayerPoints };
