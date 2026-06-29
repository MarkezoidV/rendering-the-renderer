// /utils/helpers.js

// =====================
// RANDOM / ARRAY
// =====================

function shuffle(array) {
    const arr = [...array]; // avoid mutating original

    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr;
}

// =====================
// ROOM
// =====================

function generateRoomCode(length = 4) {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let code = "";

    for (let i = 0; i < length; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }

    return code;
}

// =====================
// MATH
// =====================

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// =====================
// ARRAY UTILS
// =====================

function removeFromArray(array, predicate) {
    const index = array.findIndex(predicate);
    return index === -1 ? null : array.splice(index, 1)[0];
}
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// =====================
// OBJECT UTILS
// =====================

function deepCopy(obj) {
    return structuredClone(obj); // modern + safer
}

// =====================
// GAME UTILS (add this 🔥)
// =====================

function rollDice() {
    const die1 = randomInt(1, 6);
const die2 = randomInt(1, 6);

    return {
        die1,
        die2,
        total: die1 + die2
    };
}

module.exports = {
    shuffle,
    generateRoomCode,
    clamp,
    removeFromArray,
    deepCopy,
    rollDice
};