const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const rooms = {};

function makeRoom(code) {
  rooms[code] = {
    code,
    hostId: null,
    players: [],
    public: false,
    settings: {
      boardMode: "random",
      turnMode: "join",
      victoryPoints: 10
    },
    started: false
  };
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

function emitRoom(room) {
  io.to(room.code).emit("players", room.players);
  io.to(room.code).emit("host", room.hostId);
  io.to(room.code).emit("settingsUpdate", room.settings);
  io.to(room.code).emit("roomPrivacy", room.public);
}

function assignHost(room) {
  const human = room.players.find(p => !p.ai);
  room.hostId = human ? human.id : null;
  io.to(room.code).emit("hostChanged", room.hostId);
}

io.on("connection", socket => {
  socket.on("join", ({ name, room }) => {
    if (!rooms[room]) makeRoom(room);

    const data = rooms[room];

    if (data.players.length >= 4) {
      socket.emit("joinError", "Room full");
      return;
    }

    socket.join(room);
    socket.roomCode = room;

    data.players.push({
      id: socket.id,
      name,
      ready: false,
      ai: false
    });

    if (!data.hostId) data.hostId = socket.id;

    emitRoom(data);
  });

  socket.on("toggleReady", () => {
    const room = rooms[socket.roomCode];
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    player.ready = !player.ready;
    emitRoom(room);
  });

  socket.on("addAI", () => {
    const room = rooms[socket.roomCode];
    if (!room) return;
    if (room.hostId !== socket.id) return;
    if (room.players.length >= 4) return;

    room.players.push({
      id: "ai_" + Date.now(),
      name: "AI Bot",
      ready: true,
      ai: true
    });

    emitRoom(room);
  });

  socket.on("togglePublic", () => {
    const room = rooms[socket.roomCode];
    if (!room) return;
    if (room.hostId !== socket.id) return;

    room.public = !room.public;
    emitRoom(room);
  });

  socket.on("setBoardMode", mode => {
    const room = rooms[socket.roomCode];
    if (!room || room.hostId !== socket.id) return;
    room.settings.boardMode = mode;
    emitRoom(room);
  });

  socket.on("setTurnMode", mode => {
    const room = rooms[socket.roomCode];
    if (!room || room.hostId !== socket.id) return;
    room.settings.turnMode = mode;
    emitRoom(room);
  });

  socket.on("setVictoryPoints", points => {
    const room = rooms[socket.roomCode];
    if (!room || room.hostId !== socket.id) return;
    room.settings.victoryPoints = points;
    emitRoom(room);
  });

  socket.on("getRooms", () => {
    socket.emit("rooms", getPublicRooms());
  });

  socket.on("startGame", () => {
    const room = rooms[socket.roomCode];
    if (!room) return;
    if (room.hostId !== socket.id) return;

    const readyCount = room.players.filter(p => p.ready).length;

    if (readyCount < 2) return;

    room.started = true;

    io.to(room.code).emit("startGame", {
      board: [],
      ports: []
    });
  });

  socket.on("leaveRoom", () => {
    const room = rooms[socket.roomCode];
    if (!room) return;

    room.players = room.players.filter(p => p.id !== socket.id);

    if (room.hostId === socket.id) assignHost(room);

    const humansLeft = room.players.filter(p => !p.ai).length;

    if (humansLeft === 0) {
    delete rooms[room.code];
    return;
}


    emitRoom(room);
  });

  socket.on("disconnect", () => {
    const room = rooms[socket.roomCode];
    if (!room) return;

    room.players = room.players.filter(p => p.id !== socket.id);

    if (room.hostId === socket.id) assignHost(room);

    if (room.players.length === 0) {
      delete rooms[room.code];
      return;
    }

    emitRoom(room);
  });
});

server.listen(3000, () => {
  console.log("Server running on port 3000");
});
