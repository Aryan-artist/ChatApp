import { WebSocketServer, WebSocket } from "ws";

import dotenv from "dotenv";
dotenv.config();

const port = Number(process.env.PORT) || 8080;
const wss = new WebSocketServer({
    port: port,
    maxPayload: 64 * 1024,
});

const rooms = new Map<string, Set<WebSocket>>();
const socketRooms = new Map<WebSocket, string>();


wss.on("connection", (socket) => {


    socket.on("message", (message) => {

        const parsedMessage = JSON.parse(message.toString());

        if (parsedMessage.type === "join") {
            const roomCode = parsedMessage.payload.roomCode;

            //kya phele se kisi room me hai to usse remove kar do
            if (socketRooms.has(socket)) {
                const previousRoomCode = socketRooms.get(socket);
                rooms.get(previousRoomCode!)?.delete(socket);
                socketRooms.delete(socket);
            }

            if (!rooms.has(roomCode)) {
                rooms.set(roomCode, new Set());
            }
            rooms.get(roomCode)?.add(socket);
            socketRooms.set(socket, roomCode);

        }

        if (parsedMessage.type === "chat") {
            const roomCode = socketRooms.get(socket);
            const chatMessage = parsedMessage.payload.message;
            if (!roomCode) return;

            rooms.get(roomCode)?.forEach((client) => {
                if (client !== socket && client.readyState === WebSocket.OPEN) {
                    client.send(chatMessage);
                }
            });
        }

    });

    socket.on("close", () => {
        if (socketRooms.has(socket)) {
            const roomCode = socketRooms.get(socket);
            rooms.get(roomCode!)?.delete(socket);
            socketRooms.delete(socket);
        }
    })

});
