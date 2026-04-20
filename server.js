const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
let editMode = "type"; // "type" | "number"

let rooms = {};
const MAX_PLAYERS = 4;
function getUniqueName(baseName, players) {
    let count = 1;
    let newName = baseName;

    while (players.some(p => p.name === newName)) {
        count++;
        newName = baseName + count;
    }

    return newName;
}
function generateBoard() {
    const types = ["wood", "brick", "sheep", "wheat", "ore","desert"];

    return Array.from({ length: 19 }, () => ({
    type: types[Math.floor(Math.random() * types.length)],
    number: null
}));

}

function getPublicRooms() {
    const list = [];

    for (const code in rooms) {
        const game = rooms[code];

        if (!game.isPublic) continue; // 👈 hide private rooms

        list.push({
            code: code,
            players: game.players.length,
            max: MAX_PLAYERS
        });
    }

    return list;
}

function getOuterEdges(hex, hexSet) {
    const edges = [];

    directions.forEach((dir, i) => {
        const neighbor = {
            q: hex.q + dir.q,
            r: hex.r + dir.r
        };

        const exists = hexSet.some(h => h.q === neighbor.q && h.r === neighbor.r);

        if (!exists) {
            edges.push({
                hex,
                side: i // 0–5 which edge
            });
        }
    });

    return edges;
}



io.on("connection", (socket) => {
    console.log("User connected");
    socket.on("togglePublic", () => {
    const room = socket.room;
    if (!room || !rooms[room]) return;

    const game = rooms[room];
    if (socket.id !== game.hostId) return;

    game.isPublic = !game.isPublic;

    io.to(room).emit("roomPrivacy", game.isPublic);
    io.emit("rooms", getPublicRooms());
});

socket.on("getRooms", () => {
    socket.emit("rooms", getPublicRooms());
});
    // =========================
    // JOIN
    // =========================
    socket.on("join", ({ name, room }) => {

        if (rooms[room] && rooms[room].players.length >= MAX_PLAYERS) {
            socket.emit("joinError", "Room is full");
            return;
        }

        if (!rooms[room]) {
    rooms[room] = {
        players: [],
        hostId: null,
        isPublic: true,
        started: false,

        turnIndex: 0,

        // 🔥 BOARD (tiles)
        board: null, 
        // each tile will be:
        // { type: "wood", number: 8 }

        // 🔥 PORTS (edges, not tiles)
        ports: [], 
        // each port:
        // { q: 2, r: -1, side: 0, type: "wood" }

        // 🔥 SETTINGS
        settings: {
            boardMode: "random",   // "random" | "manual"
            turnMode: "join",      // "join" | "random"
            victoryPoints: 10
        }
    };
}


        const game = rooms[room]; // ✅ NOW it's safe

        socket.room = room;

        name = name && name.trim() ? name : "Player";
        name = getUniqueName(name, game.players);

        if (!game.hostId) game.hostId = socket.id;

        game.players.push({
            id: socket.id,
            name: name,
            ready: false
        });

        socket.join(room);

        // ✅ NOW this works
        socket.emit("roomPrivacy", game.isPublic);
        socket.emit("settingsUpdate", game.settings);
        io.to(room).emit("players", game.players);
        io.to(room).emit("host", game.hostId);
        io.emit("rooms", getPublicRooms());
    });

    socket.on("setBoardMode", (mode) => {
    

    const room = socket.room;
    if (!room || !rooms[room]) return;

    const game = rooms[room];
if (game.started) return;
    if (socket.id !== game.hostId) return;

    game.settings.boardMode = mode;
if (mode === "manual" && !game.board) {
    game.board = Array.from({ length: 19 }, () => ({
    type: null,
    number: null
}));

}

io.to(room).emit("settingsUpdate", game.settings);
// 🔥 THIS is the important part
if (mode === "manual") {
    io.to(room).emit("boardUpdate", game.board);
}
io.emit("rooms", getPublicRooms());

    
});
socket.on("setPort", ({ q, r, side, type }) => {
    const room = socket.room;
    if (!room || !rooms[room]) return;

    const game = rooms[room];
    if (socket.id !== game.hostId) return;

    // prevent duplicates
    const exists = game.ports.some(p =>
        p.q === q && p.r === r && p.side === side
    );

    if (exists) return;

    game.ports.push({ q, r, side, type });

    io.to(room).emit("portsUpdate", game.ports);
});

socket.on("nextTurn", () => {
    const room = socket.room;
    if (!room || !rooms[room]) return;

    const game = rooms[room];

    // ✅ ONLY CURRENT PLAYER can end turn
    if (socket.id !== game.players[game.turnIndex].id) return;

    game.turnIndex = (game.turnIndex + 1) % game.players.length;

    io.to(room).emit("turnUpdate", game.turnIndex);
});


socket.on("kickPlayer", (playerId) => {
    const room = socket.room;
    if (!room || !rooms[room]) return;

    const game = rooms[room];
    if (socket.id !== game.hostId) return;

    const target = io.sockets.sockets.get(playerId);

    if (target) {
        target.leave(room);
        target.room = null;
        target.emit("joinError", "You were kicked");
    }

    game.players = game.players.filter(p => p.id !== playerId);

    io.to(room).emit("players", game.players);
    io.emit("rooms", getPublicRooms());
});

socket.on("leaveRoom", () => {
    const room = socket.room;
    if (!room || !rooms[room]) return;

    const game = rooms[room];

    game.players = game.players.filter(p => p.id !== socket.id);

    if (socket.id === game.hostId) {
        game.hostId = game.players.length ? game.players[0].id : null;
        io.to(room).emit("hostChanged", game.hostId);
    }

    socket.leave(room);
    socket.room = null;

    io.to(room).emit("players", game.players);
    io.emit("rooms", getPublicRooms());

    if (game.players.length === 0) {
        delete rooms[room];
    }
});

socket.on("updateTile", ({ index, type }) => {
    const room = socket.room;
    if (!room || !rooms[room]) return;

    const game = rooms[room];

    if (socket.id !== game.hostId) return;
    if (game.settings.boardMode !== "manual") return;

    if (!game.board) {
       game.board = Array.from({ length: 19 }, () => ({
    type: null,
    number: null
}));


    }

    game.board[index] = {
        ...game.board[index],
        type
    };

    io.to(room).emit("boardUpdate", game.board);
});
socket.on("requestBoard", () => {
    const room = socket.room;
    if (!room || !rooms[room]) return;

    const game = rooms[room];
    if (game.board) {
        socket.emit("boardUpdate", game.board);
    }
});

socket.on("setTurnMode", (mode) => {
  
    const room = socket.room;
    if (!room || !rooms[room]) return;

    const game = rooms[room];
    if (socket.id !== game.hostId) return;
    if (game.started) return;

    game.settings.turnMode = mode;

    io.to(room).emit("settingsUpdate", game.settings);
    io.emit("rooms", getPublicRooms());

});

    socket.on("addAI", () => {
    const room = socket.room;
    if (!room || !rooms[room]) return;

    const game = rooms[room];

    // only host can add AI
    if (socket.id !== game.hostId) return;

    if (game.players.length >= MAX_PLAYERS) return;

    const aiName = getUniqueName("AI", game.players);


    game.players.push({
        id: "ai_" + Math.random(),
        name: aiName,
        ready: true // AI is always ready
    });

    io.to(room).emit("players", game.players);
    io.emit("rooms", getPublicRooms());

});


    // =========================
    // READY
    // =========================
    socket.on("toggleReady", () => {
        const room = socket.room;
        if (!room || !rooms[room]) return;

        const game = rooms[room];
        const player = game.players.find(p => p.id === socket.id);

        if (player) {
            player.ready = !player.ready;
            io.to(room).emit("players", game.players);
        }
    });

    // =========================
    // START GAME
    // =========================
    socket.on("startGame", () => {
    const room = socket.room;
    if (!room || !rooms[room]) return;

    const game = rooms[room];

    if (
        socket.id === game.hostId &&
        game.players.length >= 2 &&
        game.players.every(p => p.ready)
    ) {
        game.started = true;
if (game.settings.turnMode === "random") {
    game.players.sort(() => Math.random() - 0.5);
}

        if (game.settings.boardMode === "random") {
            game.board = generateBoard();
        }

        // 👇 manual mode: board should already exist
        io.to(room).emit("startGame", {
            board: game.board,
            settings: game.settings
        });
    }
});
socket.on("cycleTile", (index) => {
    const room = socket.room;
    if (!room || !rooms[room]) return;

    const game = rooms[room];

    if (socket.id !== game.hostId) return;
    if (game.settings.boardMode !== "manual") return;

    if (!game.board) {
        game.board = Array.from({ length: 19 }, () => ({
    type: null,
    number: null

}));

    }

    const types = ["wood", "brick", "sheep", "wheat", "ore","desert"];

    let current = game.board[index]?.type;
    let nextIndex = (types.indexOf(current) + 1) % types.length;

    game.board[index] = {
    ...game.board[index], // 🔥 keep number
    type: types[nextIndex]
};


    io.to(room).emit("boardUpdate", game.board);
});

socket.on("setVictoryPoints", (points) => {
    
    const room = socket.room;
    if (!room || !rooms[room]) return;

    const game = rooms[room];
    if (socket.id !== game.hostId) return;
    if (game.started) return;
    game.settings.victoryPoints = points;

    io.to(room).emit("settingsUpdate", game.settings);
    io.emit("rooms", getPublicRooms());

});
socket.on("resetLobby", () => {
    const room = socket.room;
    if (!room || !rooms[room]) return;

    const game = rooms[room];
    if (socket.id !== game.hostId) return;

    game.board = null;
    game.started = false;
    game.turnIndex = 0;

    game.players.forEach(p => p.ready = false);

    io.to(room).emit("players", game.players);
});
socket.on("setNumber", ({ index, number }) => {
    const room = socket.room;
    if (!room || !rooms[room]) return;

    const game = rooms[room];

    if (socket.id !== game.hostId) return;
    if (game.settings.boardMode !== "manual") return;

    if (!game.board) return;

    game.board[index] = {
        ...game.board[index],
        number
    };

    io.to(room).emit("boardUpdate", game.board);
});

    // =========================
    // DISCONNECT
    // =========================
    socket.on("disconnect", () => {
        const room = socket.room;
        if (!room || !rooms[room]) return;

        const game = rooms[room];

        game.players = game.players.filter(p => p.id !== socket.id);

        if (socket.id === game.hostId) {
    // 🔥 if game already started → kill it
    if (game.started) {
        delete rooms[room];
        io.emit("rooms", getPublicRooms());
        return;
    }

    game.hostId = game.players.length ? game.players[0].id : null;
    io.to(room).emit("hostChanged", game.hostId);
}


        io.to(room).emit("players", game.players);

        if (game.players.length === 0) {
            delete rooms[room];
        }

        console.log("User disconnected");
        io.emit("rooms", getPublicRooms());
    });
});



app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;

http.listen(PORT, () => {
    console.log("Server running");
});

