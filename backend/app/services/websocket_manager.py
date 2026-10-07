from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.agent_connections: list[WebSocket] = []
        self.employee_connections: dict[int, WebSocket] = {}

    async def connect_agent(self, websocket: WebSocket):
        await websocket.accept()
        self.agent_connections.append(websocket)

    def disconnect_agent(self, websocket: WebSocket):
        if websocket in self.agent_connections:
            self.agent_connections.remove(websocket)

    async def connect_employee(
        self,
        employee_id: int,
        websocket: WebSocket,
    ):
        await websocket.accept()
        self.employee_connections[employee_id] = websocket

    def disconnect_employee(
        self,
        employee_id: int,
        websocket: WebSocket,
    ):
        if self.employee_connections.get(employee_id) == websocket:
            del self.employee_connections[employee_id]

    async def broadcast_to_agents(self, message: dict):
        disconnected = []

        for websocket in self.agent_connections:
            try:
                await websocket.send_json(message)
            except Exception:
                disconnected.append(websocket)

        for websocket in disconnected:
            self.disconnect_agent(websocket)

    async def send_to_employee(
        self,
        employee_id: int,
        message: dict,
    ):
        websocket = self.employee_connections.get(employee_id)

        if websocket:
            try:
                await websocket.send_json(message)
            except Exception:
                self.disconnect_employee(
                    employee_id,
                    websocket,
                )


manager = ConnectionManager()