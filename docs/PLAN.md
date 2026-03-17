# W241 Plank Experiment — Data Collection Website (Plan)

## Overview

Mobile-first, all-in-one data collection site for an N-session crossover plank experiment: participant registration with randomized group assignment (Latin square), calendar scheduling, guided session flow (instructions, YouTube audio, timer, optional 1fps photo QC, pre- and post-task surveys), and Google Sheets storage via Apps Script.

---

## Experiment Context

- **Design**: N-session crossover (within-subjects). Everyone completes all N sessions. N = 2 or 3 (configurable).
- **Randomization**: Full Latin square permutation assignment.
  - N=2 tracks: 2 groups (e.g. Pop then Trance, or Trance then Pop).
  - N=3 tracks: 6 groups (all permutations of three audio conditions).
- **Participant flow**: Assigned to a group at registration; group determines which audio track is played in each session.
- **Configuration**: Audio tracks and session count live in a single config (`js/config.js` and `apps-script/Code.gs`). Changing N or questions only requires editing the config, not rebuilding pages.
- **Primary measure**: Plank hold duration (seconds) per session.
- **Audio**: YouTube embeds; track IDs and labels are defined in config.

---

## Architecture

- **Frontend**: Static HTML/JS (Netlify or any static host). Two pages: registration (`index.html`) and session (`session.html`). Post-session “thank you” and “schedule next session” are steps inside `session.html`, not a separate page.
- **Backend**: Google Apps Script Web App. Handles: participant registration (and group assignment), participant lookup by email, session data submission, contact-sheet photo upload to Google Drive.
- **Storage**: Google Sheets (participants + sessions tabs); contact-sheet images in a Google Drive folder.

```
[Registration page]  --> POST register     --> [Apps Script] --> [Sheets: participants]
[Session page]       --> GET ?email=...    --> [Apps Script] --> participant + group
[Session page]       --> POST session      --> [Apps Script] --> [Sheets: sessions]
[Session page]       --> POST upload_photo --> [Apps Script] --> [Drive folder]
```

Calendar links (Google Calendar URL and .ics download) are generated client-side and embed the session URL (`session.html?email=...&session=N`).

---

## Pages and Files

| Path | Purpose |
|------|---------|
| `index.html` | Registration form; after submit: group display, Session 1 date/time, calendar link generation. |
| `session.html` | Full 6-step session flow (safety, instructions, audio, pre-task questions, plank+timer, post-task questions, submit, then schedule-next or study-complete). |
| `js/config.js` | Experiment config: `apiUrl`, `numSessions`, `tracks`, `preTasks`, `postTasks`. Permutations are derived from `tracks`. |
| `js/calendar.js` | Utilities to build session URL, Google Calendar link, and .ics blob; `renderCalendarLinks()` for the UI. |
| `js/session.js` | Session state machine: URL params, API calls, YouTube player, timer, photo capture, survey rendering, submit, schedule-next. |
| `apps-script/Code.gs` | Apps Script: `doGet` (participant lookup), `doPost` (register, session, upload_photo). Sheet and Drive setup described in file header. |

There is no separate `thankyou.html`; completion and “schedule next session” are steps within `session.html`.

---

## Page 1: Registration (`index.html`)

- **Fields**: Full name, email, consent/safety checkboxes, date/time picker for Session 1 (e.g. minimum 1 hour from now).
- **On submit**:
  1. POST `action: "register"` to Apps Script; backend stores participant and assigns group (Latin square round-robin).
  2. Response returns group index (and label); client shows success view.
  3. Client generates Google Calendar link and .ics download; session URL is embedded in the event description (`session.html?email=...&session=1`).
- After each session, the same calendar-link pattern is used for the *next* session (date picker constrained to 24–72 hours later), from within `session.html`.

---

## Page 2: Session (`session.html`)

- **Entry**: Via calendar link; URL params `email` and `session` (session number).
- **On load**: GET request with `?email=...` to Apps Script to fetch participant and group; session number is validated (must be next incomplete session). Track for this session is derived from group + session index.

**Steps (single page, progressive disclosure):**

1. **Safety**: Confirm email (pre-filled), three checkboxes (no intense core in 24h, no hypertension/injury, space/equipment). “Continue” enabled when all checked.
2. **Instructions**: Short written instructions for the plank (position, form, when to stop). “I understand — Continue”.
3. **Audio**: YouTube embed for the assigned track; volume reminder. “Music is playing — Continue” (optionally triggers play on tap for autoplay policies).
4. **Pre-task questions**: Motivation-style questions (scale/radio/textarea from config). Optional “Enable form verification camera” toggle. “I’m Ready — Start Plank” enabled when required questions are answered.
5. **Plank**: Full-screen view: large timer (`mm:ss.t`), single STOP button. Optional 1fps photo capture from camera; screen kept on via Wake Lock. Music continues in background.
6. **Post-task**: Timer stopped; duration shown read-only. Post-task survey from config. “Submit Session Data”.
7. **After submit**: If more sessions remain, show “Schedule next session” (date picker 24–72h, calendar links). If all sessions done, show “Study complete”.

Survey question sets (`preTasks`, `postTasks`) are defined in `js/config.js`; the form is rendered from those arrays so questions can be changed without editing layout code.

---

## Optional QC: 1fps Photo Capture

- **Rationale**: One photo per second gives a compact contact sheet (~9 MB for a 3‑minute plank vs. large video), better upload reliability and simpler review (single image).
- **Flow**: Before “Start Plank”, user can enable “form verification camera”. `getUserMedia` (rear camera preferred on mobile); hidden canvas captures a JPEG frame every second; frames stored in memory. On STOP, capture stops; frames are stitched into one contact-sheet image (grid with timestamp labels) and sent as base64 to Apps Script; script saves to Drive and stores the file URL in the session row.
- **Fallback**: If camera is denied or unavailable, the toggle is hidden or non-blocking; session continues without photos.

---

## Google Apps Script Backend (`Code.gs`)

- **doGet(e)**: `?email=xxx` → returns `{ found, participantId, groupIndex, groupLabel, sessionsCompleted }`.
- **doPost(e)** (body JSON):
  - `action: "register"` — name, email; creates participant row, assigns group (round-robin over permutations), returns group and id.
  - `action: "session"` — email, sessionNum, audioTrack, plankDurationSec, preTasks, postTasks; appends to sessions sheet, increments participant’s `sessions_completed`.
  - `action: "upload_photo"` — email, sessionNum, imageBase64; decodes image, creates file in Drive folder, writes URL into the matching session row.

Sheets: **participants** (id, name, email, group_index, group_label, sessions_completed, registered_at); **sessions** (participant_id, email, session_num, audio_track, plank_duration_sec, pre_task_answers, post_task_answers, contact_sheet_url, submitted_at). Tabs are created by the script if missing. Config (e.g. track list, num_sessions) is duplicated in `Code.gs` for server-side group assignment and must be kept in sync with `js/config.js` when adding a third track or changing N.

---

## Tech Stack and Hosting

- **Frontend**: HTML + vanilla JS, Tailwind CSS via CDN, no build step.
- **Audio**: YouTube IFrame Player API (loop via playlist param).
- **Photo QC**: `getUserMedia` + canvas; contact sheet built client-side, uploaded as base64.
- **Backend**: Google Apps Script (Web App, “Execute as me”, “Anyone”).
- **Storage**: Google Sheets + one Drive folder for contact-sheet images.
- **Hosting**: Any static host (e.g. Netlify); HTTPS recommended for camera and Wake Lock.

---

## Implementation Order (Completed)

1. Apps Script backend and Sheets/Drive setup.
2. Registration page and calendar link generation.
3. Session page: safety, instructions, audio, pre-task questions, plank step with timer and optional photo capture.
4. Session page: post-task questions and submit; then schedule-next or study-complete.
5. User manual and researcher setup notes.
