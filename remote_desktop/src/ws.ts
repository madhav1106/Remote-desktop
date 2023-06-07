import socketIOClient from "socket.io-client";

// export const WS = "http://192.168.0.5:8080";
export const WS = "https://webrtc.crossteam.app";
export const ws = socketIOClient(WS);