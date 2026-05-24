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

    // =====================
    // STATE
    // =====================

    toggleReady() {
        this.ready = !this.ready;
    }

    reset() {
        this.ready = false;
        this.points = 0;

        for (const key in this.resources) {
            this.resources[key] = 0;
        }

        this.roads = [];
        this.settlements = [];
        this.cities = [];
    }

    // =====================
    // BUILDING
    // =====================

    addSettlement(spot) {
        this.settlements.push(spot);
        this.addPoints(1);
    }

    addCity(spot) {
        // remove settlement if upgrading
        this.settlements = this.settlements.filter(s => s !== spot);

        this.cities.push(spot);
        this.addPoints(1); // +1 extra (total 2)
    }

    addRoad(edge) {
        this.roads.push(edge);
    }

    // =====================
    // RESOURCES
    // =====================

    giveResource(type, amount = 1) {
        if (!(type in this.resources)) return;
        this.resources[type] += amount;
    }

    getResource(type) {
        return this.resources[type] || 0;
    }

    canAfford(cost) {
        return Object.entries(cost).every(
            ([type, amount]) => this.resources[type] >= amount
        );
    }

    spend(cost) {
        if (!this.canAfford(cost)) return false;

        for (const [type, amount] of Object.entries(cost)) {
            this.resources[type] -= amount;
        }

        return true;
    }

    // =====================
    // POINTS
    // =====================

    addPoints(amount = 1) {
        this.points += amount;
    }
}

module.exports = Player;