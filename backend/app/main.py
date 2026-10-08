from fastapi import FastAPI
from sqlalchemy import text

from app.db.database import Base, engine
from app.models.user import User
from app.services.rag_service import build_vector_store

from app.api.users import router as users_router
from app.api.auth import router as auth_router
from app.api.tickets import router as tickets_router
from app.api.metrics import router as metrics_router
from app.api.websocket import router as websocket_router

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="QuickDesk API",
    description="AI-Assisted Internal Helpdesk API",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users_router)
app.include_router(auth_router)
app.include_router(tickets_router)
app.include_router(metrics_router)
app.include_router(websocket_router)

Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {
        "message": "QuickDesk API is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


@app.get("/health/db")
def database_health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "database": "connected"
        }

    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }


