# Task Manager

A deliberately simple full-stack Task Manager for learning how React talks to Django REST Framework with JWT authentication.

- **Frontend:** React + Vite (JavaScript), React Router, Axios, Context API, plain CSS
- **Backend:** Django, Django REST Framework, SimpleJWT, SQLite

Read `PROJECT_GUIDE.md` to understand the architecture and `API_DOCUMENTATION.md` for the endpoints.

## Setup

### 1. Backend

```bash
# create virtual environment (run once)
python -m venv backend/venv

# activate it
backend/venv/Scripts/activate          # Windows
# source backend/venv/bin/activate     # macOS/Linux

# install dependencies
pip install -r backend/requirements.txt

# inside the backend folder:
cd backend

# build the database (run once, and again after changing models)
python manage.py migrate

# create an admin login for /admin (optional)
python manage.py createsuperuser
```

### 2. Start Django (terminal 1)

```bash
cd backend
python manage.py runserver
```

Backend: http://127.0.0.1:8000/ (API root: http://127.0.0.1:8000/api/ · admin: http://127.0.0.1:8000/admin/)

### 3. Frontend (terminal 2)

```bash
cd frontend
npm install        # run once
npm run dev
```

Frontend: **http://localhost:5173** — this is the URL you open in the browser.

## Which URL to open

| What | URL |
|---|---|
| **App (open this)** | http://localhost:5173 |
| API via proxy | http://localhost:5173/api/ |
| Django direct | http://127.0.0.1:8000/api/ |
| Django admin | http://127.0.0.1:8000/admin/ |

The frontend dev server proxies `/api/*` to Django (see `frontend/vite.config.js`), so both terminals must be running.

## First run

1. Open http://localhost:5173
2. Register an account → log in
3. Create, edit, toggle, and delete tasks
4. Register a **second** account and confirm it sees an empty list — task ids from the first account return 404

## Project layout

```
backend/    Django project (config) + single app (tasks)
frontend/   Vite React app (src/pages, src/components, src/services, src/context)
```
