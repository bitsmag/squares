"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Square = void 0;
class Square {
    constructor(squareId, edgesTo, position) {
        this.id = squareId;
        this.edgesTo = edgesTo;
        this.position = position;
        this.color = '';
        this.doubleSpeedSpecial = false;
        this.getPointsSpecial = false;
        this.dfsVisited = false;
    }
    getId() {
        return this.id;
    }
    getEdgesTo() {
        return this.edgesTo;
    }
    getPosition() {
        return this.position;
    }
    getColor() {
        return this.color;
    }
    getDoubleSpeedSpecial() {
        return this.doubleSpeedSpecial;
    }
    getGetPointsSpecial() {
        return this.getPointsSpecial;
    }
    isDfsVisited() {
        return this.dfsVisited;
    }
    setColor(color) {
        this.color = color;
    }
    setDoubleSpeedSpecial(doubleSpeedSpecial) {
        this.doubleSpeedSpecial = doubleSpeedSpecial;
    }
    setGetPointsSpecial(getPointsSpecial) {
        this.getPointsSpecial = getPointsSpecial;
    }
    setDfsVisited(visited) {
        this.dfsVisited = visited;
    }
}
exports.Square = Square;
// CommonJS compatibility
module.exports = { Square };
