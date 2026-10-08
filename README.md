# 1. What This Is

QuickDesk is an AI-assisted internal helpdesk application that allows employees to create and track support tickets while enabling support agents to manage, classify, respond to, and resolve those tickets. When a ticket is created, an LLM suggests its category and priority, while a Retrieval-Augmented Generation (RAG) pipeline uses a knowledge base to generate a grounded draft response for the agent. Agents remain in control by reviewing or overriding AI classifications, editing AI-generated replies, and sending the final response. The system also includes JWT authentication, role-based access control, audit logging, real-time updates through WebSockets, and agent-level metrics.

# 2. How to Run Locally

QuickDesk can be run in two ways:

- **Option A : Manual Local Setup:** Run PostgreSQL, FastAPI, and React separately.
- **Option B : Docker Setup:** Run PostgreSQL, backend, and frontend together using Docker Compose.

---

## Option A : Manual Local Setup

Follow these steps to run QuickDesk directly on your machine for development.

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd quickDesk
```

### 2. Create the Python environment

Create a Conda environment using Python 3.11:

```bash
conda create -n quickdesk python=3.11
```

Activate it:

```bash
conda activate quickdesk
```

If you are using VS Code, select the newly created `quickdesk` environment as the Python interpreter.

**VS Code:**

`Ctrl + Shift + P` → `Python: Select Interpreter` → Select `quickdesk`.

### 3. Install backend dependencies

Go to the backend directory:

```bash
cd backend
```

Install the required Python packages:

```bash
pip install -r requirements.txt
```

### 4. Set up PostgreSQL

QuickDesk requires a running PostgreSQL server.

Install PostgreSQL if it is not already installed, then:

1. Start/create a PostgreSQL server instance.
2. Create a database named:

```text
quickdesk
```

3. Note your PostgreSQL:
   - Host
   - Port
   - Username
   - Password
   - Database name

The default development configuration used by QuickDesk is:

```text
Host: localhost
Port: 5433
Database: quickdesk
User: postgres
```

If your PostgreSQL server uses a different port, username, or password, update the `DATABASE_URL` accordingly.

Example:

```text
postgresql+psycopg://postgres:YOUR_PASSWORD@localhost:5433/quickdesk
```

### 5. Configure environment variables

Create a `.env` file inside the backend directory:

```text
backend/.env
```

Use `.env.example` as a reference.

Example:

```env
APP_NAME=QuickDesk
ENVIRONMENT=development
DATABASE_URL=postgresql+psycopg://postgres:YOUR_PASSWORD@localhost:5433/quickdesk
JWT_SECRET_KEY=your_secret_key
GROQ_API_KEY=your_groq_api_key
```

If you want email notifications locally, also configure:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your_email
EMAIL_PASSWORD=your_google_app_password
EMAIL_FROM=your_email
```

> Never commit `.env` or any real API keys, passwords, or secrets to GitHub.

### 6. Seed the database

Make sure you are inside the `backend` directory:

```bash
python seed.py
```

The seed script:

- Creates the required database tables.
- Creates the demo employee and agent accounts.
- Loads the knowledge-base articles.
- Can be safely used to initialize a fresh development database.

### 7. Start the backend

From the `backend` directory:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The backend will be available at:

```text
http://127.0.0.1:8000
```

FastAPI Swagger documentation:

```text
http://127.0.0.1:8000/docs
```

Health check:

```text
http://127.0.0.1:8000/health
```

### 8. Start the frontend

Open a **new terminal**.

Go to the frontend directory:

```bash
cd quickDesk/frontend
```

Install the frontend dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

The frontend will be available at:

```text
http://localhost:5173
```

Open this URL in your browser.

### 9. Demo accounts

The seed script creates the following demo accounts:

**Employee**

```text
Email: employee@quickdesk.com
Password: Employee@123
```

**Agent**

```text
Email: agent@quickdesk.com
Password: Agent@123
```

---

## Option B : Docker Setup

Docker Compose allows you to run the complete QuickDesk application without manually setting up the backend environment or PostgreSQL server.

The Docker setup runs:

- PostgreSQL 16
- FastAPI backend
- React frontend with Nginx

### 1. Install Docker Desktop

Install and start Docker Desktop.

Make sure Docker is running before continuing.

### 2. Clone the repository

If you have not already cloned the repository:

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd quickDesk
```

### 3. Configure the Docker environment

Create a `.env` file in the **project root**:

```text
quickDesk/.env
```

Example:

```env
POSTGRES_PASSWORD=your_postgres_password
JWT_SECRET_KEY=your_secret_key
GROQ_API_KEY=your_groq_api_key
EMAIL_USERNAME=your_email
EMAIL_PASSWORD=your_google_app_password
EMAIL_FROM=your_email
```

Use `.env.example` as a reference.

> The root `.env` is used by Docker Compose. Do not commit it to GitHub.

### 4. Build and start the application

From the project root:

```bash
docker compose up --build
```

Docker will:

1. Build the QuickDesk backend image.
2. Build the QuickDesk frontend image.
3. Pull the official PostgreSQL image.
4. Create the PostgreSQL container.
5. Start the FastAPI backend.
6. Start the React frontend through Nginx.

No separate PostgreSQL installation is required when using this approach.

### 5. Access QuickDesk

Once all containers are running, open:

```text
http://localhost
```

The frontend is served through Nginx on port `80`.

The backend API is available at:

```text
http://localhost:8000
```

Swagger API documentation:

```text
http://localhost:8000/docs
```

Health check:

```text
http://localhost:8000/health
```

### 6. Seed the Docker database

After the containers are running, open a **new terminal** in the project root and run:

```bash
docker compose exec backend python seed.py
```

This initializes the Docker PostgreSQL database with:

- Demo employee account
- Demo agent account
- Knowledge-base articles

### 7. Demo accounts

Use the same seeded accounts:

**Employee**

```text
Email: employee@quickdesk.com
Password: Employee@123
```

**Agent**

```text
Email: agent@quickdesk.com
Password: Agent@123
```

### 8. Stop the application

To stop the containers:

```bash
docker compose down
```

The PostgreSQL data is stored in a Docker volume and will persist when the containers are stopped.

To start the application again:

```bash
docker compose up
```

You only need `--build` again when you make changes that require rebuilding the Docker images.

---

## Quick Start

### Manual Setup

**Terminal 1 : Backend**

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd quickDesk

conda create -n quickdesk python=3.11
conda activate quickdesk

cd backend
pip install -r requirements.txt

# Configure backend/.env
# Set up PostgreSQL and create the quickdesk database

python seed.py

uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Terminal 2 : Frontend**

```bash
cd quickDesk/frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

### Docker Setup

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd quickDesk

# Create and configure the root .env file

docker compose up --build
```

Then initialize the database from another terminal:

```bash
docker compose exec backend python seed.py
```

Open:

```text
http://localhost
```

**For the interview/demo, the Docker approach is the quickest way to run the complete application.**

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

# 5. Authentication

QuickDesk uses **JWT (JSON Web Token) authentication** for securing authenticated API requests.

After a successful login, the backend returns a JWT token. The frontend stores the token and includes it in subsequent authenticated API requests using the `Authorization` header.

### Authorization Header

```http
Authorization: Bearer <JWT_TOKEN>
```

### Authentication Flow

1. The user logs in using:

```http
POST /auth/login
```

2. The backend validates the user's email and password.

3. If the credentials are valid, the backend generates and returns a JWT containing the user's identity and role.

4. The frontend stores the JWT and sends it with authenticated requests.

5. The backend validates the token before allowing access to protected endpoints.

6. The user's role is checked before accessing role-specific functionality.

### Role-Based Access Control

QuickDesk has two roles:

- **Employee**
- **Agent**

Backend authorization is enforced using the authenticated user's role.

**Employees can:**
- Create tickets
- View their own tickets
- Edit their own open tickets
- Delete their own open tickets

**Agents can:**
- View all tickets
- Filter and search tickets
- Review and override AI classifications
- Generate and edit AI-assisted replies
- Reply to and resolve tickets
- View audit logs
- Access agent metrics

Role restrictions are enforced on the **backend**, not only through frontend UI restrictions. Unauthorized users receive an appropriate HTTP error response.

### JWT Example

```http
POST /auth/login
Content-Type: application/json

{
  "email": "agent@quickdesk.com",
  "password": "Agent@123"
}
```

The returned JWT is then used for protected requests:

```http
GET /auth/me
Authorization: Bearer <JWT_TOKEN>
```

The same authentication mechanism is also used to secure the WebSocket connections for agent and employee real-time updates.



# 6. Decisions and Tradeoffs

### a) Why did you pick this frontend framework?

Honestly, I don't have much professional frontend experience. I had previously created some websites using AI with React, so I already had a basic familiarity with React. Since QuickDesk is mainly a dashboard application and did not require server-side rendering or SEO, I decided to use **React with Vite**.

### b) How did you structure the RAG pipeline? Chunk size, embedding model, retriever, prompt?

I kept the RAG pipeline simple because the knowledge base is small.

The Markdown knowledge-base articles are first split into chunks using `RecursiveCharacterTextSplitter` with a **chunk size of 500** and **100 characters of overlap**.

For embeddings, I used:

```text
sentence-transformers/all-MiniLM-L6-v2
```

The embeddings are stored in a **FAISS** vector store. When an agent opens a ticket, the system retrieves the **top 3 relevant chunks** based on similarity.

These retrieved chunks are then passed to the LLM with a prompt that tells it to only use the provided knowledge-base information. If there is no relevant article, the system tells the agent that no relevant knowledge-base article was found instead of allowing the model to make up an answer.

![RAG pipeline](docs/RAGpipeline.png)

### c) How did you handle the case where the LLM returns a category that does not match your allowed list?

I don't directly trust the LLM output.

The backend validates the returned category and priority against the allowed values. If the category is invalid, it falls back to **`Other`**. If the priority is invalid, it falls back to **`Medium`**.

This prevents an unexpected LLM response from breaking the ticket workflow or storing invalid values in the database.

### d) Where did you store the JWT on the client, and why?

I stored the JWT in **browser LocalStorage**.

I chose this because it was simple to implement and also made it easy to reuse the same token for both REST API requests and WebSocket authentication.

For a production application, I would prefer a more secure approach such as **HttpOnly and Secure cookies**, along with the required CSRF protection.

### e) How did you enforce role-based access on the backend? What stops an employee from hitting an agent-only endpoint by guessing the URL?

Role-based access is enforced on the backend.

When a request comes in, the backend first validates the JWT and gets the current user. Then the endpoint checks the user's role before allowing access.

For example, an employee trying to access an agent-only endpoint such as:

```http
GET /metrics/
```

will be rejected by the backend with **403 Forbidden**, even if they manually guess or type the URL.

I also added ownership checks for employee ticket operations, so an employee cannot edit or delete another employee's ticket.

### f) Why did you pick WebSockets for real-time? What is the failure mode if the socket disconnects mid-session?

I chose **WebSockets** because QuickDesk needs two-way real-time communication.

For example:

- When an employee creates a ticket, connected agents receive the new ticket without refreshing.
- When an agent resolves a ticket, the employee receives the update without refreshing.

The current implementation uses the database as the source of truth. If the WebSocket disconnects, the user may miss an event while they are disconnected, but the ticket itself is still safely stored in PostgreSQL.

For a production version, I would add automatic reconnection and a way to synchronize missed events after reconnecting. For multiple backend instances, I would also consider something like **Redis Pub/Sub**.

### g) What is the worst failure mode in your system today, and what would you do to address it?

The biggest failure mode is an **incorrect or unavailable AI response**.

The LLM could return an imperfect classification, fail to respond, or generate a draft that is not useful.

I tried to reduce this risk by validating AI classifications, grounding the reply generation with the knowledge base, and keeping the agent in control of the final response.

For a production system, I would add **timeouts, retries, better AI evaluation, monitoring, confidence scores, and possibly a secondary LLM provider**. Most importantly, the system should still allow the agent to handle the ticket when AI is unavailable.

### h) Where did AI tools help you most? Where did they hurt or mislead you?

I mainly used AI as a supporting tool during development. I designed the overall **architecture, backend flow, database structure, API design, authentication, RAG flow, WebSocket flow, and business logic** myself.

AI helped me mostly with **frontend development and Docker**, where I had less experience. I also used it occasionally to understand errors or find better implementation approaches.

The main issue was that AI could sometimes make assumptions or suggest code that did not exactly match my existing implementation. So I had to verify and adjust those parts myself.

Overall, I used AI to **speed up development, not to design the entire application for me**.


For **“What I Would Do With More Time”**, I agree that we should make the focus much more **AI Engineer-oriented**. The current list is too infrastructure-heavy for the role.

I would write it like this:

# 7. What I Would Do With More Time

If I had more time, I would mainly focus on improving the **AI side of QuickDesk** and making it more reliable for a production environment.

- **Improve RAG quality:** Experiment with better chunking strategies, metadata filtering, reranking, and different embedding models to improve retrieval accuracy.
- **AI evaluation:** Create a proper evaluation dataset for ticket classification and AI-generated replies and measure accuracy, relevance, and hallucination rate.
- **Confidence scoring:** Add confidence scores for AI category, priority, and generated responses so agents can understand when the AI is uncertain.
- **Better LLM handling:** Add timeouts, retries, fallback responses, and a secondary LLM provider if the primary provider is unavailable.
- **Improve prompt engineering:** Test and optimize prompts for classification and response generation based on real ticket examples.
- **AI monitoring:** Track AI performance, incorrect classifications, agent overrides, response quality, and other useful AI metrics.
- **Human feedback loop:** Use agent overrides and feedback to identify common AI mistakes and improve the prompts or models over time.
- **Fine-tuning:** If enough real ticket data becomes available, explore fine-tuning a smaller model for ticket classification and other repetitive tasks.
- **Agentic AI:** Extend QuickDesk with controlled AI agents that can perform simple support actions using approved tools while keeping human approval for important actions.
- **Production AI infrastructure:** Move the local FAISS setup to a persistent vector database and improve scalability and observability.

I would also improve the **security, automated testing, deployment, and WebSocket reliability** before putting the system into production.

# 8. Known Issues / Limitations

- **AI output can be imperfect:** LLM-generated classifications and replies may occasionally be incorrect or incomplete. Human review is therefore still required before sending a response.

- **Small knowledge base:** The current RAG system uses a limited set of Markdown knowledge-base articles, so its response quality depends on the available documentation.

- **Local FAISS vector store:** The current vector store is suitable for this project but is not designed for large-scale or distributed production workloads.

- **LLM dependency:** AI features depend on the availability and performance of the configured LLM provider.

- **JWT in LocalStorage:** The frontend currently stores JWT tokens in LocalStorage for simplicity. A production implementation would use a more secure approach such as HttpOnly and Secure cookies.

- **WebSocket reliability:** The current WebSocket implementation runs in-process. If a client disconnects, it may miss real-time events while disconnected. A production system would need reconnection and event synchronization.

- **Email delivery:** Email notifications depend on the configured SMTP provider and credentials. If the email service is unavailable, the ticket itself is still resolved and stored in the database.

- **Attachment handling:** The current implementation stores only the attachment filename rather than uploading and storing the actual file.

- **Limited automated testing:** The core flows have been tested manually, but a larger automated test suite would be needed for production.

- **No distributed infrastructure:** The current setup is designed for local/demo use and is not yet optimized for horizontal scaling, distributed WebSockets, or high traffic.

- **No AI evaluation pipeline:** The current system does not yet have a dedicated evaluation framework for measuring classification accuracy, RAG retrieval quality, hallucination rate, or generated-response quality.

- **No secondary AI provider:** If the configured LLM provider becomes unavailable, the AI features do not currently switch automatically to another provider.