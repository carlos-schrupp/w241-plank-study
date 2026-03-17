# W241 Plank Experiment — Documentation Index

This folder contains the plan, implementation reference, and user manual for the data collection website.

| Document | Purpose |
|----------|---------|
| **[PLAN.md](PLAN.md)** | Design and plan: experiment context, architecture, pages and files, session flow, optional photo QC, backend, tech stack. Use this for the high-level plan and rationale. |
| **[IMPLEMENTATION.md](IMPLEMENTATION.md)** | What was built: repository layout, frontend/backend behavior, API contract, configuration, and how to extend (e.g. add a third session or change survey questions). |
| **[USER_MANUAL.md](USER_MANUAL.md)** | **Part 1 — Researcher setup**: one-time Google Sheets/Apps Script and Drive setup, frontend config, hosting, verification, where data lives. **Part 2 — Participant instructions**: how to register, complete a session, and troubleshoot. |

## Quick reference: project files

- **index.html** — Registration; after submit, calendar links for Session 1.
- **session.html** — Full session flow (safety, instructions, audio, pre-task questions, plank + timer, post-task questions, submit, then schedule next or complete). No separate thank-you page.
- **js/config.js** — `apiUrl`, `numSessions`, `tracks`, `preTasks`, `postTasks`. Edit here to change questions or add a third session; keep in sync with `apps-script/Code.gs` for `TRACKS` and `NUM_SESSIONS`.
- **js/calendar.js** — Session URL and Google Calendar / .ics generation.
- **js/session.js** — Session state machine, YouTube, timer, photo capture, survey render, submit.
- **apps-script/Code.gs** — Backend: participant lookup (GET), register + session submit + photo upload (POST). Paste into Apps Script; set `DRIVE_FOLDER_ID` and deploy as Web App.

For full detail and correct formatting (including diagrams and step-by-step flows), see **PLAN.md**, **IMPLEMENTATION.md**, and **USER_MANUAL.md**.
