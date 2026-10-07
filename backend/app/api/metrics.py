from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import require_agent
from app.db.database import get_db
from app.models.ticket import (
    Ticket,
    TicketCategory,
    TicketStatus,
)
from app.models.ticket_audit import AuditField, TicketAuditLog
from app.models.user import User
from app.schemas.metrics import (
    CategoryMetrics,
    MetricsResponse,
    TicketStatusMetrics,
)

router = APIRouter(prefix="/metrics", tags=["Metrics"])


@router.get("/", response_model=MetricsResponse)
def get_metrics(
    current_agent: User = Depends(require_agent),
    db: Session = Depends(get_db),
):
    tickets = db.scalars(select(Ticket)).all()

    # -----------------------------
    # Tickets by status
    # -----------------------------
    open_count = sum(
        1 for ticket in tickets
        if ticket.status == TicketStatus.OPEN
    )

    resolved_count = sum(
        1 for ticket in tickets
        if ticket.status == TicketStatus.RESOLVED
    )

    # -----------------------------
    # Tickets by category
    # -----------------------------
    category_counts = {
        category: 0
        for category in TicketCategory
    }

    for ticket in tickets:
        category_counts[ticket.category] += 1

    # -----------------------------
    # Median resolution time
    # -----------------------------
    resolution_times = []

    for ticket in tickets:
        if ticket.resolved_at and ticket.created_at:
            duration = (
                ticket.resolved_at - ticket.created_at
            ).total_seconds() / 60

            resolution_times.append(duration)

    resolution_times.sort()

    if not resolution_times:
        median_resolution_time = 0.0
    else:
        n = len(resolution_times)
        middle = n // 2

        if n % 2 == 1:
            median_resolution_time = resolution_times[middle]
        else:
            median_resolution_time = (
                resolution_times[middle - 1]
                + resolution_times[middle]
            ) / 2

    # -----------------------------
    # AI category override %
    # -----------------------------
    category_overrides = db.scalars(
        select(TicketAuditLog).where(
            TicketAuditLog.field == AuditField.CATEGORY
        )
    ).all()

    total_tickets = len(tickets)

    overridden_ticket_ids = {
        log.ticket_id
        for log in category_overrides
    }

    overridden_count = len(overridden_ticket_ids)

    if total_tickets == 0:
        override_percentage = 0.0
    else:
        override_percentage = (
            overridden_count / total_tickets
        ) * 100

    return MetricsResponse(
        tickets_by_status=TicketStatusMetrics(
            open=open_count,
            resolved=resolved_count,
        ),
        tickets_by_category=CategoryMetrics(
            IT=category_counts[TicketCategory.IT],
            HR=category_counts[TicketCategory.HR],
            Finance=category_counts[TicketCategory.FINANCE],
            Admin=category_counts[TicketCategory.ADMIN],
            Other=category_counts[TicketCategory.OTHER],
        ),
        median_resolution_time_minutes=round(
            median_resolution_time,
            2,
        ),
        ai_category_override_percentage=round(
            override_percentage,
            2,
        ),
    )