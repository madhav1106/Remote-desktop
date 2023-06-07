import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { remoteHandler } from "./remote";

const app = express();
app.use(cors);
const port = 8080;
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

io.on("connection", (socket) => {
    console.log("a user connected");
    remoteHandler(socket);
    socket.on("disconnect", () => {
        console.log("user disconnected");
    });
});

server.listen(port, () => {
    console.log(`listening on *:${port}`);
});