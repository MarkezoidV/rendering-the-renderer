// /utils/helpers.js

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
}

function generateRoomCode(length = 4) {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let code = "";

    for (let i = 0; i < length; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }

    return code;
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function removeFromArray(array, callback) {
    const index = array.findIndex(callback);

    if (index !== -1) {
        array.splice(index, 1);
    }
}

function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

module.exports = {
    shuffle,
    generateRoomCode,
    clamp,
    removeFromArray,
    deepCopy
};
