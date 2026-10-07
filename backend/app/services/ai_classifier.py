import json

from groq import Groq

from app.core.config import settings
from app.models.ticket import TicketCategory, TicketPriority


client = Groq(api_key=settings.groq_api_key)


def classify_ticket(title: str, description: str) -> dict:
    prompt = f"""
You are a helpdesk ticket classifier.

Classify the following support ticket into exactly one category
and exactly one priority.

Allowed categories:
- IT
- HR
- Finance
- Admin
- Other

Allowed priorities:
- Low
- Medium
- High

Return ONLY valid JSON in this exact format:

{{
    "category": "IT",
    "priority": "High"
}}

Ticket title:
{title}

Ticket description:
{description}
"""

    completion = client.chat.completions.create(
        model="qwen/qwen3.8-27b",
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
        temperature=0,
        max_completion_tokens=100,
        top_p=1,
        stream=False,
    )

    content = completion.choices[0].message.content

    try:
        result = json.loads(content)

        category = TicketCategory(result["category"])
        priority = TicketPriority(result["priority"])

        return {
            "category": category,
            "priority": priority,
        }

    except (json.JSONDecodeError, KeyError, ValueError, TypeError):
        return {
            "category": TicketCategory.OTHER,
            "priority": TicketPriority.MEDIUM,
        }