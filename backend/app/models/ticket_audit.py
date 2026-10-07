from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, Enum as SQLEnum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class AuditField(str, Enum):
    CATEGORY = "category"
    PRIORITY = "priority"


class TicketAuditLog(Base):
    __tablename__ = "ticket_audit_logs"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    ticket_id: Mapped[int] = mapped_column(
        ForeignKey("tickets.id"),
        nullable=False,
        index=True,
    )

    agent_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    field: Mapped[AuditField] = mapped_column(
        SQLEnum(AuditField),
        nullable=False,
    )

    old_value: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    new_value: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )