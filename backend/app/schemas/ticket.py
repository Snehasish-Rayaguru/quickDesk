from datetime import datetime

from pydantic import BaseModel, Field


from app.models.ticket import (
    TicketCategory,
    TicketPriority,
    TicketStatus,
)


class TicketCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=5)
    attachment_filename: str | None = Field(
        default=None,
        max_length=255,
    )


class TicketResponse(BaseModel):
    id: int
    employee_id: int
    title: str
    description: str
    attachment_filename: str | None

    category: TicketCategory
    priority: TicketPriority
    status: TicketStatus

    ai_category: TicketCategory | None
    ai_priority: TicketPriority | None

    ai_draft_reply: str | None
    final_reply: str | None

    created_at: datetime
    updated_at: datetime
    resolved_at: datetime | None

    model_config = {"from_attributes": True}

class TicketUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=200)
    description: str | None = Field(default=None, min_length=5)
    attachment_filename: str | None = Field(
        default=None,
        max_length=255,
    )



class TicketCitation(BaseModel):
    title: str
    source: str


class TicketAuditResponse(BaseModel):
    id: int
    agent_id: int
    field: str
    old_value: str
    new_value: str
    created_at: datetime

    model_config = {"from_attributes": True}

class EmployeeInfo(BaseModel):
    id: int
    name: str
    email: str

    model_config = {"from_attributes": True}

class AgentTicketDetailResponse(BaseModel):
    ticket: TicketResponse
    employee: EmployeeInfo
    ai_draft_reply: str | None
    citations: list[TicketCitation]
    audit_logs: list[TicketAuditResponse]

    model_config = {"from_attributes": True}


class TicketOverrideRequest(BaseModel):
    category: TicketCategory | None = None
    priority: TicketPriority | None = None


class TicketReplyRequest(BaseModel):
    reply: str = Field(min_length=1, max_length=5000)