import smtplib
from email.message import EmailMessage

from app.core.config import settings


def send_ticket_resolution_email(
    employee_email: str,
    employee_name: str,
    ticket_id: int,
    ticket_title: str,
    agent_reply: str,
):
    """
    Send a real email notification through Gmail SMTP.
    """

    subject = f"QuickDesk Ticket #{ticket_id} Resolved"

    body = f"""Hello {employee_name},

Your support ticket has been resolved.

Ticket:
#{ticket_id} - {ticket_title}

Agent Response:
{agent_reply}

If you need further assistance, please create a new support ticket.

Regards,
QuickDesk Support Team
"""

    message = EmailMessage()
    message["From"] = settings.email_from
    message["To"] = employee_email
    message["Subject"] = subject
    message.set_content(body)

    try:
        with smtplib.SMTP(
            settings.email_host,
            settings.email_port,
        ) as server:
            server.starttls()
            server.login(
                settings.email_username,
                settings.email_password,
            )
            server.send_message(message)

        print(
            f"Email sent successfully to {employee_email}"
        )

        return {
            "success": True,
            "recipient": employee_email,
            "subject": subject,
        }

    except Exception as e:
        print(
            f"Failed to send email to {employee_email}: {e}"
        )

        return {
            "success": False,
            "recipient": employee_email,
            "error": str(e),
        }