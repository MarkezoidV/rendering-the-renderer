const Player = require("./player");
const { shuffle } = require("../utils/helpers");
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
    }

    // =========================
    // PLAYERS
    // =========================

   
startTurn() {
    const { rollDice } = require("../utils/helpers");

    const roll = rollDice();
    this.lastRoll = roll;

    return roll;
}
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

        player.ready = !player.ready;
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
    return humans.length >= 2 &&
           humans.every(p => p.ready);
}

    start() {
        this.started = true;
        this.turn = 0;

        if (this.settings.turnMode === "random") {
            this.shufflePlayers();
        }
    }

    reset() {
        this.started = false;
        this.turn = 0;

        this.players.forEach(p => {
    p.reset();
    if (p.isAI) p.ready = true;
});
    }
getPlayer(id) {
    return this.players.find(p => p.id === id);
}
    nextTurn() {
        this.turn = (this.turn + 1) % this.players.length;
    }

    currentPlayer() {
        return this.players[this.turn];
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
}

module.exports = GameRoom;
