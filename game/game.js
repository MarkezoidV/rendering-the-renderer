// /game/Game.js

const Player = require("./Player");
const Board = require("./Board");
const AIPlayer = require("./AI");

class Game {
    constructor(roomCode) {
        this.roomCode = roomCode;
        this.players = [];
        this.board = new Board();

        this.hostId = null;
        this.turnIndex = 0;

        this.started = false;
        this.maxPlayers = 4;

        this.settings = {
            boardMode: "random",
            turnMode: "join",
            victoryPoints: 10,
            isPublic: false
        };
    }

    // ===============================
    // Player Management
    // ===============================

    addAI() {
      if (this.players.length >= this.maxPlayers) return false;

      const botNumber =
          this.players.filter(p => p.isAI).length + 1;

      const name = `AI ${botNumber}`;

      this.addPlayer(
          "ai_" + Date.now() + "_" + Math.random(),
          name,
          true
      );

      return true;
    }

    addPlayer(id, name, isAI = false) {
        if (this.players.length >= this.maxPlayers) {
            return false;
        }

        const uniqueName = this.getUniqueName(name);

        const player = new Player(id, uniqueName, isAI);
        this.players.push(player);

        if (!this.hostId) {
            this.hostId = id;
        }

        return true;
    }

    removePlayer(id) {
        this.players = this.players.filter(p => p.id !== id);

        if (this.hostId === id) {
            this.hostId = this.players[0]?.id || null;
        }

        if (this.turnIndex >= this.players.length) {
            this.turnIndex = 0;
        }
    }

    kickPlayer(id) {
        this.removePlayer(id);
    }

    getPlayer(id) {
        return this.players.find(p => p.id === id);
    }

    toggleReady(id) {
        const player = this.getPlayer(id);
        if (player) player.toggleReady();
    }

    allReady() {
        if (this.players.length < 2) return false;
        return this.players.every(p => p.ready);
    }

    // ===============================
    // Turn Logic
    // ===============================

    nextTurn() {
        if (this.players.length === 0) return;

        this.turnIndex++;
        if (this.turnIndex >= this.players.length) {
            this.turnIndex = 0;
        }
    }

    getCurrentPlayer() {
        return this.players[this.turnIndex];
    }

    // ===============================
    // Game Start
    // ===============================

    startGame() {
        if (!this.allReady()) return false;

        this.started = true;
        this.turnIndex = 0;

        if (this.settings.boardMode === "random") {
            this.board.generateRandom();
        }

        if (this.settings.turnMode === "random") {
            this.shufflePlayers();
        }

        return true;
    }

    // ===============================
    // Settings
    // ===============================

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
        this.settings.isPublic = !this.settings.isPublic;
    }

    // ===============================
    // Helpers
    // ===============================

    shufflePlayers() {
        for (let i = this.players.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.players[i], this.players[j]] =
            [this.players[j], this.players[i]];
        }
    }

    getUniqueName(baseName) {
        let name = baseName || "Player";
        let count = 2;

        while (this.players.some(p => p.name === name)) {
            name = `${baseName}${count}`;
            count++;
        }

        return name;
    }

    // ===============================
    // Client Data
    // ===============================

    getPlayerList() {
        return this.players.map(p => ({
            id: p.id,
            name: p.name,
            ready: p.ready,
            isAI: p.isAI
        }));
    }

    getPublicRoomData() {
        return {
            code: this.roomCode,
            players: this.players.length,
            max: this.maxPlayers
        };
    }
}

module.exports = Game;
