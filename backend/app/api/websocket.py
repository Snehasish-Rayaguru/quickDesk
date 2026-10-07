from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import JWTError, jwt
from sqlalchemy import select

from app.core.config import settings
from app.db.database import SessionLocal
from app.models.user import User, UserRole
from app.services.websocket_manager import manager


router = APIRouter(tags=["WebSocket"])

ALGORITHM = "HS256"


def get_user_from_token(token: str) -> User | None:
    db = SessionLocal()

    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[ALGORITHM],
        )

        user_id = payload.get("sub")

        if user_id is None:
            return None

        user = db.scalar(
            select(User).where(User.id == int(user_id))
        )

        if user is None or not user.is_active:
            return None

        return user

    except (JWTError, ValueError, TypeError):
        return None

    finally:
        db.close()


@router.websocket("/ws/agent")
async def agent_websocket(websocket: WebSocket):
    token = websocket.query_params.get("token")

    if not token:
        await websocket.close(code=1008)
        return

    user = get_user_from_token(token)

    if user is None or user.role != UserRole.AGENT:
        await websocket.close(code=1008)
        return

    await manager.connect_agent(websocket)

    try:
        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        manager.disconnect_agent(websocket)


@router.websocket("/ws/employee/{employee_id}")
async def employee_websocket(
    websocket: WebSocket,
    employee_id: int,
):
    token = websocket.query_params.get("token")

    if not token:
        await websocket.close(code=1008)
        return

    user = get_user_from_token(token)

    if user is None:
        await websocket.close(code=1008)
        return

    if user.role != UserRole.EMPLOYEE:
        await websocket.close(code=1008)
        return

    if user.id != employee_id:
        await websocket.close(code=1008)
        return

    await manager.connect_employee(
        employee_id,
        websocket,
    )

    try:
        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        manager.disconnect_employee(
            employee_id,
            websocket,
        )