from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, Enum as SQLEnum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class TicketCategory(str, Enum):
    IT = "IT"
    HR = "HR"
    FINANCE = "Finance"
    ADMIN = "Admin"
    OTHER = "Other"


class TicketPriority(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class TicketStatus(str, Enum):
    OPEN = "Open"
    RESOLVED = "Resolved"


class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    employee_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    attachment_filename: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    category: Mapped[TicketCategory] = mapped_column(
        SQLEnum(TicketCategory),
        nullable=False,
        default=TicketCategory.OTHER,
    )

    priority: Mapped[TicketPriority] = mapped_column(
        SQLEnum(TicketPriority),
        nullable=False,
        default=TicketPriority.MEDIUM,
    )

    status: Mapped[TicketStatus] = mapped_column(
        SQLEnum(TicketStatus),
        nullable=False,
        default=TicketStatus.OPEN,
    )

    ai_category: Mapped[TicketCategory | None] = mapped_column(
        SQLEnum(TicketCategory),
        nullable=True,
    )

    ai_priority: Mapped[TicketPriority | None] = mapped_column(
        SQLEnum(TicketPriority),
        nullable=True,
    )

    ai_draft_reply: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    final_reply: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )