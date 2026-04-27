// /game/Board.js

class Board {
    constructor() {
        this.tiles = [];
        this.ports = [];
        this.robberIndex = 0;

        this.generateRandom();
    }

    generateRandom() {
        const resourcePool = [
            "wood","wood","wood","wood",
            "brick","brick","brick",
            "sheep","sheep","sheep","sheep",
            "wheat","wheat","wheat","wheat",
            "ore","ore","ore",
            "desert"
        ];

        const numberPool = [
            2, 3, 3, 4, 4, 5, 5,
            6, 6, 8, 8,
            9, 9, 10, 10,
            11, 11, 12
        ];

        this.shuffle(resourcePool);
        this.shuffle(numberPool);

        this.tiles = [];
        let numberIndex = 0;

        for (let i = 0; i < 19; i++) {
            const type = resourcePool[i];

            let number = null;

            if (type !== "desert") {
                number = numberPool[numberIndex];
                numberIndex++;
            } else {
                this.robberIndex = i;
            }

            this.tiles.push({
                type,
                number
            });
        }

        this.generateDefaultPorts();
    }

    generateDefaultPorts() {
        this.ports = [
            { type: "3:1" },
            { type: "3:1" },
            { type: "3:1" },
            { type: "3:1" },
            { type: "wood" },
            { type: "brick" },
            { type: "sheep" },
            { type: "wheat" },
            { type: "ore" }
        ];
    }

    setTile(index, type) {
        if (!this.tiles[index]) return;

        this.tiles[index].type = type;

        if (type === "desert") {
            this.tiles[index].number = null;
            this.robberIndex = index;
        }
    }

    setNumber(index, number) {
        if (!this.tiles[index]) return;
        if (this.tiles[index].type === "desert") return;

        this.tiles[index].number = number;
    }

    moveRobber(index) {
        if (this.tiles[index]) {
            this.robberIndex = index;
        }
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}

module.exports = Board;
