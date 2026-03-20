# W241 Plank Experiment — Documentation index

This folder holds the plan, implementation reference, drafts, and user manual.

| Document | Purpose |
|----------|---------|
| **[PLAN.md](PLAN.md)** | High-level design: experiment context, architecture, registration + session flow, photo QC, backend, tech stack. |
| **[IMPLEMENTATION.md](IMPLEMENTATION.md)** | What is built: repo layout, API, `config.js`, registration payload, Sheets tabs, how to extend. |
| **[USER_MANUAL.md](USER_MANUAL.md)** | Researcher setup (Sheets, Apps Script, deploy) and **participant** step-by-step instructions. |
| **[registration_form_draft.md](registration_form_draft.md)** | Registration design draft (eligibility, consent, `registration_attempts`); aligns with implemented `index.html` + `Code.gs`. |
| **[session1_survey_final_draft.md](session1_survey_final_draft.md)** | Session 1 survey **target** instrument (legacy Form parity, demographics = activity-only in session; age/gender **registration only**). |
| **[survey_questions_draft.md](survey_questions_draft.md)** | **Live reference** for registration + current `preTasks` / `postTasks`; points to session1 draft for planned upgrades. |

## Quick reference: project files

- **index.html** — **Physical Performance Study** registration: email, age, gender (Male/Female/Other), optional name, injury/availability, Session 1 time + consents when eligible; `registration_attempts` logging.
- **session.html** — Session flow: safety, instructions (+ plank image), audio, pre-task, plank + timer, post-task, submit, schedule next / complete.
- **js/config.js** — `apiUrl`, `studyTitle`, `researcherEmail`, `numSessions`, `tracks`, `preTasks`, `postTasks`. Keep `TRACKS` / `NUM_SESSIONS` in sync with **apps-script/Code.gs**.
- **js/calendar.js** — Session URL, Google Calendar, `.ics`.
- **js/session.js** — Session state machine, YouTube, timer, optional front-camera capture, surveys, submit.
- **apps-script/Code.gs** — `doGet` (participant by email); `doPost`: `register`, `session`, `upload_photo`. Sheets: **participants**, **sessions**, **registration_attempts**.

For full detail see **PLAN.md**, **IMPLEMENTATION.md**, and **USER_MANUAL.md**.
