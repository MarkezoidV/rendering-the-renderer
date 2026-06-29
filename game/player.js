class Player {
    constructor(id, name, isAI = false) {
        this.id = id;
        this.name = name;
        this.isAI = isAI;

        this.ready = false;
        

        this.resources = {
            wood: 0,
            brick: 0,
            sheep: 0,
            wheat: 0,
            ore: 0
        };
        this.devCards = [];
this.knightsPlayed = 0;
this.longestRoad = false;
this.largestArmy = false;
this.color = null;
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
hasResources(cost) {
    return this.canAfford(cost);
}
getPoints() {
    return (
        this.settlements.length +
        this.cities.length * 2
    );
}
removeResource(type, amount = 1) {
    if (!(type in this.resources)) return;
    this.resources[type] = Math.max(0, this.resources[type] - amount);
}
    reset() {
        this.ready = false;
        

        this.resources = {
    wood: 0,
    brick: 0,
    sheep: 0,
    wheat: 0,
    ore: 0
};

        this.roads = {
    q,
    r,
    side
};
        this.settlements = {
    q,
    r,
    corner
};
        this.cities = [];
        this.devCards = [];
this.longestRoad = false;
this.largestArmy = false;
this.knightsPlayed = 0;
this.color = null;
    }

    // =====================
    // BUILDING
    // =====================

    addSettlement(spot) {
        this.settlements.push(spot);
        
    }

    addCity(spot) {
        // remove settlement if upgrading
        this.settlements = this.settlements.filter(s => s !== spot);

        this.cities.push(spot);
        
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
getPoints() {
    let points = 0;

    points += this.settlements.length;
    points += this.cities.length * 2;

    if (this.longestRoad) points += 2;
    if (this.largestArmy) points += 2;

    return points;
}
}

module.exports = Player;