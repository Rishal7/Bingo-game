import { io, Socket } from "socket.io-client";

// In production, this would point to the deployed backend URL
const URL = "http://localhost:3001";

export const socket: Socket = io(URL, {
  autoConnect: false,
});
