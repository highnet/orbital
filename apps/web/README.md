# Orbital Web

This app is the frontend for Orbital, a real-time globe experience built on Next.js 16, React 19, Three.js, React Three Fiber, and Drei.

## Commands

```bash
npm install
npm run dev
npm run build
```

## Current Scope

- Orbital landing/viewer shell in the App Router.
- Interactive 3D globe scene with animated satellite markers.
- Structure ready for snapshot fetches, streaming updates, selection, and filters.

## Next Implementation Steps

- Replace mock markers with normalized snapshot data from the Spring Boot API.
- Add interpolation and selection state outside the render loop.
- Introduce filtering and move to instanced rendering as counts grow.
