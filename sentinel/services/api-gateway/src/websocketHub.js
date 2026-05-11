export class WebSocketHub {
  constructor() {
    this.clients = new Set();
  }

  add(ws) {
    this.clients.add(ws);
    ws.on("close", () => {
      this.clients.delete(ws);
    });
  }

  broadcast(payload) {
    const message = JSON.stringify(payload);
    for (const client of this.clients) {
      if (client.readyState === 1) {
        client.send(message);
      }
    }
  }
}
