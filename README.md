# Orbital

Orbital is a full-stack real-time globe application built on the latest generated frontend and backend framework lines in this workspace: Next.js 16 with React 19 on the frontend, and Spring Boot 4 targeting Java 21 on the backend. The frontend uses React Three Fiber for the interactive globe, and the backend will aggregate normalized position data from CelesTrak first and OpenSky next.

## Workspace Layout

- `apps/web`: Next.js frontend and 3D viewer shell.
- `apps/api`: Spring Boot backend with snapshot and WebSocket-ready contracts.
- `.github/copilot-instructions.md`: setup checklist tracked in-repo.

## Current State

- Frontend scaffold replaced with an Orbital landing experience and a live globe prototype.
- Backend scaffold exposes a normalized track model, snapshot endpoint, and STOMP-ready WebSocket configuration.
- The repo is aligned to current framework versions, but backend compilation is blocked on this machine because only a Java 8 runtime is installed and no Java 21 JDK is present.

## Local Commands

### Frontend

```bash
npm install --prefix apps/web
npm run dev --prefix apps/web
```

### Backend

```bash
cd apps/api
./mvnw spring-boot:run
```

The backend command requires a Java 17+ JDK.

The backend currently targets Java 21 because Spring Boot 4 is being used.