import { useEffect, useState } from "react";

/*
=========================================================
QUICKDESK FRONTEND
Backend:
http://127.0.0.1:8000

Authentication:
Authorization: Bearer <JWT>

Roles:
employee
agent
=========================================================
*/

const API_BASE_URL = "http://localhost:8000";


/* =====================================================
   API HELPER
===================================================== */

async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("quickdesk_token");

  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const detail = data?.detail;

    if (Array.isArray(detail)) {
      const message = detail
        .map((item) => item.msg)
        .join(", ");

      throw new Error(message);
    }

    throw new Error(
      detail ||
        data?.message ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
}


/* =====================================================
   HELPERS
===================================================== */

function getTicketArray(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.tickets)) {
    return data.tickets;
  }

  return [];
}


/*
Backend ticket detail:

{
  "ticket": {...},
  "ai_draft_reply": "...",
  "citations": [],
  "audit_logs": []
}
*/

function normalizeTicketDetail(data) {
  const ticket = data?.ticket || {};

  return {
    ...ticket,

    ai_draft_reply:
      data?.ai_draft_reply ??
      ticket?.ai_draft_reply ??
      "",

    citations:
      data?.citations || [],

    audit_logs:
      data?.audit_logs || [],
  };
}


/* =====================================================
   COMMON UI
===================================================== */

function Loading({ text = "Loading..." }) {
  return (
    <div style={styles.loading}>
      <div style={styles.spinner} />
      <span>{text}</span>
    </div>
  );
}

function ErrorMessage({ children }) {
  if (!children) return null;

  return (
    <div style={styles.errorBox}>
      {children}
    </div>
  );
}

function SuccessMessage({ children }) {
  if (!children) return null;

  return (
    <div style={styles.successBox}>
      {children}
    </div>
  );
}

function StatusBadge({ status }) {
  const resolved = status === "Resolved";

  return (
    <span
      style={{
        ...styles.statusBadge,
        ...(resolved
          ? styles.resolvedBadge
          : styles.openBadge),
      }}
    >
      {status}
    </span>
  );
}


/* =====================================================
   LOGIN
   POST /auth/login
   GET  /auth/me
===================================================== */

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      /*
      POST /auth/login

      Input:
      {
        email,
        password
      }

      Output:
      {
        access_token,
        token_type
      }
      */

      const loginResponse = await apiRequest(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      localStorage.setItem(
        "quickdesk_token",
        loginResponse.access_token
      );

      /*
      GET /auth/me

      Output:
      {
        id,
        name,
        email,
        role,
        ...
      }
      */

      const user = await apiRequest(
        "/auth/me"
      );

      onLogin(user);
    } catch (err) {
      setError(err.message);

      localStorage.removeItem(
        "quickdesk_token"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.loginPage}>
      <div style={styles.loginCard}>
        <div style={styles.loginBrand}>
          <div style={styles.logo}>
            Q
          </div>

          <div>
            <h1 style={styles.logoText}>
              QuickDesk
            </h1>

            <p style={styles.muted}>
              AI-Assisted Helpdesk
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={styles.label}>
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            placeholder="Enter email"
            required
            style={styles.input}
          />

          <label style={styles.label}>
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            placeholder="Enter password"
            required
            style={styles.input}
          />

          <ErrorMessage>
            {error}
          </ErrorMessage>

          <button
            type="submit"
            disabled={loading}
            style={styles.primaryButton}
          >
            {loading
              ? "Signing in..."
              : "Sign In"}
          </button>
        </form>

        <div style={styles.demoBox}>
          <strong>
            Development Demo Accounts
          </strong>

          <div style={styles.demoAccount}>
            <strong>Employee</strong>
            <div>
              employee@quickdesk.com
            </div>
            <div>
              Employee@123
            </div>
          </div>

          <div style={styles.demoAccount}>
            <strong>Agent</strong>
            <div>
              agent@quickdesk.com
            </div>
            <div>
              Agent@123
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


/* =====================================================
   NAVBAR
===================================================== */

function Navbar({
  user,
  realtimeConnected,
  onLogout,
}) {
  return (
    <header style={styles.navbar}>
      <div style={styles.navbarInner}>
        <div style={styles.brandRow}>
          <div style={styles.navLogo}>
            Q
          </div>

          <strong style={styles.navTitle}>
            QuickDesk
          </strong>
        </div>

        <div style={styles.navRight}>
          <div style={styles.liveStatus}>
            <span
              style={{
                ...styles.liveDot,
                background:
                  realtimeConnected
                    ? "#12b76a"
                    : "#f79009",
              }}
            />

            {realtimeConnected
              ? "Live"
              : "Offline"}
          </div>

          <div style={styles.userBlock}>
            <strong>
              {user.name}
            </strong>

            <span>
              {user.role}
            </span>
          </div>

          <button
            onClick={onLogout}
            style={styles.logoutButton}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}


/* =====================================================
   EMPLOYEE
   POST /tickets/
===================================================== */

function CreateTicket({
  onCreated,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] =
    useState("");
  const [
    attachmentFilename,
    setAttachmentFilename,
  ] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] =
    useState("");

  const [createdTicket, setCreatedTicket] =
    useState(null);

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");
    setCreatedTicket(null);

    try {
      /*
      POST /tickets/

      Input:
      {
        title,
        description,
        attachment_filename
      }

      Output:
      TicketResponse
      */

      const ticket = await apiRequest(
        "/tickets/",
        {
          method: "POST",
          body: JSON.stringify({
            title: title.trim(),
            description:
              description.trim(),
            attachment_filename:
              attachmentFilename.trim() ||
              null,
          }),
        }
      );

      setCreatedTicket(ticket);

      setSuccess(
        "Ticket created successfully."
      );

      setTitle("");
      setDescription("");
      setAttachmentFilename("");

      onCreated(ticket);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.card}>
      <h2 style={styles.sectionTitle}>
        Create New Ticket
      </h2>

      <p style={styles.muted}>
        Submit your issue and AI will
        automatically suggest a category
        and priority.
      </p>

      <form onSubmit={handleSubmit}>
        <label style={styles.label}>
          Title
        </label>

        <input
          value={title}
          onChange={(e) =>
            setTitle(e.target.value)
          }
          placeholder="Example: Laptop WiFi not working"
          required
          style={styles.input}
        />

        <label style={styles.label}>
          Description
        </label>

        <textarea
          value={description}
          onChange={(e) =>
            setDescription(
              e.target.value
            )
          }
          placeholder="Describe your problem..."
          rows={7}
          required
          style={styles.textarea}
        />

        <label style={styles.label}>
          Attachment Filename
          <span style={styles.optional}>
            {" "}
            (optional)
          </span>
        </label>

        <input
          value={attachmentFilename}
          onChange={(e) =>
            setAttachmentFilename(
              e.target.value
            )
          }
          placeholder="screenshot.png"
          style={styles.input}
        />

        <ErrorMessage>
          {error}
        </ErrorMessage>

        <SuccessMessage>
          {success}
        </SuccessMessage>

        <button
          type="submit"
          disabled={loading}
          style={styles.primaryButton}
        >
          {loading
            ? "Creating..."
            : "Submit Ticket"}
        </button>
      </form>

      {createdTicket && (
        <div style={styles.aiBox}>
          <h3 style={styles.aiTitle}>
            ✨ AI Classification
          </h3>

          <div style={styles.twoColumns}>
            <div style={styles.infoCard}>
              <span style={styles.smallLabel}>
                AI Suggested Category
              </span>

              <strong>
                {createdTicket.ai_category ||
                  createdTicket.category}
              </strong>
            </div>

            <div style={styles.infoCard}>
              <span style={styles.smallLabel}>
                AI Suggested Priority
              </span>

              <strong>
                {createdTicket.ai_priority ||
                  createdTicket.priority}
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


/* =====================================================
   EMPLOYEE TICKET CARD
===================================================== */

function EmployeeTicketCard({
  ticket,
  onEdit,
  onDelete,
}) {
  const open =
    ticket.status === "Open";

  return (
    <div style={styles.ticketCard}>
      <div style={styles.ticketHeader}>
        <div style={{ flex: 1 }}>
          <div style={styles.titleStatusRow}>
            <h3 style={styles.ticketTitle}>
              {ticket.title}
            </h3>

            <StatusBadge
              status={ticket.status}
            />
          </div>

          <p style={styles.ticketDescription}>
            {ticket.description}
          </p>
        </div>
      </div>

      <div style={styles.ticketMeta}>
        <span>
          Category:{" "}
          <strong>
            {ticket.category}
          </strong>
        </span>

        <span>
          Priority:{" "}
          <strong>
            {ticket.priority}
          </strong>
        </span>

        {ticket.attachment_filename && (
          <span>
            Attachment:{" "}
            <strong>
              {ticket.attachment_filename}
            </strong>
          </span>
        )}
      </div>

      <div style={styles.ticketBottom}>
        <span style={styles.dateText}>
          {ticket.created_at
            ? new Date(
                ticket.created_at
              ).toLocaleString()
            : "-"}
        </span>

        {open && (
          <div style={styles.buttonRow}>
            <button
              onClick={() =>
                onEdit(ticket)
              }
              style={styles.secondaryButton}
            >
              Edit
            </button>

            <button
              onClick={() =>
                onDelete(ticket.id)
              }
              style={styles.dangerButton}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {ticket.final_reply && (
        <div style={styles.replyBox}>
          <strong>
            Agent Reply
          </strong>

          <p>
            {ticket.final_reply}
          </p>
        </div>
      )}
    </div>
  );
}


/* =====================================================
   EMPLOYEE EDIT
   PATCH /tickets/{id}
===================================================== */

function EditTicketModal({
  ticket,
  onClose,
  onUpdated,
}) {
  const [title, setTitle] =
    useState(ticket.title);

  const [description, setDescription] =
    useState(ticket.description);

  const [
    attachmentFilename,
    setAttachmentFilename,
  ] = useState(
    ticket.attachment_filename || ""
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      /*
      PATCH /tickets/{ticket_id}

      Input:
      {
        title,
        description,
        attachment_filename
      }

      Output:
      Updated Ticket
      */

      const updated =
        await apiRequest(
          `/tickets/${ticket.id}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              title: title.trim(),
              description:
                description.trim(),
              attachment_filename:
                attachmentFilename.trim() ||
                null,
            }),
          }
        );

      onUpdated(updated);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <div>
            <h2>
              Edit Ticket
            </h2>

            <p style={styles.muted}>
              Only your Open tickets can be
              edited.
            </p>
          </div>

          <button
            onClick={onClose}
            style={styles.closeButton}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={styles.label}>
            Title
          </label>

          <input
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            required
            style={styles.input}
          />

          <label style={styles.label}>
            Description
          </label>

          <textarea
            value={description}
            onChange={(e) =>
              setDescription(
                e.target.value
              )
            }
            rows={6}
            required
            style={styles.textarea}
          />

          <label style={styles.label}>
            Attachment Filename
          </label>

          <input
            value={attachmentFilename}
            onChange={(e) =>
              setAttachmentFilename(
                e.target.value
              )
            }
            style={styles.input}
          />

          <ErrorMessage>
            {error}
          </ErrorMessage>

          <div style={styles.modalActions}>
            <button
              type="button"
              onClick={onClose}
              style={styles.secondaryButton}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              style={styles.primaryButtonSmall}
            >
              {loading
                ? "Saving..."
                : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


/* =====================================================
   EMPLOYEE DASHBOARD

   GET /tickets/my

   WebSocket:
   /ws/employee/{employee_id}?token=JWT
===================================================== */

function EmployeeDashboard({
  user,
  onRealtimeChange,
}) {
  const [tickets, setTickets] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [editingTicket, setEditingTicket] =
    useState(null);

  async function loadTickets() {
    setLoading(true);
    setError("");

    try {
      /*
      GET /tickets/my

      Output:
      [
        Ticket,
        Ticket,
        ...
      ]
      */

      const data =
        await apiRequest(
          "/tickets/my"
        );

      setTickets(
        getTicketArray(data)
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTickets();
  }, []);

  /*
  Employee WebSocket.

  Server event:

  {
    "event": "ticket_resolved",
    "ticket": {
      "id": 12,
      "status": "Resolved",
      "final_reply": "...",
      "resolved_at": "..."
    }
  }
  */

  useEffect(() => {
    const token =
      localStorage.getItem(
        "quickdesk_token"
      );

    if (!token || !user?.id) {
      return;
    }

    let socket = null;
    let reconnectTimer = null;
    let stopped = false;

    function connect() {
      if (stopped) return;

      socket = new WebSocket(
        `ws://127.0.0.1:8000/ws/employee/${user.id}?token=${encodeURIComponent(
          token
        )}`
      );

      socket.onopen = () => {
        onRealtimeChange(true);
      };

      socket.onmessage = (event) => {
        try {
          const message =
            JSON.parse(event.data);

          if (
            message.event ===
            "ticket_resolved"
          ) {
            const updated =
              message.ticket;

            setTickets((current) =>
              current.map((ticket) =>
                ticket.id === updated.id
                  ? {
                      ...ticket,
                      status:
                        updated.status,
                      final_reply:
                        updated.final_reply,
                      resolved_at:
                        updated.resolved_at,
                    }
                  : ticket
              )
            );
          }
        } catch {
          // Ignore invalid WebSocket messages.
        }
      };

      socket.onclose = () => {
        onRealtimeChange(false);

        if (!stopped) {
          reconnectTimer =
            setTimeout(
              connect,
              3000
            );
        }
      };

      socket.onerror = () => {
        onRealtimeChange(false);
      };
    }

    connect();

    return () => {
      stopped = true;

      if (reconnectTimer) {
        clearTimeout(
          reconnectTimer
        );
      }

      if (socket) {
        socket.close();
      }

      onRealtimeChange(false);
    };
  }, [user.id]);

  function handleCreated(ticket) {
    setTickets((current) => [
      ticket,
      ...current,
    ]);
  }

  function handleUpdated(ticket) {
    setTickets((current) =>
      current.map((item) =>
        item.id === ticket.id
          ? ticket
          : item
      )
    );
  }

  async function handleDelete(id) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this ticket?"
      );

    if (!confirmed) {
      return;
    }

    try {
      /*
      DELETE /tickets/{ticket_id}

      No request body.
      */

      await apiRequest(
        `/tickets/${id}`,
        {
          method: "DELETE",
        }
      );

      setTickets((current) =>
        current.filter(
          (ticket) =>
            ticket.id !== id
        )
      );
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div style={styles.dashboard}>
      <div style={styles.dashboardHeader}>
        <div>
          <h1 style={styles.dashboardTitle}>
            Employee Dashboard
          </h1>

          <p style={styles.muted}>
            Welcome, {user.name}
          </p>
        </div>

        <span style={styles.roleBadge}>
          Employee
        </span>
      </div>

      <div style={styles.employeeGrid}>
        <CreateTicket
          onCreated={handleCreated}
        />

        <div style={styles.card}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                My Tickets
              </h2>

              <p style={styles.muted}>
                Only your tickets are shown.
              </p>
            </div>

            <span style={styles.countBadge}>
              {tickets.length}
            </span>
          </div>

          {loading && (
            <Loading text="Loading tickets..." />
          )}

          <ErrorMessage>
            {error}
          </ErrorMessage>

          {!loading &&
            !error &&
            tickets.length === 0 && (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>
                  🎫
                </div>

                <h3>
                  No tickets yet
                </h3>

                <p style={styles.muted}>
                  Create your first support
                  ticket.
                </p>
              </div>
            )}

          {!loading &&
            tickets.map((ticket) => (
              <EmployeeTicketCard
                key={ticket.id}
                ticket={ticket}
                onEdit={
                  setEditingTicket
                }
                onDelete={
                  handleDelete
                }
              />
            ))}
        </div>
      </div>

      {editingTicket && (
        <EditTicketModal
          ticket={editingTicket}
          onClose={() =>
            setEditingTicket(null)
          }
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
}


/* =====================================================
   AGENT FILTERS

   GET /tickets/agent/all

   Query params:
   status_filter
   category_filter
   priority_filter
   search
===================================================== */

function AgentFilters({
  status,
  setStatus,
  category,
  setCategory,
  priority,
  setPriority,
  search,
  setSearch,
}) {
  function clear() {
    setStatus("");
    setCategory("");
    setPriority("");
    setSearch("");
  }

  return (
    <div style={styles.filters}>
      <div>
        <label style={styles.filterLabel}>
          Search
        </label>

        <input
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Search title..."
          style={styles.filterInput}
        />
      </div>

      <div>
        <label style={styles.filterLabel}>
          Status
        </label>

        <select
          value={status}
          onChange={(e) =>
            setStatus(e.target.value)
          }
          style={styles.filterInput}
        >
          <option value="">
            All Statuses
          </option>

          <option value="Open">
            Open
          </option>

          <option value="Resolved">
            Resolved
          </option>
        </select>
      </div>

      <div>
        <label style={styles.filterLabel}>
          Category
        </label>

        <select
          value={category}
          onChange={(e) =>
            setCategory(e.target.value)
          }
          style={styles.filterInput}
        >
          <option value="">
            All Categories
          </option>

          <option value="IT">
            IT
          </option>

          <option value="HR">
            HR
          </option>

          <option value="Finance">
            Finance
          </option>

          <option value="Admin">
            Admin
          </option>

          <option value="Other">
            Other
          </option>
        </select>
      </div>

      <div>
        <label style={styles.filterLabel}>
          Priority
        </label>

        <select
          value={priority}
          onChange={(e) =>
            setPriority(e.target.value)
          }
          style={styles.filterInput}
        >
          <option value="">
            All Priorities
          </option>

          <option value="Low">
            Low
          </option>

          <option value="Medium">
            Medium
          </option>

          <option value="High">
            High
          </option>
        </select>
      </div>

      <button
        onClick={clear}
        style={styles.secondaryButton}
      >
        Clear
      </button>
    </div>
  );
}


/* =====================================================
   AGENT TICKET LIST
===================================================== */

function AgentTicketList({
  tickets,
  selected,
  onSelect,
  loading,
  error,
}) {
  return (
    <div style={styles.agentList}>
      {loading && (
        <Loading text="Loading tickets..." />
      )}

      <ErrorMessage>
        {error}
      </ErrorMessage>

      {!loading &&
        !error &&
        tickets.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              📭
            </div>

            <h3>
              No tickets found
            </h3>

            <p style={styles.muted}>
              Try changing the filters.
            </p>
          </div>
        )}

      {!loading &&
        tickets.map((ticket) => (
          <button
            key={ticket.id}
            onClick={() =>
              onSelect(ticket)
            }
            style={{
              ...styles.agentTicket,
              ...(selected?.id ===
              ticket.id
                ? styles.selectedAgentTicket
                : {}),
            }}
          >
            <div
              style={
                styles.agentTicketHeader
              }
            >
              <strong>
                {ticket.title}
              </strong>

              <StatusBadge
                status={ticket.status}
              />
            </div>

            <div
              style={
                styles.agentTicketMeta
              }
            >
              {ticket.category} •{" "}
              {ticket.priority}
            </div>

            <div style={styles.dateText}>
              {ticket.created_at
                ? new Date(
                    ticket.created_at
                  ).toLocaleString()
                : "-"}
            </div>
          </button>
        ))}
    </div>
  );
}


/* =====================================================
   AGENT TICKET DETAIL

   GET /tickets/{id}

   PATCH /tickets/{id}/override

   POST /tickets/{id}/reply
===================================================== */

function AgentTicketDetail({
  selectedTicket,
  onChanged,
}) {
  const [detail, setDetail] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [category, setCategory] =
    useState("");

  const [priority, setPriority] =
    useState("");

  const [reply, setReply] =
    useState("");

  const [savingClassification, setSavingClassification] =
    useState(false);

  const [sendingReply, setSendingReply] =
    useState(false);

  async function loadDetail() {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      /*
      GET /tickets/{ticket_id}

      ACTUAL backend response:

      {
        ticket: {...},
        ai_draft_reply: "...",
        citations: [],
        audit_logs: []
      }
      */

      const data =
        await apiRequest(
          `/tickets/${selectedTicket.id}`
        );

      const normalized =
        normalizeTicketDetail(data);

      setDetail(normalized);

      setCategory(
        normalized.category || "Other"
      );

      setPriority(
        normalized.priority || "Medium"
      );

      setReply(
        normalized.ai_draft_reply || ""
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDetail();
  }, [selectedTicket.id]);

  async function handleSaveClassification() {
    setSavingClassification(true);
    setError("");
    setSuccess("");

    try {
      /*
      PATCH /tickets/{ticket_id}/override

      Input:
      {
        category,
        priority
      }
      */

      await apiRequest(
        `/tickets/${selectedTicket.id}/override`,
        {
          method: "PATCH",
          body: JSON.stringify({
            category,
            priority,
          }),
        }
      );

      /*
      Backend response shape is not relied upon here.
      We reload the actual ticket detail after the
      successful PATCH.
      */

      await loadDetail();

      setSuccess(
        "Classification updated successfully."
      );

      onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingClassification(false);
    }
  }

  async function handleSendReply() {
    if (!reply.trim()) {
      setError(
        "Reply cannot be empty."
      );

      return;
    }

    setSendingReply(true);
    setError("");
    setSuccess("");

    try {
      /*
      IMPORTANT:

      POST /tickets/{ticket_id}/reply

      Backend expects:

      {
        "reply": "..."
      }

      NOT:

      {
        "final_reply": "..."
      }
      */

      await apiRequest(
        `/tickets/${selectedTicket.id}/reply`,
        {
          method: "POST",
          body: JSON.stringify({
            reply: reply.trim(),
          }),
        }
      );

      /*
      Reload actual backend response after
      successful resolution.
      */

      await loadDetail();

      setSuccess(
        "Reply sent successfully. Ticket resolved."
      );

      onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setSendingReply(false);
    }
  }

  if (loading) {
    return (
      <div style={styles.detailCard}>
        <Loading text="Loading ticket..." />
      </div>
    );
  }

  if (!detail) {
    return (
      <div style={styles.detailCard}>
        <ErrorMessage>
          {error ||
            "Unable to load ticket."}
        </ErrorMessage>
      </div>
    );
  }

  const resolved =
    detail.status === "Resolved";

  /*
  IMPORTANT:

  Current backend returns employee_id,
  not employee name/email.
  */

  return (
    <div style={styles.detailCard}>
      <div style={styles.detailHeader}>
        <div>
          <span style={styles.detailId}>
            Ticket #{detail.id}
          </span>

          <h2 style={styles.detailTitle}>
            {detail.title}
          </h2>

          <p style={styles.muted}>
            Created{" "}
            {detail.created_at
              ? new Date(
                  detail.created_at
                ).toLocaleString()
              : "-"}
          </p>
        </div>

        <StatusBadge
          status={detail.status}
        />
      </div>

      <ErrorMessage>
        {error}
      </ErrorMessage>

      <SuccessMessage>
        {success}
      </SuccessMessage>

      {/* EMPLOYEE */}

      <section style={styles.detailSection}>
        <h3 style={styles.detailHeading}>
          Employee
        </h3>

        <div style={styles.employeeInfo}>
          <div style={styles.avatar}>
            #
          </div>

          <div>
            <strong>
              Employee ID:{" "}
              {detail.employee_id}
            </strong>

            <p style={styles.muted}>
              The current ticket-detail API
              returns employee_id only.
            </p>
          </div>
        </div>
      </section>

      {/* ISSUE */}

      <section style={styles.detailSection}>
        <h3 style={styles.detailHeading}>
          Issue
        </h3>

        <div style={styles.issueBox}>
          <p style={styles.detailDescription}>
            {detail.description}
          </p>

          {detail.attachment_filename && (
            <div
              style={
                styles.attachment
              }
            >
              📎{" "}
              {detail.attachment_filename}
            </div>
          )}
        </div>
      </section>

      {/* AI CLASSIFICATION */}

      <section style={styles.detailSection}>
        <div style={styles.sectionHeader}>
          <div>
            <h3 style={styles.detailHeading}>
              AI Classification
            </h3>

            <p style={styles.muted}>
              Original AI suggestions and
              current agent classification.
            </p>
          </div>

          <span style={styles.aiTag}>
            AI
          </span>
        </div>

        <div style={styles.classificationGrid}>
          <div style={styles.infoCard}>
            <span style={styles.smallLabel}>
              AI Suggested Category
            </span>

            <strong>
              {detail.ai_category ||
                "-"}
            </strong>
          </div>

          <div style={styles.infoCard}>
            <span style={styles.smallLabel}>
              AI Suggested Priority
            </span>

            <strong>
              {detail.ai_priority ||
                "-"}
            </strong>
          </div>

          <div style={styles.infoCard}>
            <span style={styles.smallLabel}>
              Current Category
            </span>

            <strong>
              {detail.category ||
                "-"}
            </strong>
          </div>

          <div style={styles.infoCard}>
            <span style={styles.smallLabel}>
              Current Priority
            </span>

            <strong>
              {detail.priority ||
                "-"}
            </strong>
          </div>
        </div>

        {!resolved && (
          <>
            <div style={styles.twoColumns}>
              <div>
                <label style={styles.label}>
                  Agent Category
                </label>

                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(
                      e.target.value
                    )
                  }
                  style={styles.input}
                >
                  <option value="IT">
                    IT
                  </option>

                  <option value="HR">
                    HR
                  </option>

                  <option value="Finance">
                    Finance
                  </option>

                  <option value="Admin">
                    Admin
                  </option>

                  <option value="Other">
                    Other
                  </option>
                </select>
              </div>

              <div>
                <label style={styles.label}>
                  Agent Priority
                </label>

                <select
                  value={priority}
                  onChange={(e) =>
                    setPriority(
                      e.target.value
                    )
                  }
                  style={styles.input}
                >
                  <option value="Low">
                    Low
                  </option>

                  <option value="Medium">
                    Medium
                  </option>

                  <option value="High">
                    High
                  </option>
                </select>
              </div>
            </div>

            <button
              onClick={
                handleSaveClassification
              }
              disabled={
                savingClassification
              }
              style={styles.secondaryButton}
            >
              {savingClassification
                ? "Saving..."
                : "Save Classification"}
            </button>
          </>
        )}
      </section>

      {/* AI DRAFT */}

      <section style={styles.detailSection}>
        <div style={styles.sectionHeader}>
          <div>
            <h3 style={styles.detailHeading}>
              AI Draft Reply
            </h3>

            <p style={styles.muted}>
              You can edit the AI-generated
              draft before sending.
            </p>
          </div>

          <span style={styles.aiTag}>
            RAG
          </span>
        </div>

        <textarea
          value={reply}
          onChange={(e) =>
            setReply(e.target.value)
          }
          disabled={resolved}
          rows={9}
          placeholder="AI draft reply..."
          style={styles.replyTextarea}
        />

        {!resolved && (
          <button
            onClick={handleSendReply}
            disabled={sendingReply}
            style={styles.primaryButton}
          >
            {sendingReply
              ? "Sending..."
              : "Send Reply & Resolve"}
          </button>
        )}
      </section>

      {/* CITATIONS */}

      <section style={styles.detailSection}>
        <h3 style={styles.detailHeading}>
          Knowledge Base Citations
        </h3>

        <p style={styles.muted}>
          Knowledge base articles returned
          by the RAG service.
        </p>

        {detail.citations?.length > 0 ? (
          detail.citations.map(
            (citation, index) => (
              <div
                key={
                  citation.id ||
                  citation.source ||
                  index
                }
                style={styles.citation}
              >
                <div style={styles.citationIcon}>
                  📚
                </div>

                <div>
                  <strong>
                    {citation.title ||
                      citation.source ||
                      `KB Article ${
                        index + 1
                      }`}
                  </strong>

                  {citation.source && (
                    <div
                      style={
                        styles.citationSource
                      }
                    >
                      {citation.source}
                    </div>
                  )}
                </div>
              </div>
            )
          )
        ) : (
          <div style={styles.infoBox}>
            No relevant knowledge base
            article was found.
          </div>
        )}
      </section>

      {/* AUDIT LOG */}

      <section style={styles.detailSection}>
        <h3 style={styles.detailHeading}>
          Override Audit History
        </h3>

        <p style={styles.muted}>
          Changes made by agents to AI
          classification.
        </p>

        {detail.audit_logs?.length > 0 ? (
          detail.audit_logs.map(
            (log, index) => (
              <div
                key={
                  log.id || index
                }
                style={styles.auditItem}
              >
                <div>
                  <strong>
                    {log.field}
                  </strong>
                </div>

                <div>
                  <span
                    style={styles.oldValue}
                  >
                    {log.old_value}
                  </span>

                  <span
                    style={styles.arrow}
                  >
                    →
                  </span>

                  <span
                    style={styles.newValue}
                  >
                    {log.new_value}
                  </span>
                </div>

                <div
                  style={styles.dateText}
                >
                  {log.created_at
                    ? new Date(
                        log.created_at
                      ).toLocaleString()
                    : "-"}
                </div>
              </div>
            )
          )
        ) : (
          <div style={styles.infoBox}>
            No overrides recorded.
          </div>
        )}
      </section>

      {/* FINAL REPLY */}

      {detail.final_reply && (
        <section style={styles.detailSection}>
          <h3 style={styles.detailHeading}>
            Final Reply
          </h3>

          <div style={styles.finalReply}>
            <strong>
              Sent to employee
            </strong>

            <p>
              {detail.final_reply}
            </p>
          </div>
        </section>
      )}

      {detail.resolved_at && (
        <div style={styles.resolvedInfo}>
          <strong>
            Resolved
          </strong>

          <span>
            {new Date(
              detail.resolved_at
            ).toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}


/* =====================================================
   METRICS

   GET /metrics/
===================================================== */

function MetricsPanel() {
  const [metrics, setMetrics] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadMetrics() {
    setLoading(true);
    setError("");

    try {
      /*
      GET /metrics/

      Output:

      {
        tickets_by_status,
        tickets_by_category,
        median_resolution_time_minutes,
        ai_category_override_percentage
      }
      */

      const data =
        await apiRequest(
          "/metrics/"
        );

      setMetrics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMetrics();
  }, []);

  if (loading) {
    return (
      <div style={styles.card}>
        <Loading text="Loading metrics..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.card}>
        <ErrorMessage>
          {error}
        </ErrorMessage>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  const statuses =
    metrics.tickets_by_status || {};

  const categories =
    metrics.tickets_by_category || {};

  const total =
    (statuses.open || 0) +
    (statuses.resolved || 0);

  return (
    <div style={styles.card}>
      <div style={styles.sectionHeader}>
        <div>
          <h2 style={styles.sectionTitle}>
            Support Metrics
          </h2>

          <p style={styles.muted}>
            Agent-only metrics.
          </p>
        </div>

        <button
          onClick={loadMetrics}
          style={styles.secondaryButton}
        >
          Refresh
        </button>
      </div>

      <div style={styles.metricsGrid}>
        <div style={styles.metric}>
          <span>Total Tickets</span>
          <strong>
            {total}
          </strong>
        </div>

        <div style={styles.metric}>
          <span>Open</span>
          <strong>
            {statuses.open || 0}
          </strong>
        </div>

        <div style={styles.metric}>
          <span>Resolved</span>
          <strong>
            {statuses.resolved || 0}
          </strong>
        </div>

        <div style={styles.metric}>
          <span>
            Median Resolution
          </span>

          <strong>
            {Number(
              metrics.median_resolution_time_minutes ||
                0
            ).toFixed(1)}
            <small>
              {" "}
              min
            </small>
          </strong>
        </div>

        <div style={styles.metric}>
          <span>
            AI Category Override
          </span>

          <strong>
            {Number(
              metrics.ai_category_override_percentage ||
                0
            ).toFixed(1)}
            %
          </strong>
        </div>
      </div>

      <h3 style={{ marginTop: "25px" }}>
        Tickets by Category
      </h3>

      <div style={styles.categoryGrid}>
        {[
          "IT",
          "HR",
          "Finance",
          "Admin",
          "Other",
        ].map((category) => (
          <div
            key={category}
            style={styles.categoryMetric}
          >
            <span>
              {category}
            </span>

            <strong>
              {categories[
                category
              ] || 0}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}


/* =====================================================
   AGENT DASHBOARD

   GET /tickets/agent/all

   WebSocket:
   /ws/agent?token=JWT
===================================================== */

function AgentDashboard({
  user,
  onRealtimeChange,
}) {
  const [tickets, setTickets] =
    useState([]);

  const [selectedTicket, setSelectedTicket] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [category, setCategory] =
    useState("");

  const [priority, setPriority] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [refreshing, setRefreshing] =
    useState(false);

  async function loadTickets(
    isRefresh = false
  ) {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      /*
      GET /tickets/agent/all

      Query params:

      status_filter
      category_filter
      priority_filter
      search
      */

      const params =
        new URLSearchParams();

      if (status) {
        params.set(
          "status_filter",
          status
        );
      }

      if (category) {
        params.set(
          "category_filter",
          category
        );
      }

      if (priority) {
        params.set(
          "priority_filter",
          priority
        );
      }

      if (search.trim()) {
        params.set(
          "search",
          search.trim()
        );
      }

      const query =
        params.toString();

      const data =
        await apiRequest(
          `/tickets/agent/all${
            query
              ? `?${query}`
              : ""
          }`
        );

      const result =
        getTicketArray(data);

      setTickets(result);

      /*
      Keep currently selected ticket
      if it still exists.
      */

      if (selectedTicket) {
        const current =
          result.find(
            (item) =>
              item.id ===
              selectedTicket.id
          );

        if (current) {
          setSelectedTicket(current);
        } else {
          setSelectedTicket(null);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  /*
  Reload when filters change.
  */

  useEffect(() => {
    const timer =
      setTimeout(() => {
        loadTickets();
      }, 250);

    return () =>
      clearTimeout(timer);
  }, [
    status,
    category,
    priority,
    search,
  ]);

  /*
  Agent WebSocket.

  Server event:

  {
    "event": "ticket_created",
    "ticket": {...}
  }
  */

  useEffect(() => {
    const token =
      localStorage.getItem(
        "quickdesk_token"
      );

    if (!token) {
      return;
    }

    let socket = null;
    let reconnectTimer = null;
    let stopped = false;

    function connect() {
      if (stopped) return;

      socket = new WebSocket(
        `ws://127.0.0.1:8000/ws/agent?token=${encodeURIComponent(
          token
        )}`
      );

      socket.onopen = () => {
        onRealtimeChange(true);
      };

      socket.onmessage = (event) => {
        try {
          const message =
            JSON.parse(event.data);

          if (
            message.event ===
            "ticket_created"
          ) {
            const newTicket =
              message.ticket;

            setTickets((current) => {
              const alreadyExists =
                current.some(
                  (ticket) =>
                    ticket.id ===
                    newTicket.id
                );

              if (alreadyExists) {
                return current;
              }

              /*
              Respect active frontend filters.
              */

              if (
                status &&
                newTicket.status !==
                  status
              ) {
                return current;
              }

              if (
                category &&
                newTicket.category !==
                  category
              ) {
                return current;
              }

              if (
                priority &&
                newTicket.priority !==
                  priority
              ) {
                return current;
              }

              if (
                search.trim() &&
                !newTicket.title
                  ?.toLowerCase()
                  .includes(
                    search
                      .trim()
                      .toLowerCase()
                  )
              ) {
                return current;
              }

              return [
                newTicket,
                ...current,
              ];
            });
          }
        } catch {
          // Ignore invalid messages.
        }
      };

      socket.onclose = () => {
        onRealtimeChange(false);

        if (!stopped) {
          reconnectTimer =
            setTimeout(
              connect,
              3000
            );
        }
      };

      socket.onerror = () => {
        onRealtimeChange(false);
      };
    }

    connect();

    return () => {
      stopped = true;

      if (reconnectTimer) {
        clearTimeout(
          reconnectTimer
        );
      }

      if (socket) {
        socket.close();
      }

      onRealtimeChange(false);
    };
  }, [user.id]);

  async function handleDetailChanged() {
    await loadTickets(true);
  }

  return (
    <div style={styles.dashboard}>
      <div style={styles.dashboardHeader}>
        <div>
          <h1 style={styles.dashboardTitle}>
            Agent Dashboard
          </h1>

          <p style={styles.muted}>
            Manage and resolve support
            requests.
          </p>
        </div>

        <div style={styles.buttonRow}>
          <span style={styles.agentBadge}>
            Agent
          </span>

          <button
            onClick={() =>
              loadTickets(true)
            }
            style={styles.secondaryButton}
            disabled={refreshing}
          >
            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>
      </div>

      <MetricsPanel />

      <AgentFilters
        status={status}
        setStatus={setStatus}
        category={category}
        setCategory={setCategory}
        priority={priority}
        setPriority={setPriority}
        search={search}
        setSearch={setSearch}
      />

      <div style={styles.agentLayout}>
        <div style={styles.agentListCard}>
          <div style={styles.listHeader}>
            <h2 style={styles.sectionTitle}>
              All Tickets
            </h2>

            <p style={styles.muted}>
              {tickets.length} ticket
              {tickets.length !== 1
                ? "s"
                : ""}
            </p>
          </div>

          <AgentTicketList
            tickets={tickets}
            selected={
              selectedTicket
            }
            onSelect={
              setSelectedTicket
            }
            loading={loading}
            error={error}
          />
        </div>

        <div>
          {selectedTicket ? (
            <AgentTicketDetail
              selectedTicket={
                selectedTicket
              }
              onChanged={
                handleDetailChanged
              }
            />
          ) : (
            <div
              style={
                styles.selectTicket
              }
            >
              <div
                style={
                  styles.selectIcon
                }
              >
                🎫
              </div>

              <h2>
                Select a Ticket
              </h2>

              <p style={styles.muted}>
                Select a ticket from the
                list to view its complete
                details.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


/* =====================================================
   MAIN APP
===================================================== */

function App() {
  const [user, setUser] =
    useState(null);

  const [checkingAuth, setCheckingAuth] =
    useState(true);

  const [
    realtimeConnected,
    setRealtimeConnected,
  ] = useState(false);

  /*
  Restore JWT session.
  */

  useEffect(() => {
    async function restoreSession() {
      const token =
        localStorage.getItem(
          "quickdesk_token"
        );

      if (!token) {
        setCheckingAuth(false);
        return;
      }

      try {
        /*
        GET /auth/me
        */

        const currentUser =
          await apiRequest(
            "/auth/me"
          );

        setUser(currentUser);
      } catch {
        localStorage.removeItem(
          "quickdesk_token"
        );

        setUser(null);
      } finally {
        setCheckingAuth(false);
      }
    }

    restoreSession();
  }, []);

  function handleLogout() {
    localStorage.removeItem(
      "quickdesk_token"
    );

    setUser(null);
    setRealtimeConnected(false);
  }

  if (checkingAuth) {
    return (
      <div style={styles.loginPage}>
        <Loading text="Checking authentication..." />
      </div>
    );
  }

  if (!user) {
    return (
      <LoginPage
        onLogin={setUser}
      />
    );
  }

  return (
    <div style={styles.app}>
      <Navbar
        user={user}
        realtimeConnected={
          realtimeConnected
        }
        onLogout={handleLogout}
      />

      {user.role === "employee" && (
        <EmployeeDashboard
          user={user}
          onRealtimeChange={
            setRealtimeConnected
          }
        />
      )}

      {user.role === "agent" && (
        <AgentDashboard
          user={user}
          onRealtimeChange={
            setRealtimeConnected
          }
        />
      )}
    </div>
  );
}


/* =====================================================
   STYLES
===================================================== */

const styles = {
  app: {
    minHeight: "100vh",
    background: "#f5f7fb",
    color: "#101828",
    fontFamily:
      "Inter, Arial, sans-serif",
  },

  loginPage: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f5f7fb",
    fontFamily:
      "Inter, Arial, sans-serif",
  },

  loginCard: {
    width: "410px",
    maxWidth: "90%",
    background: "#fff",
    borderRadius: "16px",
    padding: "32px",
    boxShadow:
      "0 12px 35px rgba(16,24,40,.10)",
  },

  loginBrand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "28px",
  },

  logo: {
    width: "48px",
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#2563eb",
    color: "#fff",
    borderRadius: "12px",
    fontWeight: "800",
    fontSize: "24px",
  },

  logoText: {
    margin: 0,
    fontSize: "28px",
  },

  navbar: {
    background: "#fff",
    borderBottom:
      "1px solid #eaecf0",
    position: "sticky",
    top: 0,
    zIndex: 50,
  },

  navbarInner: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "13px 20px",
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
  },

  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  navLogo: {
    width: "35px",
    height: "35px",
    borderRadius: "9px",
    background: "#2563eb",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
  },

  navTitle: {
    fontSize: "20px",
  },

  navRight: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
  },

  liveStatus: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    color: "#667085",
  },

  liveDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
  },

  userBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    fontSize: "13px",
  },

  logoutButton: {
    padding: "8px 14px",
    border:
      "1px solid #d0d5dd",
    background: "#fff",
    borderRadius: "7px",
    cursor: "pointer",
  },

  dashboard: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "30px 20px 60px",
  },

  dashboardHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginBottom: "25px",
  },

  dashboardTitle: {
    margin: 0,
    fontSize: "28px",
  },

  employeeGrid: {
    display: "grid",
    gridTemplateColumns:
      "minmax(330px, .8fr) minmax(450px, 1.2fr)",
    gap: "25px",
    alignItems: "start",
  },

  card: {
    background: "#fff",
    borderRadius: "14px",
    padding: "24px",
    marginBottom: "25px",
    boxShadow:
      "0 4px 20px rgba(0,0,0,.05)",
  },

  sectionTitle: {
    marginTop: 0,
    marginBottom: "5px",
  },

  sectionHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "flex-start",
    gap: "15px",
    marginBottom: "18px",
  },

  muted: {
    color: "#667085",
    lineHeight: "1.5",
  },

  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: "600",
    marginTop: "17px",
    marginBottom: "7px",
  },

  optional: {
    color: "#98a2b3",
    fontWeight: "400",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 12px",
    border:
      "1px solid #d0d5dd",
    borderRadius: "8px",
    fontSize: "14px",
    background: "#fff",
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    border:
      "1px solid #d0d5dd",
    borderRadius: "8px",
    fontSize: "14px",
    resize: "vertical",
    fontFamily: "inherit",
  },

  primaryButton: {
    width: "100%",
    marginTop: "20px",
    padding: "12px 18px",
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
  },

  primaryButtonSmall: {
    padding: "10px 17px",
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
  },

  secondaryButton: {
    padding: "9px 14px",
    border:
      "1px solid #d0d5dd",
    borderRadius: "7px",
    background: "#fff",
    color: "#344054",
    cursor: "pointer",
    fontWeight: "500",
  },

  dangerButton: {
    padding: "9px 14px",
    border: "none",
    borderRadius: "7px",
    background: "#dc2626",
    color: "#fff",
    cursor: "pointer",
  },

  buttonRow: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },

  errorBox: {
    marginTop: "14px",
    padding: "11px 13px",
    borderRadius: "8px",
    background: "#fee2e2",
    color: "#991b1b",
    fontSize: "14px",
  },

  successBox: {
    marginTop: "14px",
    padding: "11px 13px",
    borderRadius: "8px",
    background: "#dcfce7",
    color: "#166534",
    fontSize: "14px",
  },

  infoBox: {
    padding: "12px 14px",
    background: "#f8fafc",
    borderRadius: "8px",
    color: "#475467",
    fontSize: "13px",
    lineHeight: "1.5",
  },

  demoBox: {
    marginTop: "25px",
    padding: "14px",
    borderRadius: "9px",
    background: "#f8fafc",
    fontSize: "13px",
  },

  demoAccount: {
    marginTop: "10px",
    paddingTop: "10px",
    borderTop:
      "1px solid #eaecf0",
    lineHeight: "1.5",
  },

  loading: {
    padding: "30px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
    color: "#667085",
  },

  spinner: {
    width: "16px",
    height: "16px",
    border:
      "2px solid #d0d5dd",
    borderTop:
      "2px solid #2563eb",
    borderRadius: "50%",
  },

  aiBox: {
    marginTop: "22px",
    padding: "17px",
    borderRadius: "10px",
    background: "#f5f3ff",
    border:
      "1px solid #ddd6fe",
  },

  aiTitle: {
    marginTop: 0,
    color: "#6d28d9",
  },

  twoColumns: {
    display: "grid",
    gridTemplateColumns:
      "1fr 1fr",
    gap: "14px",
  },

  infoCard: {
    padding: "14px",
    background: "#fff",
    border:
      "1px solid #eaecf0",
    borderRadius: "8px",
  },

  smallLabel: {
    display: "block",
    color: "#667085",
    fontSize: "12px",
    marginBottom: "5px",
  },

  ticketCard: {
    padding: "17px",
    border:
      "1px solid #eaecf0",
    borderRadius: "10px",
    marginBottom: "14px",
  },

  ticketHeader: {
    display: "flex",
    gap: "12px",
  },

  titleStatusRow: {
    display: "flex",
    justifyContent:
      "space-between",
    gap: "10px",
    alignItems: "flex-start",
  },

  ticketTitle: {
    margin: "0 0 8px",
    fontSize: "17px",
  },

  ticketDescription: {
    margin: 0,
    color: "#667085",
    lineHeight: "1.5",
    whiteSpace: "pre-wrap",
  },

  statusBadge: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },

  openBadge: {
    background: "#fff7ed",
    color: "#c2410c",
  },

  resolvedBadge: {
    background: "#ecfdf3",
    color: "#027a48",
  },

  ticketMeta: {
    display: "flex",
    flexWrap: "wrap",
    gap: "15px",
    marginTop: "16px",
    color: "#667085",
    fontSize: "13px",
  },

  ticketBottom: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: "10px",
    marginTop: "15px",
    paddingTop: "14px",
    borderTop:
      "1px solid #f2f4f7",
  },

  dateText: {
    color: "#98a2b3",
    fontSize: "12px",
  },

  replyBox: {
    marginTop: "14px",
    padding: "14px",
    background: "#f8fafc",
    borderLeft:
      "4px solid #2563eb",
    borderRadius: "7px",
  },

  countBadge: {
    minWidth: "30px",
    height: "30px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontWeight: "700",
  },

  roleBadge: {
    padding: "7px 12px",
    borderRadius: "20px",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontWeight: "600",
    fontSize: "13px",
  },

  agentBadge: {
    padding: "7px 12px",
    borderRadius: "20px",
    background: "#f5f3ff",
    color: "#6d28d9",
    fontWeight: "600",
    fontSize: "13px",
  },

  emptyState: {
    textAlign: "center",
    padding: "45px 20px",
    background: "#f8fafc",
    borderRadius: "10px",
  },

  emptyIcon: {
    fontSize: "32px",
  },

  /* MODAL */

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background:
      "rgba(0,0,0,.45)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    zIndex: 1000,
  },

  modal: {
    width: "600px",
    maxWidth: "100%",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#fff",
    borderRadius: "14px",
    padding: "25px",
  },

  modalHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "flex-start",
  },

  closeButton: {
    border: "none",
    background: "transparent",
    fontSize: "28px",
    color: "#667085",
    cursor: "pointer",
  },

  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "20px",
  },

  /* FILTERS */

  filters: {
    display: "grid",
    gridTemplateColumns:
      "2fr 1fr 1fr 1fr auto",
    gap: "14px",
    alignItems: "end",
    padding: "20px",
    background: "#fff",
    borderRadius: "14px",
    marginBottom: "25px",
    boxShadow:
      "0 4px 20px rgba(0,0,0,.05)",
  },

  filterLabel: {
    display: "block",
    fontSize: "13px",
    fontWeight: "600",
    marginBottom: "7px",
  },

  filterInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px",
    border:
      "1px solid #d0d5dd",
    borderRadius: "8px",
    background: "#fff",
  },

  /* AGENT */

  agentLayout: {
    display: "grid",
    gridTemplateColumns:
      "380px minmax(500px, 1fr)",
    gap: "25px",
    alignItems: "start",
  },

  agentListCard: {
    background: "#fff",
    borderRadius: "14px",
    overflow: "hidden",
    boxShadow:
      "0 4px 20px rgba(0,0,0,.05)",
  },

  listHeader: {
    padding: "20px",
    borderBottom:
      "1px solid #eaecf0",
  },

  agentList: {
    maxHeight: "750px",
    overflowY: "auto",
    padding: "10px",
  },

  agentTicket: {
    display: "block",
    width: "100%",
    textAlign: "left",
    background: "#fff",
    border:
      "1px solid #eaecf0",
    borderRadius: "9px",
    padding: "14px",
    marginBottom: "9px",
    cursor: "pointer",
  },

  selectedAgentTicket: {
    border:
      "2px solid #2563eb",
    background: "#eff6ff",
  },

  agentTicketHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    gap: "8px",
    alignItems: "flex-start",
  },

  agentTicketMeta: {
    marginTop: "9px",
    fontSize: "13px",
    color: "#667085",
  },

  detailCard: {
    background: "#fff",
    borderRadius: "14px",
    padding: "25px",
    boxShadow:
      "0 4px 20px rgba(0,0,0,.05)",
  },

  selectTicket: {
    background: "#fff",
    borderRadius: "14px",
    padding: "80px 30px",
    textAlign: "center",
    boxShadow:
      "0 4px 20px rgba(0,0,0,.05)",
  },

  selectIcon: {
    fontSize: "45px",
  },

  detailHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "flex-start",
    gap: "15px",
    paddingBottom: "20px",
    borderBottom:
      "1px solid #eaecf0",
  },

  detailId: {
    display: "block",
    color: "#667085",
    fontSize: "12px",
    marginBottom: "5px",
  },

  detailTitle: {
    margin: 0,
    fontSize: "23px",
  },

  detailSection: {
    padding: "22px 0",
    borderBottom:
      "1px solid #f2f4f7",
  },

  detailHeading: {
    marginTop: 0,
    marginBottom: "6px",
  },

  employeeInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  avatar: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "#eff6ff",
    color: "#1d4ed8",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "700",
  },

  issueBox: {
    padding: "15px",
    background: "#f8fafc",
    borderRadius: "8px",
  },

  detailDescription: {
    whiteSpace: "pre-wrap",
    lineHeight: "1.6",
    margin: 0,
    color: "#475467",
  },

  attachment: {
    marginTop: "12px",
    padding: "10px",
    background: "#fff",
    border:
      "1px solid #eaecf0",
    borderRadius: "7px",
    fontSize: "13px",
  },

  classificationGrid: {
    display: "grid",
    gridTemplateColumns:
      "1fr 1fr",
    gap: "12px",
    marginTop: "15px",
    marginBottom: "18px",
  },

  aiTag: {
    padding: "5px 10px",
    borderRadius: "20px",
    background: "#f5f3ff",
    color: "#6d28d9",
    fontSize: "11px",
    fontWeight: "700",
  },

  replyTextarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px",
    border:
      "1px solid #d0d5dd",
    borderRadius: "9px",
    fontFamily: "inherit",
    fontSize: "14px",
    lineHeight: "1.5",
    resize: "vertical",
  },

  citation: {
    display: "flex",
    gap: "10px",
    padding: "13px",
    marginBottom: "9px",
    background: "#f8fafc",
    border:
      "1px solid #eaecf0",
    borderRadius: "8px",
  },

  citationIcon: {
    fontSize: "18px",
  },

  citationSource: {
    marginTop: "4px",
    color: "#667085",
    fontSize: "12px",
  },

  auditItem: {
    display: "grid",
    gridTemplateColumns:
      "100px 1fr auto",
    gap: "15px",
    alignItems: "center",
    padding: "12px 0",
    borderBottom:
      "1px solid #f2f4f7",
    fontSize: "13px",
  },

  oldValue: {
    color: "#b42318",
  },

  arrow: {
    margin: "0 8px",
    color: "#98a2b3",
  },

  newValue: {
    color: "#027a48",
    fontWeight: "600",
  },

  finalReply: {
    padding: "15px",
    background: "#ecfdf3",
    border:
      "1px solid #abefc6",
    borderRadius: "9px",
    lineHeight: "1.6",
  },

  resolvedInfo: {
    display: "flex",
    justifyContent:
      "space-between",
    marginTop: "20px",
    padding: "14px",
    borderRadius: "8px",
    background: "#ecfdf3",
    color: "#027a48",
  },

  /* METRICS */

  metricsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(5, 1fr)",
    gap: "12px",
  },

  metric: {
    padding: "15px",
    background: "#f8fafc",
    border:
      "1px solid #eaecf0",
    borderRadius: "9px",
  },

  categoryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(5, 1fr)",
    gap: "10px",
  },

  categoryMetric: {
    display: "flex",
    justifyContent:
      "space-between",
    padding: "12px",
    border:
      "1px solid #eaecf0",
    borderRadius: "8px",
    background: "#fff",
  },
};

export default App;