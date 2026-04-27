const TILE_TYPES = [
    "wood","wood","wood","wood",
    "brick","brick","brick",
    "sheep","sheep","sheep","sheep",
    "wheat","wheat","wheat","wheat",
    "ore","ore","ore",
    "desert"
];

const NUMBERS = [
    5, 2, 6, 3, 8, 10, 9, 12, 11,
    4, 8, 10, 9, 4, 5, 6, 3, 11
];

const PORTS = [
    "3:1","3:1","3:1","3:1",
    "wood","brick","sheep","wheat","ore"
];

// ===============================
// HELPERS
// ===============================

function shuffle(arr) {
    const a = [...arr];

    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }

    return a;
}

// ===============================
// BOARD
// ===============================

function createRandomBoard() {
    const tiles = shuffle(TILE_TYPES);
    const numbers = shuffle(NUMBERS);

    let numIndex = 0;

    return tiles.map(type => {
        if (type === "desert") {
            return {
                type,
                number: null,
                robber: true
            };
        }

        return {
            type,
            number: numbers[numIndex++],
            robber: false
        };
    });
}

// ===============================
// PORTS
// ===============================

function createPorts() {
    const types = shuffle(PORTS);

    return types.map((type, i) => ({
        side: i,
        type
    }));
}

// ===============================
// MANUAL EDITING
// ===============================

function cycleTile(board, index) {
    const order = [
        "wood","brick","sheep",
        "wheat","ore","desert"
    ];

    const current = board[index].type;
    const next = order[(order.indexOf(current) + 1) % order.length];

    board[index].type = next;

    if (next === "desert") {
        board[index].number = null;
        board[index].robber = true;
    } else {
        board[index].robber = false;
        if (!board[index].number) board[index].number = 2;
    }

    return board;
}

function setNumber(board, index, number) {
    if (board[index].type === "desert") return board;

    board[index].number = number;
    return board;
}

function setPort(ports, side, type) {
    const existing = ports.find(p => p.side === side);

    if (existing) {
        existing.type = type;
    } else {
        ports.push({ side, type });
    }

    return ports;
}

// ===============================
// VALIDATION
// ===============================

function validateBoard(board) {
    if (!board || board.length !== 19) {
        return { ok: false, error: "Board must have 19 tiles." };
    }

    const deserts = board.filter(t => t.type === "desert").length;

    if (deserts !== 1) {
        return { ok: false, error: "Need exactly 1 desert." };
    }

    for (const tile of board) {
        if (tile.type !== "desert" && !tile.number) {
            return { ok: false, error: "All resource tiles need numbers." };
        }
    }

    return { ok: true };
}

// ===============================

module.exports = {
    createRandomBoard,
    createPorts,
    cycleTile,
    setNumber,
    setPort,
    validateBoard
};
