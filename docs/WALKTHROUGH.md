# Closira — Developer Setup Walkthrough

Everything you need to go from zero to a running instance of the app.

---

## 1. Install Required Software

### Python 3.11

Open: https://www.python.org/downloads/

Download **Python 3.11** (not 3.12+, Celery has known issues there).

During install:
- ☑ **Add Python to PATH** (checkbox at the bottom of the installer)

Verify:
```
python --version
# Python 3.11.x
```

---

### Node.js (LTS)

Open: https://nodejs.org/

Download **LTS** (currently 20.x or 22.x).

Verify:
```
node -v
npm -v
```

---

### Docker Desktop (for Redis on Windows)

Open: https://www.docker.com/products/docker-desktop/

Install and open Docker Desktop.  
Wait for the whale icon in the taskbar to stop animating — that means Docker is ready.

Verify:
```
docker ps
```
(Should show an empty table, no errors.)

---

### PostgreSQL

Open: https://www.postgresql.org/download/

Install with the following settings:

| Setting   | Value      |
|-----------|------------|
| Database  | `closira`  |
| Username  | `postgres` |
| Password  | `postgres` |
| Port      | `5432`     |

After install, open **pgAdmin** or **psql** and create the database:
```sql
CREATE DATABASE closira;
```

Verify:
```
psql --version
psql -U postgres -c "\l"
```
You should see `closira` in the list.

---

### Redis (via Docker on Windows)

```
docker run -d --name closira-redis -p 6379:6379 redis:7-alpine
```

Verify:
```
docker exec closira-redis redis-cli ping
# PONG
```

On Mac/Linux you can instead use:
```
brew install redis && brew services start redis   # macOS
sudo apt install redis-server && sudo systemctl start redis   # Ubuntu
```

---

## 2. Clone Project

```
git clone https://github.com/<your-org>/closira.git
cd closira
```

---

## 3. Backend Setup

### Create virtual environment and install

```
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### Configure .env

```
copy .env.example .env   # Windows
cp .env.example .env     # Mac/Linux
```

Open `.env` and set:

```
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/closira
JWT_SECRET_KEY=pick-a-long-random-string-here
REDIS_URL=redis://localhost:6379/0
DEBUG=false
```

### Run migrations

```
alembic upgrade head
```

Expected output ends with:
```
INFO  [alembic.runtime.migration] Running upgrade  -> 001, Initial schema
```

### Start backend

```
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Verify

Open: http://localhost:8000/health

Expected response:
```json
{"status": "ok", "db": "connected"}
```

Open: http://localhost:8000/docs

You should see the Swagger UI with Auth, Enquiries, Escalations, and Follow-ups sections.

---

## 4. Start Redis

If using Docker (already started in step 1):
```
docker start closira-redis
```

Verify:
```
docker exec closira-redis redis-cli ping
# PONG
```

---

## 5. Start Celery Worker

In a **new terminal**, inside `backend/` with the venv active:

```
# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

celery -A app.celery_app worker --loglevel=info
```

Expected output includes:
```
[tasks]
  . app.tasks.enquiry_tasks.process_enquiry_task
    . app.tasks.enquiry_tasks.send_followup_task

    [*] Celery@<hostname> ready.
    ```

    Verify a task works:
    ```python
    # In a Python shell inside backend/
    from app.tasks.enquiry_tasks import send_followup_task
    send_followup_task.delay("test-id")
    # You should see the task received and processed in the Celery terminal.
    ```

    ---

    ## 6. Start Frontend

    ```
    cd ../frontend
    npm install
    npx expo start
    ```

    Scan the QR code with **Expo Go** on your phone, or press:
    - `w` for web browser
    - `a` for Android emulator
    - `i` for iOS simulator

    The app opens on the **Login** screen.

    ---

    ## 7. First Login

    ### Create an account

    1. Tap **Sign up** on the login screen.
    2. Enter your email and a password (minimum 8 characters).
    3. Tap **Create Account**.
    4. You are taken directly to the dashboard.

    ### Test an enquiry

    1. Tap the **+** (FAB) button on the Home tab.
    2. Fill in customer name, select channel, write a message.
    3. Tap **Submit**.
    4. The new lead appears in the Leads tab.

    ### Test escalation

    1. Go to **Escalations** tab — auto-escalated enquiries appear here.
    2. Tap **Resolve** on any item.
    3. It disappears from Escalations.

    ### Toggle theme

    Tap the **sun / moon icon** in the top-right header on any tab screen.  
    The navigation chrome (header + tab bar) switches between light and dark.  
    The preference is saved — it persists after closing and reopening the app.

    ---

    ## 8. Common Errors

    ### Port 8000 already in use
    ```
    # Find and kill the process
    netstat -aon | findstr :8000   # Windows
    lsof -i :8000 | grep LISTEN    # Mac/Linux

    # Then kill the PID shown
    taskkill /PID <PID> /F         # Windows
    kill -9 <PID>                  # Mac/Linux
    ```

    ### Database not connected
    - Make sure PostgreSQL is running: open pgAdmin or run `pg_ctl status`.
    - Verify the `DATABASE_URL` in `.env` matches your PostgreSQL credentials.
    - Re-run: `alembic upgrade head`

    ### Redis connection failed
    ```
    # Restart the Docker container
    docker restart closira-redis

    # Check it's running
    docker ps | findstr redis
    ```

    ### Migration already applied / conflict
    ```
    alembic downgrade base
    alembic upgrade head
    ```

    ### Celery worker offline (tasks queued but not processed)
    - Ensure Redis is running (step 4).
    - Ensure the Celery worker is running in its own terminal (step 5).
    - Check the worker logs for import errors.
    - Follow-up notifications fail silently — the HTTP response still succeeds.

    ### Expo: "Network request failed"
    - Backend must be running on the same network as your device.
    - The app auto-derives the backend IP from the Expo dev server host.
    - If on a different network, edit `frontend/constants/config.ts` and hardcode your machine's local IP:
    ```ts
    export const API_BASE_URL = 'http://192.168.x.x:8000';
    ```

    ---

    ## Folder Tree (after upgrade)

    ```
    closira/
    ├── backend/
    │   ├── app/
    │   │   ├── api/routes/
    │   │   │   ├── auth.py          ← NEW: signup/login/refresh
    │   │   │   ├── enquiry.py
    │   │   │   ├── escalation.py
    │   │   │   ├── followup.py      ← MODIFIED: Celery task dispatch
    │   │   │   └── health.py
    │   │   ├── core/
    │   │   │   ├── config.py        ← MODIFIED: JWT + Redis settings
    │   │   │   ├── database.py      ← MODIFIED: PostgreSQL, no SQLite args
    │   │   │   ├── deps.py          ← NEW: get_current_user dependency
    │   │   │   ├── logging.py
    │   │   │   └── security.py      ← NEW: JWT + bcrypt helpers
    │   │   ├── models/
    │   │   │   ├── enquiry.py
    │   │   │   ├── enquiry_event.py
    │   │   │   └── user.py          ← NEW: User model
    │   │   ├── schemas/
    │   │   │   └── auth.py          ← NEW: auth request/response schemas
    │   │   ├── services/
    │   │   ├── tasks/
    │   │   │   └── enquiry_tasks.py ← NEW: Celery tasks
    │   │   ├── workers/
    │   │   │   └── enquiry_processor.py  ← MODIFIED: delegates to Celery
    │   │   ├── celery_app.py        ← NEW: Celery instance
    │   │   └── main.py              ← MODIFIED: auth router, protected routes
    │   ├── alembic/
    │   │   ├── env.py               ← MODIFIED: URL from settings
    │   │   └── versions/
    │   │       └── 001_initial_schema.py  ← NEW
    │   ├── .env.example             ← MODIFIED
    │   ├── alembic.ini              ← MODIFIED
    │   └── requirements.txt         ← MODIFIED: psycopg2, jose, passlib, celery, redis
    │
    ├── frontend/
    │   ├── api/
    │   │   ├── authApi.ts           ← NEW: login/signup/refresh helpers
    │   │   └── closiraApi.ts        ← MODIFIED: Bearer token header
    │   ├── app/
    │   │   ├── (auth)/
    │   │   │   ├── _layout.tsx      ← NEW
    │   │   │   ├── login.tsx        ← NEW
    │   │   │   ├── signup.tsx       ← NEW
    │   │   │   └── forgot-password.tsx  ← NEW
    │   │   ├── (tabs)/
    │   │   │   └── _layout.tsx      ← MODIFIED: theme toggle in header
    │   │   └── _layout.tsx          ← MODIFIED: AuthProvider + ThemeProvider
    │   ├── constants/
    │   │   └── theme.ts             ← MODIFIED: lightColors + ColorPalette type
    │   ├── context/
    │   │   ├── AuthContext.tsx      ← NEW: JWT token persistence
    │   │   └── ThemeContext.tsx     ← NEW: light/dark/system with AsyncStorage
    │   └── package.json             ← MODIFIED: async-storage added
    │
    └── docs/
        └── WALKTHROUGH.md           ← THIS FILE
        ```
        