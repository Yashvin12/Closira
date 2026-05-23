# Closira — CRM Enquiry Management System

A full-stack application for managing customer enquiries with automated SOP matching, escalation workflows, and follow-up scheduling.

**Backend**: Python 3.11+ · FastAPI · SQLAlchemy · SQLite · Alembic  
**Frontend**: React Native · Expo SDK 56 · Expo Router · TypeScript

---

## Quick Start

### Prerequisites

- Python 3.11+ with `pip`
- Node.js 18+ with `npm`
- Expo Go app (iOS/Android) or an emulator

### Backend

```bash
cd backend

# Create and activate virtual environment (recommended)
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Run the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API is now available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start Expo dev server
npx expo start
```

Scan the QR code with Expo Go (iOS/Android) or press `w` for web.

### Run Tests

```bash
cd backend
python -m pytest tests/ -v --tb=short
```

---

## Database Schema

```sql
-- enquiries table
CREATE TABLE enquiries (
    id                  TEXT PRIMARY KEY,                    -- UUID4
    channel             TEXT NOT NULL,                       -- 'whatsapp' | 'email' | 'call'
    customer_name       TEXT NOT NULL,                       -- VARCHAR(255)
    message             TEXT NOT NULL,                       -- Full message body
    status              TEXT NOT NULL DEFAULT 'new',         -- 'new' | 'qualified' | 'escalated' | 'followed_up' | 'resolved'
    sop_matched         TEXT,                                -- Name of matched SOP (nullable)
    suggested_response  TEXT,                                -- AI-generated response (nullable)
    escalation_reason   TEXT,                                -- Reason for escalation (nullable)
    created_at          DATETIME NOT NULL,                   -- UTC timestamp
    updated_at          DATETIME NOT NULL                    -- UTC timestamp
);

-- enquiry_events table (timeline)
CREATE TABLE enquiry_events (
    id                  TEXT PRIMARY KEY,                    -- UUID4
    enquiry_id          TEXT NOT NULL REFERENCES enquiries(id),
    event_type          TEXT NOT NULL,                       -- 'created' | 'sop_matched' | 'qualified' | 'escalated' | 'followup_scheduled' | 'resolved'
    detail              TEXT,                                -- JSON metadata string (nullable)
    created_at          DATETIME NOT NULL                    -- UTC timestamp
);

CREATE INDEX idx_enquiry_events_enquiry_id ON enquiry_events(enquiry_id);
```

---

## API Endpoints

| Method | Path | Status | Description |
|--------|------|--------|-------------|
| `POST` | `/enquiry` | 202 | Create enquiry, fire SOP matching in background |
| `POST` | `/enquiry/{id}/followup` | 200 | Schedule follow-up (delay_minutes ≥ 1) |
| `POST` | `/enquiry/{id}/escalate` | 200/409 | Escalate enquiry (idempotent guard) |
| `GET` | `/enquiry/{id}/history` | 200 | Full record + structured timeline |
| `GET` | `/health` | 200/503 | DB connectivity health check |

---

## Architecture Decisions

### BackgroundTasks vs Celery

We chose FastAPI's built-in `BackgroundTasks` over Celery for 3 concrete reasons:

1. **SQLite doesn't support concurrent writes well.** Celery workers would create multiple processes competing for write locks on the same SQLite file. `BackgroundTasks` runs in the same process, avoiding lock contention entirely.

2. **The SOP matching is CPU-trivial.** It's a keyword substring check on a lowercased string — microseconds of work. Celery's overhead (Redis/RabbitMQ broker, serialization, worker management) is wildly disproportionate to the actual computation.

3. **Zero infrastructure dependency.** No Redis, no RabbitMQ, no separate worker process. The application is fully self-contained — `pip install` and `uvicorn` is all you need. This is appropriate for an intern assignment and early-stage products where operational simplicity matters.

**When to migrate to Celery:** If the SOP matcher is replaced with an LLM API call (seconds of latency), if PostgreSQL replaces SQLite (proper concurrent writes), or if horizontal scaling is needed.

### NativeWind v4 vs StyleSheet

The UI/UX Pro Max skill file specifies semantic color tokens, consistent spacing rhythms, and platform-native design patterns. We used `StyleSheet` objects throughout because:

1. **Design tokens require computed values.** The skill file mandates 4/8dp spacing, semantic colors, and shadow presets — all stored in `theme.ts` as typed constants. StyleSheet allows direct reference to these tokens (`spacing.lg`, `colors.primary`) with full type safety. NativeWind's Tailwind classes would require maintaining a parallel `tailwind.config.js` that mirrors `theme.ts`, creating a single-source-of-truth violation.

2. **Platform-specific shadows.** iOS uses `shadowColor/shadowOffset/shadowOpacity/shadowRadius` while Android uses `elevation`. StyleSheet handles this natively. NativeWind v4's shadow support on native is limited and requires workarounds.

3. **Animation integration.** The spec requires fade animations (FollowUpCard), LayoutAnimation (EscalationCard), and opacity-based press feedback. These require `Animated.View` and `StyleSheet` — NativeWind classes can't drive runtime animated values.

**NativeWind was installed** as specified in the requirements and is available for future use, but StyleSheet provides better alignment with the skill file's design system requirements.

---

## SOP Matching Logic

Five SOPs defined in `services/sop_matcher.py`:

| SOP Name | Keywords | Trigger Example |
|----------|----------|-----------------|
| Pricing Inquiry | price, pricing, cost, rate, fee, charge, quote | "What are your pricing plans?" |
| Booking & Appointment | book, booking, appointment, schedule, reserve | "I want to book an appointment" |
| Complaint Resolution | complaint, issue, problem, unhappy, broken, refund | "I have a complaint about my order" |
| Product Information | feature, product, service, detail, specification, demo | "Can you send the product spec?" |
| Partnership & Collaboration | partner, partnership, collaborate, wholesale, reseller | "We're interested in becoming a reseller" |

**Matching algorithm:** Lowercase the message → iterate SOPs in order → check if any keyword is a substring → first match wins → no match → auto-escalate with "No SOP matched — requires manual review".

---

## Frontend Screens

### 1. Dashboard
2×2 stat grid (Total Leads, Missed Enquiries, Open Escalations, Follow-ups Due) + Recent Activity list + quick-action navigation buttons.

### 2. Leads
FlatList with 3 filter pills (All / New / Escalated). Each card shows channel badge, customer name, message preview (1 line), relative time, and status pill. Tap opens Conversation Detail.

### 3. Escalations
FlatList of active escalations with urgency dot (red=high, amber=medium), reason text, and Resolve button. LayoutAnimation on card removal. Shield icon empty state.

### 4. Follow-ups
Task list with due time formatting ("Today, 2:30 PM"), Mark Done button that crosses out the name, fades the card (300ms), then removes it after 400ms.

### 5. Conversation Detail
Message bubbles (customer=grey left, AI=indigo right), SOP Matched info box, AI Summary box, escalation reason box (if applicable), and a vertical status timeline with colored dots and timestamps.

---

## Project Structure

```
closira/
├── backend/
│   ├── app/
│   │   ├── api/routes/        # enquiry, followup, escalation, health
│   │   ├── core/              # config, logging (JSON), database
│   │   ├── models/            # Enquiry, EnquiryEvent (SQLAlchemy)
│   │   ├── schemas/           # Pydantic v2 request/response models
│   │   ├── services/          # sop_matcher, enquiry_service
│   │   ├── workers/           # enquiry_processor (BackgroundTasks)
│   │   └── main.py            # App factory, exception handlers
│   ├── tests/                 # 17 tests covering all endpoints
│   ├── alembic/               # Migration infrastructure
│   ├── requirements.txt
│   ├── .env.example
│   └── docker-compose.yml
├── frontend/
│   ├── app/                   # Expo Router file-based routing
│   │   ├── (tabs)/            # Dashboard, Leads, Escalations, Follow-ups
│   │   └── conversation/      # [id].tsx detail screen
│   ├── components/
│   │   ├── ui/                # ChannelBadge, StatusPill, UrgencyDot, EmptyState
│   │   └── cards/             # StatCard, LeadCard, EscalationCard, FollowUpCard
│   ├── constants/theme.ts     # ALL design tokens
│   ├── mock/                  # 8 enquiries, 4 escalations, 5 follow-ups
│   └── hooks/useMockData.ts   # Typed data hook with mutations
└── README.md
```

---

## Trade-offs & Limitations

| Decision | Trade-off | Mitigation |
|----------|-----------|------------|
| SQLite | No concurrent writes, no replication | Adequate for single-server demo; swap to PostgreSQL via `DATABASE_URL` env var |
| BackgroundTasks | Runs in-process, no retry/DLQ | Task is CPU-trivial; for production LLM calls, migrate to Celery + Redis |
| Mock data (frontend) | No real API integration | `useMockData` hook has same interface as a future `useAPIData` hook |
| No authentication | All endpoints are public | Add FastAPI security dependencies for production |
| No rate limiting | Endpoints can be spammed | Add `slowapi` or API gateway rate limiting |
| No pagination | Lists return all items | Add `skip`/`limit` query params when data volume grows |
| LayoutAnimation (Android) | Requires experimental flag | `UIManager.setLayoutAnimationEnabledExperimental(true)` set in escalations screen |
| No dark mode | Light theme only | Dark mode tokens defined in theme.ts; implementation is additive |
| No i18n | English only | All user-facing strings are co-located and extractable |
| follow-up delay is recorded but not executed | No scheduler for actual delayed sending | Would need APScheduler, Celery beat, or a cron system for real delayed execution |

---

## Logging

Every log line is a valid JSON object:

```json
{
  "timestamp": "2025-01-15T10:30:00.000Z",
  "level": "INFO",
  "event": "enquiry_created",
  "enquiry_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "detail": "Channel: whatsapp, Customer: Sarah Mitchell"
}
```

No `print()` statements anywhere. All output goes through the structured JSON logger.

---

## Testing

17 test cases covering:

- **Health**: DB connectivity returns 200
- **Enquiry**: Create (202), channel validation (422), missing fields (422), empty name (422)
- **History**: Structured response with timeline, 404 for missing ID
- **Escalation**: Success (200), idempotent guard (409), empty reason (422), 404
- **Follow-up**: Success (200), with template, invalid delay (422), 404

```
========================= 17 passed in 1.07s ==========================
```

---

## License

MIT
