from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import datetime
from app.services.email_service import send_ticket_resolution_email
from app.core.security import require_employee
from app.db.database import get_db
from app.models.ticket import (
    Ticket,
    TicketCategory,
    TicketPriority,
    TicketStatus,
)
from app.models.user import User
from app.schemas.ticket import (
    TicketCreate,
    TicketResponse,
    TicketUpdate,
    AgentTicketDetailResponse,
    TicketOverrideRequest,
    TicketReplyRequest
)
from app.services.ai_classifier import classify_ticket

from app.core.security import require_agent
from app.services.rag_service import generate_ai_draft
from app.services.vector_store import vector_store


from app.models.ticket_audit import AuditField, TicketAuditLog
from app.schemas.ticket import TicketOverrideRequest
from app.services.websocket_manager import manager


router = APIRouter(prefix="/tickets", tags=["Tickets"])


@router.post(
    "/",
    response_model=TicketResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_ticket(
    ticket_data: TicketCreate,
    current_user: User = Depends(require_employee),
    db: Session = Depends(get_db),
):
    ai_result = classify_ticket(
        title=ticket_data.title,
        description=ticket_data.description,
    )

    new_ticket = Ticket(
        employee_id=current_user.id,
        title=ticket_data.title,
        description=ticket_data.description,
        attachment_filename=ticket_data.attachment_filename,

        ai_category=ai_result["category"],
        ai_priority=ai_result["priority"],

        category=ai_result["category"],
        priority=ai_result["priority"],
    )

    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)

    await manager.broadcast_to_agents(
    {
        "event": "ticket_created",
        "ticket": {
            "id": new_ticket.id,
            "employee_id": new_ticket.employee_id,
            "title": new_ticket.title,
            "category": new_ticket.category.value,
            "priority": new_ticket.priority.value,
            "status": new_ticket.status.value,
            "created_at": new_ticket.created_at.isoformat(),
        },
    }
)

    return new_ticket


@router.get(
    "/my",
    response_model=list[TicketResponse],
)
def get_my_tickets(
    current_user: User = Depends(require_employee),
    db: Session = Depends(get_db),
):
    tickets = db.scalars(
        select(Ticket)
        .where(Ticket.employee_id == current_user.id)
        .order_by(Ticket.created_at.desc())
    ).all()

    return tickets


@router.patch(
    "/{ticket_id}",
    response_model=TicketResponse,
)
def update_ticket(
    ticket_id: int,
    ticket_data: TicketUpdate,
    current_user: User = Depends(require_employee),
    db: Session = Depends(get_db),
):
    ticket = db.get(Ticket, ticket_id)

    if ticket is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found",
        )

    if ticket.employee_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only modify your own tickets",
        )

    if ticket.status.value == "Resolved":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resolved tickets cannot be modified",
        )

    update_data = ticket_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(ticket, field, value)

    db.commit()
    db.refresh(ticket)

    return ticket


@router.delete(
    "/{ticket_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_ticket(
    ticket_id: int,
    current_user: User = Depends(require_employee),
    db: Session = Depends(get_db),
):
    ticket = db.get(Ticket, ticket_id)

    if ticket is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found",
        )

    if ticket.employee_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own tickets",
        )

    if ticket.status.value == "Resolved":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resolved tickets cannot be deleted",
        )

    db.delete(ticket)
    db.commit()

    return None

@router.get(
    "/agent/all",
    response_model=list[TicketResponse],
)
def get_all_tickets_for_agent(
    status_filter: TicketStatus | None = None,
    category_filter: TicketCategory | None = None,
    priority_filter: TicketPriority | None = None,
    search: str | None = None,
    current_agent: User = Depends(require_agent),
    db: Session = Depends(get_db),
):
    query = select(Ticket)

    # Status filter
    if status_filter is not None:
        query = query.where(Ticket.status == status_filter)

    # Category filter
    if category_filter is not None:
        query = query.where(Ticket.category == category_filter)

    # Priority filter
    if priority_filter is not None:
        query = query.where(Ticket.priority == priority_filter)

    # Title search
    if search:
        query = query.where(
            Ticket.title.ilike(f"%{search.strip()}%")
        )

    query = query.order_by(Ticket.created_at.desc())

    tickets = db.scalars(query).all()

    return tickets

@router.get(
    "/{ticket_id}",
    response_model=AgentTicketDetailResponse,
)
def get_ticket_detail(
    ticket_id: int,
    current_agent: User = Depends(require_agent),
    db: Session = Depends(get_db),
):
    ticket = db.scalar(
        select(Ticket).where(Ticket.id == ticket_id)
    )

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found",
        )

    rag_result = generate_ai_draft(
        ticket.title,
        ticket.description,
        vector_store,
    )

    ticket.ai_draft_reply = rag_result["draft"]

    audit_logs = db.scalars(
        select(TicketAuditLog)
        .where(TicketAuditLog.ticket_id == ticket.id)
        .order_by(TicketAuditLog.created_at.desc())
    ).all()

    db.commit()
    db.refresh(ticket)

    return {
        "ticket": ticket,
        "ai_draft_reply": rag_result["draft"],
        "citations": rag_result["citations"],
        "audit_logs": audit_logs,
    }


@router.patch("/{ticket_id}/override")
def override_ticket_classification(
    ticket_id: int,
    override_data: TicketOverrideRequest,
    current_agent: User = Depends(require_agent),
    db: Session = Depends(get_db),
):
    ticket = db.scalar(
        select(Ticket).where(Ticket.id == ticket_id)
    )

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found",
        )

    if ticket.status == TicketStatus.RESOLVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resolved tickets cannot be overridden",
        )

    changes_made = False

    # Category override
    if override_data.category is not None:
        old_category = ticket.category

        if old_category != override_data.category:
            audit_log = TicketAuditLog(
                ticket_id=ticket.id,
                agent_id=current_agent.id,
                field=AuditField.CATEGORY,
                old_value=old_category.value,
                new_value=override_data.category.value,
            )

            db.add(audit_log)

            ticket.category = override_data.category
            changes_made = True

    # Priority override
    if override_data.priority is not None:
        old_priority = ticket.priority

        if old_priority != override_data.priority:
            audit_log = TicketAuditLog(
                ticket_id=ticket.id,
                agent_id=current_agent.id,
                field=AuditField.PRIORITY,
                old_value=old_priority.value,
                new_value=override_data.priority.value,
            )

            db.add(audit_log)

            ticket.priority = override_data.priority
            changes_made = True

    if not changes_made:
        return {
            "message": "No changes were made",
            "ticket": ticket,
        }

    db.commit()
    db.refresh(ticket)

    return {
        "message": "Ticket classification updated successfully",
        "ticket": ticket,
    }


@router.post(
    "/{ticket_id}/reply",
    response_model=TicketResponse,
)
async def send_ticket_reply(
    ticket_id: int,
    reply_data: TicketReplyRequest,
    current_agent: User = Depends(require_agent),
    db: Session = Depends(get_db),
):
    ticket = db.scalar(
        select(Ticket).where(Ticket.id == ticket_id)
    )

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found",
        )

    if ticket.status == TicketStatus.RESOLVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ticket is already resolved",
        )

    # Get the employee who created the ticket
    employee = db.get(User, ticket.employee_id)

    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )

    # Save the final reply and resolve the ticket
    ticket.final_reply = reply_data.reply.strip()
    ticket.status = TicketStatus.RESOLVED
    ticket.resolved_at = datetime.utcnow()

    # Commit the database changes FIRST
    db.commit()
    db.refresh(ticket)

    # Send email ONLY after successful database commit
    email_result = send_ticket_resolution_email(
        employee_email=employee.email,
        employee_name=employee.name,
        ticket_id=ticket.id,
        ticket_title=ticket.title,
        agent_reply=ticket.final_reply,
    )

    # Log email result
    if email_result.get("success"):
        print(
            f"Email sent successfully to {employee.email}"
        )
    else:
        print(
            f"Email notification failed for {employee.email}: "
            f"{email_result.get('error', 'Unknown error')}"
        )

    # Notify employee through WebSocket
    await manager.send_to_employee(
        ticket.employee_id,
        {
            "event": "ticket_resolved",
            "ticket": {
                "id": ticket.id,
                "status": ticket.status.value,
                "final_reply": ticket.final_reply,
                "resolved_at": (
                    ticket.resolved_at.isoformat()
                    if ticket.resolved_at
                    else None
                ),
            },
        },
    )

    return ticket