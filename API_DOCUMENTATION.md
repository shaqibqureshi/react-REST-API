# API Documentation

Base URL: `http://127.0.0.1:8000/api/` (through the Vite proxy the app uses `http://localhost:5173/api/`)

Auth means the header: `Authorization: Bearer <access token>`

| METHOD | URL | PURPOSE | AUTH REQUIRED | REQUEST BODY | RESPONSE |
|---|---|---|---|---|---|
| POST | `/api/auth/register/` | Create a new user account | No | `{"username", "password"}` | `201` `{"id", "username"}` · `400` field errors |
| POST | `/api/auth/login/` | Get JWT access + refresh tokens | No | `{"username", "password"}` | `200` `{"access", "refresh"}` · `401` bad credentials |
| POST | `/api/auth/refresh/` | Exchange refresh token for a new access token | No (needs refresh token) | `{"refresh"}` | `200` `{"access"}` · `401` invalid/expired refresh |
| GET | `/api/tasks/` | List all tasks of the logged-in user | Yes | — | `200` array of task objects · `401` |
| POST | `/api/tasks/` | Create a task owned by the logged-in user | Yes | `{"title", "description"?, "completed"?}` | `201` task object · `400` validation · `401` |
| GET | `/api/tasks/{id}/` | Get one task (404 if not yours) | Yes | — | `200` task object · `404` not yours/missing · `401` |
| PUT | `/api/tasks/{id}/` | Replace a task (all fields required) | Yes | `{"title", "description", "completed"}` | `200` updated task · `400` · `404` · `401` |
| PATCH | `/api/tasks/{id}/` | Partially update a task | Yes | any subset of `{"title", "description", "completed"}` | `200` updated task · `404` · `401` |
| DELETE | `/api/tasks/{id}/` | Delete a task | Yes | — | `204` empty body · `404` · `401` |

## Task object

```json
{
  "id": 7,
  "title": "Write guide",
  "description": "PROJECT_GUIDE.md",
  "completed": false,
  "created_at": "2026-10-08T20:00:31.892691Z",
  "updated_at": "2026-10-08T20:00:31.892793Z"
}
```

`user` is intentionally absent: it is set server-side from the JWT and never accepted from the request body.

## Notes

- **Ownership:** requesting a task id that belongs to another user returns `404 Not Found` (the queryset only ever contains your own tasks).
- **Token lifetimes:** access = 30 minutes, refresh = 7 days (see `SIMPLE_JWT` in `backend/config/settings.py`).
- **Status codes:** `200` OK · `201` Created · `204` No Content · `400` bad body · `401` no/invalid token · `404` not found (or not yours).
