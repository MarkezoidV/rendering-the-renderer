// game/geometry.js

// Coordinates are relative to the center of a hex.
// Corner and side indices increase clockwise starting at the top.
const CORNERS = Object.freeze([
    { x: 0, y: -1 },
    { x: 1, y: -0.5 },
    { x: 1, y: 0.5 },
    { x: 0, y: 1 },
    { x: -1, y: 0.5 },
    { x: -1, y: -0.5 }
]);

const SIDES = Object.freeze([
    { x: 0, y: -0.75 },
    { x: 0.75, y: -0.375 },
    { x: 0.75, y: 0.375 },
    { x: 0, y: 0.75 },
    { x: -0.75, y: 0.375 },
    { x: -0.75, y: -0.375 }
]);

function getCorner(index) {
    return CORNERS[index % 6];
}

function getSide(index) {
    return SIDES[index % 6];
}

module.exports = {
    CORNERS,
    SIDES,
    getCorner,
    getSide
};