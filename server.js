const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const GameRoom = require("./game/game");
const Board = require("./game/board");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const rooms = {};

// =====================================
// HELPERS
// =====================================

function getRoom(code) {
    return rooms[code];
}

function runAITurn(room) {
    const current = room.currentPlayer();
    if (!current) return;

    if (!current.ai) return;

    setTimeout(() => {
        console.log(current.name + " took AI turn");

        // later we add real AI moves here

        room.nextTurn();
        emitTurn(room);

        runAITurn(room); // chain next AI if another AI turn
    }, 1200);
}

function validatePorts(ports) {
    if (ports.length !== 9) return "Need 9 ports.";

    const seen = new Set();

    const count = {
        "3:1":0,
        wood:0,
        brick:0,
        sheep:0,
        wheat:0,
        ore:0
    };

    for (const p of ports) {
        const key = `${p.q},${p.r},${p.side}`;

        if (seen.has(key)) return "Duplicate port position.";
        seen.add(key);

        if (!(p.type in count)) return "Invalid port type.";

        count[p.type]++;
    }

    if (count["3:1"] !== 4) return "Need 4x 3:1";
    if (count.wood !== 1) return "Need wood port";
    if (count.brick !== 1) return "Need brick port";
    if (count.sheep !== 1) return "Need sheep port";
    if (count.wheat !== 1) return "Need wheat port";
    if (count.ore !== 1) return "Need ore port";

    return null;
}


function makeRoom(code) {
    const room = new GameRoom(code);

    room.board = Board.createRandomBoard();
room.ports = Board.createRandomPorts();


    rooms[code] = room;
    return room;
}

function getOrCreateRoom(code) {
    return rooms[code] || makeRoom(code);
}

function emitRoom(room) {
    io.to(room.code).emit("players", room.players);
    io.to(room.code).emit("host", room.hostId);
    io.to(room.code).emit("settingsUpdate", room.settings);
    io.to(room.code).emit("roomPrivacy", room.public);
}

function emitBoard(room) {
    io.to(room.code).emit("boardUpdate", room.board);
    io.to(room.code).emit("portsUpdate", room.ports);
}

function emitTurn(room) {
    io.to(room.code).emit("turnUpdate", room.turn);
}

function deleteRoomIfDead(room) {
    if (!room.hasHumans()) {
        delete rooms[room.code];
        return true;
    }
    return false;
}

function getPublicRooms() {
    return Object.values(rooms)
        .filter(r => r.public && !r.started)
        .map(r => ({
            code: r.code,
            players: r.players.length,
            max: 4
        }));
}

function requireRoom(socket) {
    return getRoom(socket.roomCode);
}

function requireHost(socket, room) {
    return room && room.hostId === socket.id;
}

// =====================================
// SOCKET
// =====================================

io.on("connection", socket => {

    // ==============================
    // JOIN
    // ==============================
    socket.on("join", ({ name, room }) => {
        const data = getOrCreateRoom(room);

        if (data.isFull()) {
            socket.emit("joinError", "Room full");
            return;
        }

        socket.join(room);
        socket.roomCode = room;

        data.addPlayer(socket.id, name || "Player");

        emitRoom(data);
        emitBoard(data);
    });

    // ==============================
    // LEAVE
    // ==============================
    socket.on("leaveRoom", () => {
        const room = requireRoom(socket);
        if (!room) return;

        room.removePlayer(socket.id);

        if (deleteRoomIfDead(room)) return;

        emitRoom(room);
    });

    socket.on("disconnect", () => {
        const room = requireRoom(socket);
        if (!room) return;

        room.removePlayer(socket.id);

        if (deleteRoomIfDead(room)) return;

        emitRoom(room);
    });

    // ==============================
    // READY
    // ==============================
    socket.on("toggleReady", () => {
        const room = requireRoom(socket);
        if (!room) return;

        room.toggleReady(socket.id);
        emitRoom(room);
    });

    // ==============================
    // HOST ACTIONS
    // ==============================
    socket.on("addAI", () => {
        const room = requireRoom(socket);
        if (!requireHost(socket, room)) return;
        if (room.isFull()) return;

        room.addAI();
        emitRoom(room);
    });

    socket.on("kickPlayer", id => {
        const room = requireRoom(socket);
        if (!requireHost(socket, room)) return;

        room.kickPlayer(id);

        if (deleteRoomIfDead(room)) return;

        emitRoom(room);
    });

    socket.on("togglePublic", () => {
        const room = requireRoom(socket);
        if (!requireHost(socket, room)) return;

        room.togglePublic();
        emitRoom(room);
    });

socket.on("setBoardMode", mode => {
    const room = requireRoom(socket);
    if (!requireHost(socket, room)) return;

    room.setBoardMode(mode);

    if (mode === "random") {
        room.board = Board.createRandomBoard();
        room.ports = Board.createRandomPorts();
        emitBoard(room);
    }

    emitRoom(room); // <- REQUIRED
});



    socket.on("setTurnMode", mode => {
        const room = requireRoom(socket);
        if (!requireHost(socket, room)) return;

        room.setTurnMode(mode);
        emitRoom(room);
    });

    socket.on("setVictoryPoints", points => {
        const room = requireRoom(socket);
        if (!requireHost(socket, room)) return;

        room.setVictoryPoints(points);
        emitRoom(room);
    });

    // ==============================
    // ROOM LIST
    // ==============================
    socket.on("getRooms", () => {
        socket.emit("rooms", getPublicRooms());
    });

    // ==============================
    // BOARD
    // ==============================
    socket.on("requestBoard", () => {
        const room = requireRoom(socket);
        if (!room) return;

        emitBoard(room);
    });

    socket.on("cycleTile", index => {
        const room = requireRoom(socket);
        if (!requireHost(socket, room)) return;
        if (room.settings.boardMode !== "manual") return;

        room.board = Board.cycleTile(room.board, index);

        emitBoard(room);
    });

    socket.on("setNumber", ({ index, number }) => {
        const room = requireRoom(socket);
        if (!requireHost(socket, room)) return;
        if (room.settings.boardMode !== "manual") return;

        room.board = Board.setNumber(room.board, index, number);

        emitBoard(room);
    });

socket.on("setPort", ({ q, r, side, type }) => {
    const room = requireRoom(socket);
    if (!requireHost(socket, room)) return;

    room.ports = room.ports.filter(p =>
        !(p.q === q && p.r === r && p.side === side)
    );

    if (type) {
        room.ports.push({ q, r, side, type });
    }

    emitBoard(room);
});

    socket.on("validateSetup", () => {
    const room = requireRoom(socket);
    if (!requireHost(socket, room)) return;

    // board validation
    const boardResult = Board.validateBoard(room.board);

    if (!boardResult.ok) {
        socket.emit("setupError", boardResult.error);
        return;
    }

    // port validation
    const portError = validatePorts(room.ports || []);

    if (portError) {
        socket.emit("setupError", portError);
        return;
    }

    socket.emit("setupValid");
});

    

    // ==============================
    // START GAME
    // ==============================
    socket.on("startGame", () => {
        const room = requireRoom(socket);
        if (!requireHost(socket, room)) return;

        if (!room.canStart()) {
            socket.emit("setupError", "Need at least 2 ready players.");
            return;
        }

        if (room.settings.boardMode === "random") {
    room.board = Board.createRandomBoard();
    room.ports = Board.createRandomPorts();
}


const valid = Board.validateBoard(room.board);

        if (!valid.ok) {
            socket.emit("setupError", valid.error);
            return;
        }        


const portError = validatePorts(room.ports || []);
if (portError) {
   socket.emit("setupError", portError);
   return;
}



        room.start();

        io.to(room.code).emit("startGame", {
            board: room.board,
            ports: room.ports
        });

        emitTurn(room);
runAITurn(room);

    });

    // ==============================
    // TURNS
    // ==============================
    socket.on("nextTurn", () => {
    const room = requireRoom(socket);
    if (!room || !room.started) return;

    const current = room.currentPlayer();
    if (!current) return;

    // Only human whose turn it is can end turn
    if (!current.ai && current.id !== socket.id) return;

    room.nextTurn();
    emitTurn(room);

    runAITurn(room);
});


    // ==============================
    // RESET GAME
    // ==============================
    socket.on("resetGame", () => {
        const room = requireRoom(socket);
        if (!requireHost(socket, room)) return;

        room.reset();

        room.board = Board.createRandomBoard();
        room.ports = Board.createRandomPorts();

        emitRoom(room);
        emitBoard(room);
    });

});

// =====================================
// START
// =====================================

server.listen(3000, () => {
    console.log("Server running on port 3000");
});
