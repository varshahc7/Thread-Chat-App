# Thread — private one-to-one messaging

Real-time private chat. **A message from Alice to Bob is delivered only to Bob, never to Charlie.**

## 1. Features
Registration/login (JWT + rotating refresh tokens), presence, typing indicators, sent/delivered/read status, offline delivery, user and message search, profiles, privacy settings, file/image sharing, light/dark theme, auto-reconnect with backoff, admin debug panel, raw TCP client support, Docker, tests.

## 2. Architecture
```
Browser ──WebSocket /ws──┐
                         ├─> handlers.py (shared session logic) ─> ConnectionManager ─> DB
CLI/TCP ──port 9000──────┘
Browser ──REST /api──> FastAPI routers ─> services ─> SQLAlchemy
```
- `backend/app/realtime/manager.py`: `user_id → connections`. `send_to_user` is the only routing primitive; there is no message broadcast.
- WebSocket and TCP share the same handlers. TCP frames are a 4-byte length prefix plus JSON.
- The first frame on either socket is `{"type":"auth","token":"..."}`.

## 3. Privacy model
Routing is recipient-specific. Conversations have a unique `pair_key` (`low:high`), the server looks up the recipient from the conversation, and only the sender's and recipient's sockets ever receive the event. Files are served only to the two participants. Read receipts and presence honour each user's privacy settings.

## 4. Stack
React 18, Vite, TypeScript, Tailwind, Zustand, React Query · FastAPI, SQLAlchemy, PostgreSQL (SQLite for dev) · JWT.

## 5. Run locally
Backend:
```
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
Frontend (second terminal):
```
cd frontend
npm install
npm run dev
```
Open http://localhost:5173. SQLite is the default, so no `.env` is needed. Set `ADMIN_USERNAMES=yourname` (env var or `.env`) to see the debug panel.

## 6. Run with Docker
```
cp .env.example .env   # set JWT_SECRET
docker compose up --build
```
App: http://localhost:3000 · API: :8000 · TCP: :9000.

## 7. Environment variables
See `.env.example`.

## 8. Tests
```
cd backend && pip install -r requirements.txt && pytest
```
Covers WebSocket and TCP privacy (including a split frame), sent→delivered→read, authorization, dedupe, uploads.

## 9. TCP client
```
cd backend
python scripts/tcp_client.py alice 'Passw0rd!'
python scripts/demo_private_message.py   # needs a running server
```

## 10. Wire protocol
Client → server: `auth`, `message_send`, `typing_start` / `typing`, `message_read`, `presence_update`, `ping`.
Server → client: `auth_ok`, `auth_error`, `message_ack`, `message_received`, `message_status`, `conversation_read`, `typing`, `presence`, `pong`, `error`.
See `backend/app/realtime/handlers.py`.

## 11. Database
Tables are created on startup. A PostgreSQL DDL is in `database/schema.sql`.

## 12. Screenshots
None yet; see `screenshots/README.md`.

## 13. Limitations
- **Forgot password is UI-only.** No email provider is configured.
- Tokens live in web storage (localStorage/sessionStorage), an XSS trade-off.
- The rate limiter is in-memory and per process.
- Messages are not end-to-end encrypted; the server can read them.
- No migrations tool yet.

## 14. Future improvements
Alembic migrations, group chat (via the member model), Redis pub/sub for multiple replicas, end-to-end encryption, real email for password reset.

## 15. Project layout
`backend/` FastAPI app, tests, scripts · `frontend/` React app · `database/` schema · `docker-compose.yml`.
