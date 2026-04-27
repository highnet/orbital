# Orbital

Orbital is a real-time satellite viewer built around a simple idea: take live orbital data, turn it into a clean normalized snapshot, and render it on a globe that feels like an actual product instead of a demo.

Today the app pulls active satellite data from CelesTrak, exposes it through a Spring Boot API, and renders it in a Next.js globe experience that propagates positions in the browser with `satellite.js`.

## What It Does

- Shows live satellite tracks on a textured 3D earth.
- Normalizes external orbital data into a frontend-friendly snapshot shape.
- Caches upstream data on the backend to avoid hammering the source feed.
- Leaves room for the next layer: streaming updates, filters, search, and richer track inspection.

## Architecture

Orbital is a small monorepo with a clear split between presentation and data delivery.

- `apps/web`: Next.js 16 + React 19 frontend with the globe scene and selection UI.
- `apps/api`: Spring Boot 4 + Java 21 backend that fetches and serves orbital snapshots.

The current flow looks like this:

1. The backend requests active satellite data from CelesTrak.
2. The API normalizes and caches the result for five minutes.
3. The frontend fetches `/api/v1/tracks/snapshot`.
4. The browser propagates each track into live positions for smooth motion on the globe.

## Local Development

### Requirements

- Node.js 20+
- Java 21

### Run The Frontend

```bash
npm install --prefix apps/web
npm run dev --prefix apps/web
```

The web app runs on `http://localhost:3000`.

### Run The Backend

```bash
cd apps/api
./mvnw spring-boot:run
```

The API runs on `http://localhost:8080`.

### Useful Commands

```bash
npm run build --prefix apps/web
npm run lint --prefix apps/web
cd apps/api && ./mvnw test
```

## API Surface

Orbital currently exposes one primary snapshot endpoint:

- `GET /api/v1/tracks/snapshot`

That response contains a normalized list of tracks plus the snapshot timestamp used by the frontend to render the current globe state.

## Current Product Shape

The app already feels like the foundation of a real experience rather than a scaffold:

- A live globe with active satellite markers.
- A sidebar for snapshot health and selected object details.
- Browser-side propagation for continuous motion.
- Backend caching and fallback behavior around the CelesTrak feed.

## Where It Can Grow

The next logical steps are product features, not framework setup:

- Real-time streaming over WebSockets.
- Search and filtering by object, type, or orbit class.
- Better inspection views for individual satellites.
- Additional upstream providers beyond CelesTrak.

## Repo Notes

There is a separate frontend-specific README in `apps/web/README.md` if you want details focused only on the web app.