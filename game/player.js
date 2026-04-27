// /game/Player.js

class Player {
    constructor(id, name, isAI = false) {
        this.id = id;
        this.name = name;
        this.isAI = isAI;

        this.ready = false;
        this.points = 0;

        this.resources = {
            wood: 0,
            brick: 0,
            sheep: 0,
            wheat: 0,
            ore: 0
        };

        this.roads = [];
        this.settlements = [];
        this.cities = [];
    }

    toggleReady() {
        this.ready = !this.ready;
    }

    addPoints(amount = 1) {
        this.points += amount;
    }

    giveResource(type, amount = 1) {
        if (this.resources[type] !== undefined) {
            this.resources[type] += amount;
        }
    }

    spendResource(type, amount = 1) {
        if (this.resources[type] >= amount) {
            this.resources[type] -= amount;
            return true;
        }
        return false;
    }
}

module.exports = Player;
