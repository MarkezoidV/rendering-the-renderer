// game/board.js
// Final polished Catan board system
const { shuffle } = require("../utils/helpers");
const RESOURCE_COUNTS = {
  wood: 4,
  brick: 3,
  sheep: 4,
  wheat: 4,
  ore: 3,
  desert: 1
};

const NUMBER_COUNTS = {
  2: 1,
  3: 2,
  4: 2,
  5: 2,
  6: 2,
  8: 2,
  9: 2,
  10: 2,
  11: 2,
  12: 1
};

const PORT_COUNTS = [
  "3:1","3:1","3:1","3:1",
  "wood","brick","sheep","wheat","ore"
];

// 19 board hexes
const POSITIONS = [
  { q:-2,r:0 }, { q:-2,r:1 }, { q:-2,r:2 },
  { q:-1,r:-1 },{ q:-1,r:0 }, { q:-1,r:1 }, { q:-1,r:2 },
  { q:0,r:-2 }, { q:0,r:-1 }, { q:0,r:0 }, { q:0,r:1 }, { q:0,r:2 },
  { q:1,r:-2 }, { q:1,r:-1 }, { q:1,r:0 }, { q:1,r:1 },
  { q:2,r:-2 }, { q:2,r:-1 }, { q:2,r:0 }
];
const TILE_COUNT = POSITIONS.length;


const DIRECTIONS = [
    [1,0],[1,-1],[0,-1],
    [-1,0],[-1,1],[0,1]
];

function adjacent(a, b) {
  return DIRECTIONS.some(([dq, dr]) =>
    a.q + dq === b.q && a.r + dr === b.r
  );
}

function buildResourcePool() {
  const out = [];
  for (const key in RESOURCE_COUNTS) {
    for (let i = 0; i < RESOURCE_COUNTS[key]; i++) out.push(key);
  }
  return out;
}

function buildNumberPool() {
  const out = [];
  for (const key in NUMBER_COUNTS) {
    for (let i = 0; i < NUMBER_COUNTS[key]; i++) out.push(Number(key));
  }
  return out;
}

function createBlankBoard() {
  return POSITIONS.map(() => ({
    type: null,
    number: null,
    robber: false
  }));
}
function validatePorts(ports) {
    if (ports.length !== 9) return "Need 9 ports.";

    const seen = new Set();

    const count = {
        "3:1":0,
        wood:0,
        brick:0,
        sheep:0,
        wheat:0,
        ore:0
    };

    for (const p of ports) {
        const key = `${p.q},${p.r},${p.side}`;

        if (seen.has(key)) return "Duplicate port position.";
        seen.add(key);

        if (!(p.type in count)) return "Invalid port type.";

        count[p.type]++;
    }

    if (count["3:1"] !== 4) return "Need 4x 3:1";
    if (count.wood !== 1) return "Need wood port";
    if (count.brick !== 1) return "Need brick port";
    if (count.sheep !== 1) return "Need sheep port";
    if (count.wheat !== 1) return "Need wheat port";
    if (count.ore !== 1) return "Need ore port";

    return null;
}
// ================================
// RANDOM LEGAL BOARD
// ================================
function createRandomPorts() {
    const spots = [
    { q:-2, r:1, side:3 },
    { q:-2, r:2, side:4 },

    { q:-1, r:-1, side:2 },
    { q:0, r:-2, side:2 },
    { q:1, r:-2, side:1 },

    { q:2, r:-2, side:1 },
    { q:2, r:-1, side:0 },
    { q:1, r:1, side:5 },

    { q:-1, r:2, side:4 }
];


    const types = shuffle([...PORT_COUNTS]);

    return spots.map((spot, i) => ({
        ...spot,
        type: types[i]
    }));
}

function createRandomBoard() {
  for (let tries = 0; tries < 1000; tries++) {
    const board = createBlankBoard();

    const resources = shuffle(buildResourcePool());
    for (let i = 0; i < TILE_COUNT; i++) {
      board[i].type = resources[i];
      board[i].robber = resources[i] === "desert";
    }

    const numbers = shuffle(buildNumberPool());

    let failed = false;

    for (let i = 0; i < TILE_COUNT; i++) {
      if (board[i].type === "desert") continue;

      let placed = false;

      for (let n = 0; n < numbers.length; n++) {
        const candidate = numbers[n];

        board[i].number = candidate;

        if (!touchingHot(board, i)) {
          numbers.splice(n, 1);
          placed = true;
          break;
        }
      }

      if (!placed) {
        failed = true;
        break;
      }
    }

    if (!failed && validateBoard(board).ok) {
      return board;
    }
  }

  throw new Error("Failed to generate legal board.");
}

// ================================
// HOT NUMBER CHECK
// ================================

function touchingHot(board, index) {
  const num = board[index].number;
  if (num !== 6 && num !== 8) return false;

  for (let i = 0; i < TILE_COUNT; i++) {
    if (i === index) continue;

    const other = board[i].number;
    if (other !== 6 && other !== 8) continue;

    if (adjacent(POSITIONS[index], POSITIONS[i])) {
      return true;
    }
  }

  return false;
}

// ================================
// EDITING
// ================================

function cycleTile(board, index) {
  const order = ["wood","brick","sheep","wheat","ore","desert"];

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

function setPort(ports, q, r, side, type) {
    const index = ports.findIndex(p =>
        p.q === q &&
        p.r === r &&
        p.side === side
    );

    if (!type) {
        if (index !== -1) ports.splice(index, 1);
        return ports;
    }

    if (index !== -1) {
        ports[index].type = type;
    } else {
        ports.push({ q, r, side, type });
    }

    return ports;
}

// ================================
// VALIDATION
// ================================

function validateBoard(board) {
  if (!board || board.length !== TILE_COUNT) {
    return { ok:false, error:"Board must contain 19 tiles." };
  }

  const resource = {
    wood:0, brick:0, sheep:0,
    wheat:0, ore:0, desert:0
  };

  const nums = {};

  for (let i = 0; i < board.length; i++) {
    const tile = board[i];

    if (!Object.prototype.hasOwnProperty.call(resource, tile.type)) {
      return { ok:false, error:"Invalid resource type." };
    }

    resource[tile.type]++;

    if (tile.type === "desert") {
      if (tile.number !== null) {
        return { ok:false, error:"Desert cannot have number." };
      }
      continue;
    }

    if (tile.number == null) {
      return { ok:false, error:"All resource tiles need numbers." };
    }

    nums[tile.number] = (nums[tile.number] || 0) + 1;
  }

  for (const key in RESOURCE_COUNTS) {
    if (resource[key] !== RESOURCE_COUNTS[key]) {
      return {
        ok:false,
        error:`Wrong ${key} count. Need ${RESOURCE_COUNTS[key]}.`
      };
    }
  }

  for (const key in NUMBER_COUNTS) {
    const actual = nums[key] || 0;
    const needed = NUMBER_COUNTS[key];

    if (actual !== needed) {
      return {
        ok:false,
        error:`Wrong amount of ${key}s. Need ${needed}.`
      };
    }
  }

  for (let i = 0; i < board.length; i++) {
    if (touchingHot(board, i)) {
      return {
        ok:false,
        error:"6s and 8s cannot touch."
      };
    }
  }

  return { ok:true };
}
module.exports = {
    RESOURCE_COUNTS,
    NUMBER_COUNTS,
    PORT_COUNTS,
    POSITIONS,

    createRandomBoard,
    createRandomPorts,
    createBlankBoard,

    adjacent,
    buildResourcePool,
    buildNumberPool,
    touchingHot,

    cycleTile,
    setNumber,
    setPort,

    validateBoard,
    validatePorts
};