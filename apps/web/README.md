# Lecture Mood Tracker (Web)

This app is the front-end experience for the real-time Lecture Mood Tracker. It lets instructors create a lecture, see live mood aggregation, and review student ideas in one clean dashboard.

## What’s inside

- **Live mood panel** with quick vote updates
- **Idea board** with anonymous submission toggle
- **Instructor controls** for exporting or pausing the session
- Responsive, modern UI that matches the design spec

## Getting started

Run the development server from the monorepo root:

```bash
pnpm dev --filter=web
```

Start the realtime API + WebSocket server in a second terminal:

```bash
pnpm --filter=web dev:realtime
```

Then open [http://localhost:3000](http://localhost:3000).

## Notes

- UI state is mocked locally for now so you can wire up real APIs or WebSockets later.
- Main layout is in `app/page.tsx`, styles live in `app/page.module.css`.
