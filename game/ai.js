// game/AI.js

class AIPlayer {
    constructor(player) {
        this.player = player;
    }

    takeTurn(game) {
        // Placeholder AI
        // Doesn't build, trade, or move.
        // Just ends its turn.

        return {
            action: "endTurn"
        };
    }
}

module.exports = AIPlayer;