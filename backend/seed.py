from pathlib import Path

from sqlalchemy import select

from app.core.security import hash_password
from app.db.database import Base, SessionLocal, engine
from app.models.user import User, UserRole


def seed_users():
    db = SessionLocal()

    try:
        # -----------------------------
        # Demo Employee
        # -----------------------------
        employee_email = "employee@quickdesk.com"

        employee = db.scalar(
            select(User).where(User.email == employee_email)
        )

        if not employee:
            employee = User(
                name="Demo Employee",
                email=employee_email,
                password_hash=hash_password("Employee@123"),
                role=UserRole.EMPLOYEE,
            )

            db.add(employee)
            print("✅ Demo employee created")
        else:
            print("ℹ️ Demo employee already exists")

        # -----------------------------
        # Demo Agent
        # -----------------------------
        agent_email = "agent@quickdesk.com"

        agent = db.scalar(
            select(User).where(User.email == agent_email)
        )

        if not agent:
            agent = User(
                name="Demo Agent",
                email=agent_email,
                password_hash=hash_password("Agent@123"),
                role=UserRole.AGENT,
            )

            db.add(agent)
            print("✅ Demo agent created")
        else:
            print("ℹ️ Demo agent already exists")

        db.commit()

    finally:
        db.close()


def check_knowledge_base():
    kb_path = Path(__file__).resolve().parent / "app" / "kb"

    if not kb_path.exists():
        print("❌ Knowledge base directory not found")
        return

    articles = list(kb_path.glob("*.md"))

    print(f"✅ Knowledge base found: {len(articles)} articles")

    for article in articles:
        print(f"   - {article.name}")


def main():
    print("\n🌱 Seeding QuickDesk...\n")

    # Make sure tables exist
    Base.metadata.create_all(bind=engine)

    seed_users()
    check_knowledge_base()

    print("\n✅ Seed completed successfully!\n")


if __name__ == "__main__":
    main()