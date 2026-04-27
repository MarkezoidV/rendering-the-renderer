// /game/AI.js

class AIPlayer {
    constructor(player) {
        this.player = player;
    }

    takeTurn(game) {
        const me = this.player;

        // simple starter AI:
        // 1. If enough resources, gain point
        if (
            me.resources.wood >= 1 &&
            me.resources.brick >= 1 &&
            me.resources.sheep >= 1 &&
            me.resources.wheat >= 1
        ) {
            me.resources.wood--;
            me.resources.brick--;
            me.resources.sheep--;
            me.resources.wheat--;

            me.points++;
            return `${me.name} built a settlement`;
        }

        // otherwise collect random resource
        const types = ["wood", "brick", "sheep", "wheat", "ore"];
        const pick = types[Math.floor(Math.random() * types.length)];
        me.resources[pick]++;

        return `${me.name} collected ${pick}`;
    }
}

module.exports = AIPlayer;
