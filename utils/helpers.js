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
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
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

function removeFromArray(array, callback) {
    const index = array.findIndex(callback);
    if (index !== -1) {
        return array.splice(index, 1)[0]; // return removed item
    }
    return null;
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
    return Math.floor(Math.random() * 6 + 1) +
           Math.floor(Math.random() * 6 + 1);
}

module.exports = {
    shuffle,
    generateRoomCode,
    clamp,
    removeFromArray,
    deepCopy,
    rollDice
};