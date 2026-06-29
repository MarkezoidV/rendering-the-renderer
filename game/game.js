const Player = require("./player");
const { shuffle, rollDice } = require("../utils/helpers");
class GameRoom {
    constructor(code) {
        this.code = code;

        this.hostId = null;
        this.public = false;
        this.started = false;

        this.players = [];
        this.turn = 0;

        this.board = [];
        this.ports = [];
this.settlements = [];
this.roads = [];
        this.settings = {
            boardMode: "random",
            turnMode: "random",
            victoryPoints: 10
        };
        this.phase = "setup"; // setup -> play -> gameover
this.setupRound = 1;
this.setupDirection = 1;
    }

    // =========================
    // PLAYERS
    // =========================


addPlayer(id, name, isAI = false) {
    const player = new Player(id, name, isAI);

    if (isAI) player.ready = true;

    this.players.push(player);

    if (!this.hostId && !isAI) {
        this.hostId = id;
    }
}

    removePlayer(id) {
        this.players = this.players.filter(p => p.id !== id);

        if (this.hostId === id) {
            this.assignHost();
        }
    }

    assignHost() {
        const human = this.players.find(p => !p.isAI);
        this.hostId = human ? human.id : null;
    }

    toggleReady(id) {
        const player = this.players.find(p => p.id === id);
        if (!player || player.isAI) return;

        player.toggleReady();
    }

    addAI() {
        const count = this.players.filter(p => p.isAI).length + 1;

        this.addPlayer(
            "ai_" + Date.now(),
            "AI Bot " + count,
            true
        );
    }

    kickPlayer(id) {
        this.removePlayer(id);
    }

    // =========================
    // GAME STATE
    // =========================

canStart() {
    const humans = this.players.filter(p => !p.isAI);

    return this.players.length >= 2 &&
           humans.every(p => p.ready);
}
start() {
    this.started = true;

    this.phase = "setup";
    this.setupRound = 1;
    this.setupDirection = 1;

    this.turn = 0;

    if (this.settings.turnMode === "random") {
        this.shufflePlayers();
    }

    return this.startTurn();
}
startTurn() {
    this.lastRoll = rollDice();
    return this.lastRoll;
}
reset() {
    this.started = false;
    this.turn = 0;

    this.phase = "setup";
    this.setupRound = 1;
    this.setupDirection = 1;

    this.settlements = [];
    this.roads = [];
    this.lastRoll = null;

    this.players.forEach(p => {
        p.reset();

        if (p.isAI) {
            p.toggleReady();
        }
    });
}
getPlayer(id) {
    return this.players.find(p => p.id === id);
}
    nextTurn() {
    if (!this.players.length) return;
    this.turn = (this.turn + 1) % this.players.length;
}

    currentPlayer() {
    if (this.players.length === 0) return null;
    return this.players[this.turn];
}


getSettlement(q, r, corner) {
    return this.settlements.find(s =>
        s.q === q &&
        s.r === r &&
        s.corner === corner
    );
}

getRoad(q, r, side) {
    return this.roads.find(rd =>
        rd.q === q &&
        rd.r === r &&
        rd.side === side
    );
}



shufflePlayers() {
    this.players = shuffle(this.players);
}

    // =========================
    // SETTINGS
    // =========================

    setBoardMode(mode) {
        this.settings.boardMode = mode;
    }

    setTurnMode(mode) {
        this.settings.turnMode = mode;
    }

    setVictoryPoints(points) {
        this.settings.victoryPoints = points;
    }

    togglePublic() {
        this.public = !this.public;
    }

    // =========================
    // CLEANUP
    // =========================

    hasHumans() {
        return this.players.some(p => !p.isAI);
    }

    isFull() {
        return this.players.length >= 4;
    }
placeSettlement(playerId, q, r, corner) {
    const player = this.getPlayer(playerId);
    if (!player) return false;

    if (this.getSettlement(q, r, corner))
        return false;

    // more validation goes here

    const settlement = {
        playerId,
        q,
        r,
        corner,
        city: false
    };

    this.settlements.push(settlement);
    player.addSettlement(settlement);

    return true;
}

placeRoad(playerId, q, r, side) {
    const player = this.getPlayer(playerId);
    if (!player) return false;

    if (this.getRoad(q, r, side))
        return false;

    // more validation goes here

    const road = {
        playerId,
        q,
        r,
        side
    };

    this.roads.push(road);
    player.addRoad(road);

    return true;
}
}

module.exports = GameRoom;
