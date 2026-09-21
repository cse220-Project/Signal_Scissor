# Signal Scissors

Signal Scissors is a React/Vite workstation backed by a Python FastAPI DSP engine.

## Project layout

- `frontend/` contains the active React/Vite interface.
- `backend/` contains the FastAPI server and signal-processing modules.
- `frontend-template/` is a preserved, separate frontend template and is not part of the active app.
- `audio/` contains sample media and remains at the project root because its ownership is ambiguous.

## Backend

Create or activate the Python environment, install the backend dependencies, then start FastAPI:

```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn server:app --reload --host 127.0.0.1 --port 8000
```

The API is available at `http://127.0.0.1:8000`, with documentation at `/docs`.

The legacy launcher can also be run from the project root:

```bash
python backend/main.py
python backend/main.py --legacy-gui
```

## Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The Vite development server runs at `http://localhost:5173` and proxies `/api` to the backend at `http://127.0.0.1:8000`.

To build the frontend:

```bash
cd frontend
npm run build
```

For a separately hosted backend, set `VITE_API_BASE_URL` before building or starting Vite:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000 npm run dev
```

When `frontend/dist` exists, the backend also serves the built frontend from its root route.
