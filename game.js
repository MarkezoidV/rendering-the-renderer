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

        this.settings = {
            boardMode: "random",
            turnMode: "join",
            victoryPoints: 10
        };
    }

    // =========================
    // PLAYERS
    // =========================

    addPlayer(id, name, ai = false) {
        this.players.push({
            id,
            name,
            ai,
            ready: ai
        });

        if (!this.hostId && !ai) {
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
        const human = this.players.find(p => !p.ai);
        this.hostId = human ? human.id : null;
    }

    toggleReady(id) {
        const player = this.players.find(p => p.id === id);
        if (!player || player.ai) return;

        player.ready = !player.ready;
    }

    addAI() {
        const count = this.players.filter(p => p.ai).length + 1;

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
        return this.players.filter(p => p.ready).length >= 2;
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
            p.ready = p.ai;
        });
    }

    nextTurn() {
        this.turn++;

        if (this.turn >= this.players.length) {
            this.turn = 0;
        }
    }

    currentPlayer() {
        return this.players[this.turn];
    }

    shufflePlayers() {
        for (let i = this.players.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.players[i], this.players[j]] =
                [this.players[j], this.players[i]];
        }
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
        return this.players.some(p => !p.ai);
    }

    isFull() {
        return this.players.length >= 4;
    }
}

module.exports = GameRoom;
