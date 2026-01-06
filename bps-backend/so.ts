const WEBSOCKET_URL = process.env.WEBSOCKET_URL || "http://localhost:3001"

const ws = new WebSocket(WEBSOCKET_URL);
const connection_promise = new Promise(r => { ws.onopen = r });
console.log("Promise made");
await connection_promise;
console.log("Connected successfully");

export {}