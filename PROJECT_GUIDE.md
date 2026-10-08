# Project Guide

This file explains the Task Manager app for someone reverse-engineering the code. Read it top to bottom with the code open next to you.

---

## 1. Folder Structure

```
task-manager/
├── backend/
│   ├── manage.py                 # Django command-line tool
│   ├── requirements.txt          # Python dependencies
│   ├── venv/                     # Python virtual environment (created by you)
│   ├── db.sqlite3                # SQLite database (created by migrations)
│   ├── config/                   # The Django "project" (settings + root URLs)
│   │   ├── settings.py           # All configuration: apps, JWT, database
│   │   └── urls.py               # Root URL router: /api/ -> tasks app
│   └── tasks/                    # The one app that owns all API logic
│       ├── models.py             # Task database table
│       ├── serializers.py        # JSON <-> Python object converters
│       ├── views.py              # Request handlers (register + task CRUD)
│       ├── urls.py               # Every API endpoint lives here
│       ├── permissions.py        # Object-level ownership check
│       ├── admin.py              # Makes Task visible in /admin
│       └── migrations/           # Generated schema files
├── frontend/
│   ├── index.html                # The single HTML page Vite serves
│   ├── vite.config.js            # Dev server + /api proxy to Django
│   └── src/
│       ├── main.jsx              # React entry point (router + auth provider)
│       ├── App.jsx               # Route table (which URL shows which page)
│       ├── App.css / index.css   # Plain CSS
│       ├── services/
│       │   └── api.js            # The ONE axios instance: tokens in, JSON out
│       ├── context/
│       │   └── AuthContext.jsx   # Global login/logout state
│       ├── components/
│       │   ├── ProtectedRoute.jsx # Blocks pages when not logged in
│       │   ├── Navbar.jsx         # Username + New Task + Logout
│       │   ├── TaskList.jsx       # Maps tasks -> TaskItem
│       │   ├── TaskItem.jsx       # One task row: toggle, edit, delete
│       │   └── TaskForm.jsx       # Shared create/edit form
│       └── pages/
│           ├── Login.jsx
│           ├── Register.jsx
│           ├── Dashboard.jsx      # Lists the logged-in user's tasks
│           ├── CreateTask.jsx
│           └── EditTask.jsx
├── PROJECT_GUIDE.md              # This file
├── API_DOCUMENTATION.md          # Endpoint reference table
└── README.md                     # Exact setup/run commands
```

Deliberate choices: **one Django app** (`tasks`), **one axios instance**, **one CSS file per scope**, **no extra apps, folders, or libraries**. Everything exists once.

---

## 2. What Every Important File Does

| File | Job |
|---|---|
| `backend/config/settings.py` | Tells Django which apps are installed, that DRF should accept JWTs on every request, and how long tokens live. |
| `backend/config/urls.py` | Two lines of routing: admin at `/admin/`, everything else at `/api/` is delegated to `tasks/urls.py`. |
| `backend/tasks/models.py` | Defines the `Task` table: title, description, completed, timestamps, and a `user` foreign key. |
| `backend/tasks/serializers.py` | `RegisterSerializer` creates users safely (hashed password). `TaskSerializer` converts Task rows to/from JSON. |
| `backend/tasks/views.py` | `RegisterView` creates accounts. `TaskViewSet` handles list/create/retrieve/update/delete. |
| `backend/tasks/urls.py` | Maps the three auth URLs and the router-generated task URLs. |
| `backend/tasks/permissions.py` | `IsOwner`: object-level rule that `obj.user == request.user`. |
| `frontend/src/services/api.js` | Axios instance: attaches access token to every request, refreshes it on 401. |
| `frontend/src/context/AuthContext.jsx` | Holds `isLoggedIn`, `username`, `login()`, `logout()` so every component can see auth state. |
| `frontend/src/App.jsx` | The route table: which URL renders which page, and which pages are protected. |
| `frontend/src/components/ProtectedRoute.jsx` | Renders children only when a token exists, otherwise redirects to `/login`. |
| `frontend/vite.config.js` | Proxies `/api/*` from port 5173 to Django on port 8000. |

---

## 3. How the Application Starts

Two processes must run at the same time, in two terminals.

**Terminal 1 — backend (port 8000):**

```
backend/venv/Scripts/activate      # Windows (see README for macOS/Linux)
cd backend
python manage.py migrate           # builds db.sqlite3 tables (first time)
python manage.py runserver         # starts HTTP server on :8000
```

What happens: Django loads `config/settings.py`, sees `rest_framework` and `tasks` in `INSTALLED_APPS`, imports `tasks/urls.py`, and starts answering requests.

**Terminal 2 — frontend (port 5173):**

```
cd frontend
npm install                        # first time only
npm run dev                        # starts Vite on :5173
```

What happens: Vite serves `index.html`, compiles JSX on the fly, and (because of `vite.config.js`) forwards any request starting with `/api` to `http://127.0.0.1:8000`.

You open **http://localhost:5173** in the browser. The backend is never opened directly by the user; it is reached through the proxy.

---

## 4. How React Communicates with Django

```
Browser (React)                 Vite (:5173)              Django (:8000)
-------------                   ------------              -------------
api.get('/tasks/')   ─────────►  /api/tasks/  ──────────►  /api/tasks/
                                 (proxy forwards)          TaskViewSet list
api.post('/tasks/', body) ─────►  /api/tasks/  ──────────►  TaskViewSet create
```

Three rules:

1. **One base URL.** `axios.create({ baseURL: '/api' })` — components never write full URLs, they call `api.get('/tasks/')`.
2. **The token rides along automatically.** A request interceptor in `api.js` adds `Authorization: Bearer <access token>` to every outgoing request. No component ever touches the token.
3. **The proxy hides the two ports.** The browser only talks to 5173, so there is no CORS problem and no hardcoded `http://localhost:8000` in the app code.

---

## 5. Request/Response Flow for Every Action

### Register

1. User fills the form in `Register.jsx`, submits.
2. `api.post('/auth/register/', { username, password })` → interceptor adds token if one exists (harmless here).
3. Vite proxy forwards to `POST /api/auth/register/`.
4. `config/urls.py` → `tasks/urls.py` → `RegisterView` (a `CreateAPIView`).
5. `RegisterSerializer.validate` checks fields; `create()` calls `User.objects.create_user()` which **hashes** the password.
6. Django writes a row in `auth_user`. Response: `{"id": 4, "username": "dana"}` with HTTP 201.
7. React navigates to `/login`.

### Login

1. `Login.jsx` submits → `api.post('/auth/login/', { username, password })`.
2. SimpleJWT's `TokenObtainPairView` verifies the password, then **creates two JWTs signed with `SECRET_KEY`**.
3. Response: `{"access": "...", "refresh": "..."}`.
4. `AuthContext.login(access, refresh, username)` writes both tokens plus the typed username to `localStorage` and sets React state. (The JWT only carries `user_id`, not the username, so the UI keeps the username itself.)
5. React navigates to `/dashboard`.

### Create Task

See section 7 for the full click-by-click walkthrough.

### Get Tasks

1. `Dashboard` mounts → `useEffect` calls `loadTasks()` → `api.get('/tasks/')`.
2. Interceptor attaches `Authorization: Bearer <access>`.
3. DRF's `JWTAuthentication` decodes the token, verifies the signature and expiry, and sets `request.user`.
4. `IsAuthenticated` passes (a user exists).
5. `TaskViewSet.get_queryset()` returns `Task.objects.filter(user=request.user)` — only this user's rows.
6. `TaskSerializer` converts the rows to JSON. Response: a JSON array.
7. `setTasks(data)` re-renders `TaskList`.

### Update Task

1. `EditTask` first loads the task: `api.get('/tasks/<id>/')`.
2. User edits the form → `api.put('/tasks/<id>/', values)`.
3. Router matches `TaskViewSet.retrieve/update` with `pk=<id>`.
4. The queryset filter means the lookup is "task with this id **that belongs to me**" — someone else's id finds nothing → **404**.
5. `TaskSerializer.update()` writes the new values; `auto_now` bumps `updated_at`.
6. Response: the full updated task JSON. React navigates back to `/dashboard`.

### Delete Task

1. `TaskItem` delete button → `window.confirm()` → `api.delete('/tasks/<id>/')`.
2. Same ownership lookup as above (404 if not yours).
3. Row is deleted. Response: **204 No Content** with an empty body.
4. `onChanged()` re-runs `loadTasks()`, so the list refreshes.

---

## 6. Concept Explanations

### Django model
A Python class that maps to a database table. `models.py` declares the columns; Django generates and applies SQL via migrations. `Task.user = ForeignKey(User)` becomes a `user_id` column holding the owning user's id, plus a database constraint. `auto_now_add=True` stamps creation time once; `auto_now=True` re-stamps on every save.

### DRF serializer
A class that does two things: **validate/parse** incoming JSON into Python data, and **serialize** Python objects into JSON. `TaskSerializer` declares exactly which fields leave the API — that is why `user` and `password` never appear in task responses by accident. Serializers are also where security-relevant transformations live (e.g. `RegisterSerializer.create` hashing the password).

### DRF view
The class that receives an HTTP request and returns an HTTP response. `TaskViewSet` is a `ModelViewSet`, so DRF generates five handlers from one class: `list`, `create`, `retrieve`, `update`, `partial_update`, `destroy`. `RegisterView` is a `CreateAPIView` — the same idea with only "create".

### URL routing
Two layers. `config/urls.py` sends everything under `/api/` into `tasks/urls.py`. Inside it, a `DefaultRouter` registers `TaskViewSet` under the prefix `tasks` and generates the detail pattern `tasks/<pk>/`. Auth paths are plain `path()` entries. The router also auto-generates a browsable API root at `/api/`.

### Permissions
Two layers, both server-side:

- **Class-level** — `permission_classes = [IsAuthenticated, IsOwner]` runs on every request. `IsAuthenticated` is why `GET /api/tasks/` with no token returns **401**.
- **Queryset-level** — `get_queryset()` filters by `request.user`, so another user's id simply is not in the candidate set → **404**. This is the primary ownership barrier.
- **Object-level** — `IsOwner.has_object_permission()` re-checks `obj.user == request.user` when a single object is fetched. Defense in depth.

The frontend never decides ownership. Clear the frontend entirely and the API still refuses cross-user access.

### JWT authentication
A JWT is three parts joined by dots: `header.payload.signature`, base64-encoded. The payload holds claims like `user_id`, `exp`, `token_type`, and `jti`. Django signs it with `SECRET_KEY`. Because the signature is a keyed hash, **only the server can mint or alter a token** — the browser can read the payload but cannot forge one. Access tokens are short-lived (`30 min`, `settings.py` → `SIMPLE_JWT`); refresh tokens last 7 days and can only be exchanged for a new access token.

### Axios
An HTTP client. This project uses one instance (`services/api.js`) with two interceptors: a **request** interceptor that attaches the bearer token, and a **response** interceptor that catches `401`, calls `/api/auth/refresh/`, stores the new access token, and replays the failed request. Components just write `api.get(...)` and stay unaware of tokens.

### React components
Small functions returning JSX. Two kinds here: **pages** (route targets: Login, Dashboard, ...) and **components** (reused pieces: Navbar, TaskForm, ...). Data flows down via props; events flow up via callback props (`onChanged` tells the parent "reload the list").

### React state
`useState` gives a piece of data plus a setter; changing it re-renders the component. `Dashboard` holds `tasks`; `AuthContext` holds auth state globally so Navbar and ProtectedRoute see login/logout without prop-drilling. `localStorage` is the **durable** copy (survives refresh); React state is the **live** copy (drives rendering). `AuthContext` reads localStorage on mount to initialize state.

### React Router
`BrowserRouter` (in `main.jsx`) watches the URL; `Routes`/`Route` in `App.jsx` map URLs to components; `Navigate` performs redirects; `useParams` reads `:id` in `/tasks/:id/edit`; `useNavigate` is the programmatic redirect after form submits. It is all **client-side** — no server round-trip happens on navigation.

### ProtectedRoute
A wrapper component: if `isLoggedIn` is true render the page, otherwise `<Navigate to="/login" replace />`. It hides the page **and** stops the API calls inside it. It is UX, not security — the real enforcement is the 401 the API returns for any request without a valid token.

---

## 7. What Happens When a User Clicks "Create Task"

Browser → database → back, step by step:

1. **Click.** `TaskForm.handleSubmit` runs. It calls `e.preventDefault()` so the browser does not do a full page reload, validates the title locally, and calls `onSubmit({ title, description, completed })`.
2. **Page handler.** `CreateTask.handleCreate` executes `api.post('/tasks/', values)`.
3. **Interceptor.** The axios request interceptor reads `localStorage.getItem('access')` and sets `Authorization: Bearer eyJ...`.
4. **Proxy.** Vite sees the path starts with `/api` and forwards the request to `http://127.0.0.1:8000/api/tasks/`.
5. **URL dispatch.** Django runs middleware, then `config/urls.py` → `tasks/urls.py` → the router matches `POST /api/tasks/` to `TaskViewSet.create`.
6. **Authentication.** `JWTAuthentication` decodes the token, verifies signature and `exp`, looks up `user_id`, and sets `request.user`.
7. **Permission.** `IsAuthenticated` passes; `get_queryset()` is prepared.
8. **Validation.** `TaskSerializer(data=request.data).is_valid(raise_exception=True)` — a missing/empty title returns **400** with `{"title": ["This field is required."]}`.
9. **Save.** `TaskViewSet.perform_create` runs `serializer.save(user=self.request.user)` — the user comes from the **token**, not the body.
10. **Database.** Django ORM emits SQL: `INSERT INTO tasks_task (title, description, completed, user_id, ...) VALUES (...)`. SQLite writes the row and returns the new `id`.
11. **Response.** The serializer renders the new object: `201 Created` with `{"id": 7, "title": "...", ...}`.
12. **Back in React.** `handleCreate` calls `navigate('/dashboard')`. Dashboard remounts, its `useEffect` fires `api.get('/tasks/')`, and the new task appears in the list.

---

## 8. JSON Examples for Every Endpoint

### POST /api/auth/register/

Request:
```json
{"username": "dana", "password": "secret123"}
```
Response `201`:
```json
{"id": 4, "username": "dana"}
```

### POST /api/auth/login/

Request:
```json
{"username": "dana", "password": "secret123"}
```
Response `200`:
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
Bad credentials → `401`: `{"detail": "No active account found with the given credentials"}`

### POST /api/auth/refresh/

Request:
```json
{"refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
```
Response `200`:
```json
{"access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
```

### GET /api/tasks/

Headers: `Authorization: Bearer <access>`

Response `200`:
```json
[
  {
    "id": 7,
    "title": "Write guide",
    "description": "PROJECT_GUIDE.md",
    "completed": false,
    "created_at": "2026-10-08T20:00:31Z",
    "updated_at": "2026-10-08T20:00:31Z"
  }
]
```
No/invalid token → `401`: `{"detail": "Given token not valid for any token type"}`

### POST /api/tasks/

Request:
```json
{"title": "Write guide", "description": "PROJECT_GUIDE.md", "completed": false}
```
Response `201`: the created object with `id` and timestamps.
Missing title → `400`: `{"title": ["This field is required."]}`

### GET /api/tasks/<id>/

Response `200`: the single task object.
If the id belongs to another user (or does not exist) → `404`: `{"detail": "Not found."}`

### PUT /api/tasks/<id>/

Request (all fields required):
```json
{"title": "Write guide", "description": "done!", "completed": true}
```
Response `200`: the full updated object with a new `updated_at`.

### PATCH /api/tasks/<id>/

Request (only what changes):
```json
{"completed": true}
```
Response `200`: the full updated object.

### DELETE /api/tasks/<id>/

Response `204`: empty body.

---

## 9. Where Tokens Are Created, Stored, Sent, and Verified

| Stage | Where | Code |
|---|---|---|
| **Created** | Django, on login | SimpleJWT's `TokenObtainPairView` builds and signs the JWTs with `SECRET_KEY` — `tasks/urls.py` line for `auth/login/`. A new access token is also minted by `auth/refresh/`. |
| **Stored** | Browser | `AuthContext.login()` puts `access`, `refresh`, and the username in `localStorage` (persists across refreshes/tabs). |
| **Sent** | Browser → API | The axios request interceptor adds `Authorization: Bearer <access>` to every request — `services/api.js`. The refresh token is sent **only** to `/api/auth/refresh/`. |
| **Verified** | Django, every request | DRF's `JWTAuthentication` (registered in `settings.py`) decodes the header, checks the signature, `exp`, and token type, loads the user. Failure → `401`. |
| **Refreshed** | Browser | The axios response interceptor catches `401`, posts the refresh token, stores the new access token, and retries the original request once. |
| **Destroyed** | Browser | `AuthContext.logout()` removes both keys from `localStorage`. Stateless JWT means there is no server session to kill. |

---

## 10. How a Task Becomes Associated with the Logged-In User

The chain, in order:

1. The user logs in → the JWT payload contains `user_id`.
2. Every later request carries that token → DRF sets `request.user` from it.
3. On create, `TaskViewSet.perform_create` runs `serializer.save(user=self.request.user)`.
   The `user` field in `TaskSerializer` is **not** in its `fields` list, so a client cannot pass `{"user": 2}` — it would be ignored. The server is the only one that sets it.
4. The ORM writes `user_id` into the `tasks_task` row.
5. On every read/update/delete, `get_queryset()` returns `Task.objects.filter(user=request.user)`, so rows with another `user_id` are invisible to that request.

Result: association is decided **at write time by the token**, and enforced **at read time by the queryset**. Two independent server-side guarantees; the frontend contributes nothing to security.
