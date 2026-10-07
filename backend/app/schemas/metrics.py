from pydantic import BaseModel


class TicketStatusMetrics(BaseModel):
    open: int
    resolved: int


class CategoryMetrics(BaseModel):
    IT: int
    HR: int
    Finance: int
    Admin: int
    Other: int


class MetricsResponse(BaseModel):
    tickets_by_status: TicketStatusMetrics
    tickets_by_category: CategoryMetrics
    median_resolution_time_minutes: float
    ai_category_override_percentage: float