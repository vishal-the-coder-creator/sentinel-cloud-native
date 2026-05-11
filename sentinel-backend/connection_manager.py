import logging

from fastapi import WebSocket


logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info("WebSocket client connected. Active clients: %s", len(self.active_connections))

    def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info("WebSocket client disconnected. Active clients: %s", len(self.active_connections))

    async def broadcast_update(self) -> None:
        disconnected_clients: list[WebSocket] = []

        for connection in self.active_connections:
            try:
                await connection.send_json({"type": "update"})
            except Exception:
                logger.warning("WebSocket broadcast failed; removing stale client")
                disconnected_clients.append(connection)

        for connection in disconnected_clients:
            self.disconnect(connection)


manager = ConnectionManager()
