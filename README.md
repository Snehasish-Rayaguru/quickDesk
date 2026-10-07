# 1. What This Is

QuickDesk is an AI-assisted internal helpdesk application that allows employees to create and track support tickets while enabling support agents to manage, classify, respond to, and resolve those tickets. When a ticket is created, an LLM suggests its category and priority, while a Retrieval-Augmented Generation (RAG) pipeline uses a knowledge base to generate a grounded draft response for the agent. Agents remain in control by reviewing or overriding AI classifications, editing AI-generated replies, and sending the final response. The system also includes JWT authentication, role-based access control, audit logging, real-time updates through WebSockets, and agent-level metrics.

# 2. How to Run Locally
Follow these steps to run QuickDesk from a fresh clone.
1. Clone the repository
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd quickDesk

2. Create the backend environment
conda create -n quickdesk python=3.11
conda activate quickdesk

3. Install backend dependencies
cd backend
pip install -r requirements.txt

4. Set up PostgreSQL
Create a PostgreSQL database named:
quickdesk

The development configuration uses:
Host: localhost
Port: 5433
Database: quickdesk
User: postgres

If your PostgreSQL uses a different port or password, update the database URL accordingly.
5. Configure environment variables
Create a .env file inside the backend directory:
backend/.env

Copy the values from .env.example and configure:
APP_NAME=QuickDesk
ENVIRONMENT=development
DATABASE_URL=postgresql+psycopg://postgres:YOUR_PASSWORD@localhost:5433/quickdesk
JWT_SECRET_KEY=your_secret_key
GROQ_API_KEY=your_groq_api_key

Do not commit the .env file to the repository.
6. Seed the database
From the backend directory:
python seed.py

This creates the demo users and loads the knowledge-base articles.
7. Start the backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

The API will be available at:
http://127.0.0.1:8000

You can verify it using:
http://127.0.0.1:8000/health

8. Start the frontend
Open a new terminal and run:
cd quickDesk/frontend
npm install
npm run dev

The frontend will be available at:
http://localhost:5173

Open this URL in your browser.
9. Demo accounts
Employee
Email: employee@quickdesk.com
Password: Employee@123

Agent
Email: agent@quickdesk.com
Password: Agent@123

Quick Start Summary
# Terminal 1 — Backend
cd quickDesk/backend
conda activate quickdesk
pip install -r requirements.txt
python seed.py
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# Terminal 2 — Frontend
cd quickDesk/frontend
npm install
npm run dev

Then open:
http://localhost:5173


# 3. Architecture

The following diagram shows the main components of QuickDesk and how the frontend, backend, database, AI services, RAG pipeline, and real-time communication work together.

![QuickDesk Architecture](docs/architecture.png)


# 4. API Endpoints

### REST API

| Method | Path | Purpose | Auth Required |
|--------|------|---------|---------------|
| `GET` | `/` | Check whether the API is running | No |
| `GET` | `/health` | Application health check | No |
| `GET` | `/health/db` | Check database connectivity | No |
| `POST` | `/users/` | Create a new user | No |
| `POST` | `/auth/login` | Authenticate user and return JWT token | No |
| `GET` | `/auth/me` | Get the currently authenticated user | Yes |
| `POST` | `/tickets/` | Create a new support ticket | Employee |
| `GET` | `/tickets/my` | Get tickets belonging to the logged-in employee | Employee |
| `PATCH` | `/tickets/{ticket_id}` | Edit an employee's own open ticket | Employee |
| `DELETE` | `/tickets/{ticket_id}` | Delete an employee's own open ticket | Employee |
| `GET` | `/tickets/agent/all` | Get all tickets for the agent dashboard with filtering and search | Agent |
| `GET` | `/tickets/{ticket_id}` | Get ticket details, AI draft, citations, and audit logs | Agent |
| `PATCH` | `/tickets/{ticket_id}/override` | Override AI-suggested category or priority | Agent |
| `POST` | `/tickets/{ticket_id}/reply` | Send the final agent reply and resolve the ticket | Agent |
| `GET` | `/metrics/` | Get agent metrics and ticket statistics | Agent |

### WebSocket Endpoints

| Type | Path | Purpose | Auth Required |
|------|------|---------|---------------|
| `WS` | `/ws/agent?token=<JWT>` | Send new-ticket notifications to connected agents | Agent |
| `WS` | `/ws/employee/{employee_id}?token=<JWT>` | Notify an employee when their ticket is resolved | Employee |

### Authentication

Authenticated REST API requests use:

```http
Authorization: Bearer <JWT_TOKEN>



# 4. Decisions and Tradeoffs

### a) Why did you pick this frontend framework (React vs Next.js)?

I chose **React with Vite** instead of Next.js because QuickDesk is a relatively small internal dashboard application and does not require server-side rendering, SEO optimization, or the additional routing and server features provided by Next.js.

React with Vite keeps the frontend simple and lightweight while providing everything needed for:

- Employee and agent dashboards
- Authentication
- Ticket management
- API communication
- WebSocket-based real-time updates
- AI response editing

The main tradeoff is that Next.js would provide more built-in features and a stronger structure for a larger production application, but those features would add unnecessary complexity for this project.

---

### b) How did you structure the RAG pipeline? Chunk size, embedding model, retriever, prompt?

The RAG pipeline uses the internal Markdown knowledge base as its source of truth.

The pipeline is structured as:

```text
Markdown Knowledge Base
        ↓
Document Loading
        ↓
Recursive Character Text Splitter
        ↓
Chunk Size: 500
Chunk Overlap: 100
        ↓
Sentence Transformer Embeddings
        ↓
FAISS Vector Store
        ↓
Similarity Search
        ↓
Top 3 Relevant Chunks
        ↓
Grounded LLM Prompt
        ↓
Draft Reply + Citations



## What I Would Do With More Time

If I had more time to take QuickDesk beyond the assessment requirements and make it more production-ready, I would focus on the following improvements:

### 1. Production Deployment

- Dockerize the frontend and backend
- Add CI/CD using GitHub Actions
- Deploy the frontend and backend separately
- Use a managed PostgreSQL database
- Add proper production environment configuration

### 2. Database Migrations

Replace the current database table creation approach with **Alembic migrations** so that database schema changes can be version-controlled and safely applied across different environments.

### 3. Better WebSocket Reliability

The current WebSocket manager works well for a single backend instance. For a production deployment with multiple backend instances, I would introduce **Redis Pub/Sub** so real-time events can be shared across instances.

I would also add:

- Automatic reconnection
- Connection status handling
- Event synchronization after reconnecting

### 4. Automated Testing

I would add a comprehensive test suite covering:

- Authentication
- Employee and agent RBAC
- Ticket CRUD operations
- Ticket ownership checks
- AI classification validation
- RAG retrieval
- Reply and resolution workflow
- WebSocket events
- Metrics

### 5. AI Evaluation and Monitoring

I would create an evaluation dataset to measure:

- Category classification accuracy
- Priority classification accuracy
- RAG retrieval quality
- Citation correctness
- AI draft response quality

I would also monitor:

- LLM latency
- LLM failures
- Token usage
- AI response quality
- Retrieval failures

### 6. Improved RAG System

As the knowledge base grows, I would improve the RAG pipeline with:

- Better document metadata
- Improved chunking strategies
- Metadata filtering
- Reranking
- Persistent vector storage
- Retrieval-quality evaluation

### 7. Production Security

I would strengthen security by adding:

- HttpOnly and Secure cookies instead of LocalStorage for JWT storage
- CSRF protection where applicable
- API rate limiting
- Stronger secret management
- Security headers
- More restrictive CORS configuration
- Improved input validation

### 8. Real File Uploads

The current implementation stores only the attachment filename.

For a production system, I would add secure file uploads using object storage along with:

- File type validation
- File size limits
- Malware scanning
- Access control
- Secure download URLs

### 9. Better Observability

I would add structured logging and monitoring for:

- API errors
- Request latency
- Database performance
- WebSocket connections
- LLM failures
- RAG retrieval performance
- Ticket resolution metrics

### 10. Better AI Fallbacks

If the LLM provider becomes unavailable, the application should continue functioning normally for core ticket operations.

I would add:

- LLM timeout handling
- Retry mechanisms
- Fallback responses
- Optional secondary LLM provider
- Clear indication when AI assistance is unavailable

The goal would be to make AI an enhancement to the helpdesk workflow rather than a dependency for basic ticket management.


## Known Issues / Limitations

- The application is currently designed primarily for local development and assessment/demo purposes rather than production deployment.
- JWTs are currently stored in browser LocalStorage. A production implementation would preferably use secure HttpOnly cookies.
- WebSocket connections are maintained in-process and are not currently designed for multiple backend instances.
- If a WebSocket connection disconnects, real-time events may be missed until the client reconnects or refreshes the data.
- The knowledge base is intentionally small and only covers a limited set of internal support topics.
- FAISS is currently used as the local vector store and is not designed for a large distributed production environment.
- Actual file uploads are not implemented; the application currently stores only the attachment filename.
- AI classification depends on the availability of the configured LLM provider.
- LLM-generated classifications and draft replies may still be incorrect, so human agent review is required.
- RAG response quality depends on the quality and coverage of the knowledge base.
- The current database setup does not yet use a full migration workflow such as Alembic.
- Automated test coverage can be expanded further.
- Production-level monitoring, rate limiting, and distributed infrastructure are not currently implemented.
- The current implementation is not optimized for horizontal scaling of WebSocket connections.
- The application does not currently include a secondary LLM provider if the primary provider becomes unavailable.