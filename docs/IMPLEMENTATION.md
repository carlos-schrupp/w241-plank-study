# W241 Plank Experiment — Implementation Reference

This document describes what was built: file layout, API contract, configuration, and how to extend the study (e.g. add a third session or change survey questions).

---

## Repository Layout

```
w241_website/
  index.html              # Registration + success view with calendar links
  session.html            # Single-page session flow (all 6 steps + submit + schedule/complete)
  js/
    config.js             # EXPERIMENT_CONFIG: apiUrl, numSessions, tracks, preTasks, postTasks
    calendar.js           # getSessionUrl, buildGoogleCalendarUrl, buildICSBlob, renderCalendarLinks
    session.js            # init(), step handlers, YouTube, timer, photo capture, survey render, submit
  apps-script/
    Code.gs               # doGet, doPost (register, session, upload_photo); Sheets + Drive
  docs/
    PLAN.md               # Design and plan (this plan document)
    IMPLEMENTATION.md     # This file
    USER_MANUAL.md        # Researcher setup + participant instructions
```

No separate thank-you page; completion and “schedule next session” are final steps inside `session.html`.

---

## Frontend

### index.html

- Form: name, email, datetime-local (Session 1), two consent/safety checkboxes. Submit calls `EXPERIMENT_CONFIG.apiUrl` with `action: "register"`.
- On success: shows group label, Session 1 time, and `renderCalendarLinks(container, { email, sessionNum: 1, scheduledDateTime })` from `calendar.js`.
- Scripts: `config.js`, `calendar.js`, inline script for form submit and success view.

### session.html

- Progress bar at top; steps are `<section id="step-*">` with class `step`; only `step.active` is shown.
- Step IDs: `loading`, `error`, `safety`, `instructions`, `audio`, `pre-task`, `plank`, `post-task`, `submitting`, `schedule`, `complete`.
- Plank step is a fixed full-screen overlay: large timer, STOP button, optional “REC” indicator when photo capture is on.
- YouTube player div: `youtube-player`; placeholder shown until API ready. Hidden elements: `capture-canvas`, `sheet-canvas`, `camera-feed` (small preview when camera on).
- Scripts: YouTube iframe API, `config.js`, `calendar.js`, `session.js`. Boot: `DOMContentLoaded` → `init()` in `session.js`.

### js/config.js

- **EXPERIMENT_CONFIG**:
  - `apiUrl`: Apps Script Web App URL (replace placeholder after deploy).
  - `numSessions`: 2 or 3.
  - `tracks`: array of `{ id, label, youtubeId }`. Order defines Latin square; permutations are computed from `tracks.map(t => t.id)`.
  - `preTasks`, `postTasks`: arrays of question objects (see “Survey questions” below).
- Permutations are built once via an IIFE that runs `permute(trackIds)` and assigns `EXPERIMENT_CONFIG.permutations`.

### js/calendar.js

- `getSessionUrl(email, sessionNum)`: builds `session.html?email=...&session=N` using current origin and path.
- `buildGoogleCalendarUrl({ title, description, startDate, durationMinutes })`, `buildICSBlob(...)`: for calendar links and .ics download.
- `triggerICSDownload(blob, filename)`.
- `renderCalendarLinks(container, { email, sessionNum, scheduledDateTime })`: fills `container` with “Add to Google Calendar” link and “Download for Apple/Outlook” button; description includes session URL.

### js/session.js

- **State**: `S` object holds `email`, `sessionNum`, `participant`, `track`, `ytPlayer`, timer state, `wakeLock`, camera/frames state, `preTasks`/`postTasks` answer objects.
- **init()**: Parse `email` and `session` from URL; GET participant; validate session number; resolve track from `permutations[groupIndex][sessionNum - 1]`; then `showStep('safety')` and bind step handlers.
- **Steps**: Each step has a setup function that sets content and attaches the “next” button handler. Plank step starts timer (`requestAnimationFrame`), optional 1fps capture; STOP stops both, then `showStep('post-task')` and fill survey.
- **Survey**: `renderQuestions(questions, containerId, answersObj, onChangeCallback)` builds scale buttons, radio buttons, or textarea from config; `allAnswered(questions, answersObj)` gates “Submit” / “I’m ready”.
- **Submit**: POST `action: "session"` with email, sessionNum, audioTrack, plankDurationSec, preTasks, postTasks. Then if photo capture was used, build contact sheet and POST `action: "upload_photo"` with base64 image. On success, show `schedule` step (with next-session date picker and calendar links) or `complete` step.
- **Timer**: `performance.now()`-based; display `mm:ss.t`; Wake Lock requested when plank starts, released when STOP is pressed.
- **Photo**: `getUserMedia` for video; capture canvas draws from video every 1s; frames pushed to array. On stop, `buildContactSheet(frames)` produces one JPEG data URL (grid of thumbnails with second labels); that is sent as `imageBase64` in `upload_photo`.

---

## Backend (Apps Script)

### Code.gs

- **Constants**: `DRIVE_FOLDER_ID` (set after creating a Drive folder), `TRACKS` (e.g. `['pop','trance']`), `NUM_SESSIONS` (2 or 3). Must match `js/config.js` when adding sessions or tracks.
- **doGet(e)**: Reads `e.parameter.email`; looks up participant in `participants` sheet; returns JSON with `found`, `participantId`, `groupIndex`, `groupLabel`, `sessionsCompleted`.
- **doPost(e)**: `e.postData.contents` parsed as JSON; dispatches on `data.action`:
  - **register**: Appends row to `participants` (id, name, email, group_index, group_label, 0, now). Group index = (current participant count) % (permutation count). Returns group and id.
  - **session**: Appends row to `sessions` (participant_id, email, session_num, audio_track, plank_duration_sec, JSON pre_task_answers, JSON post_task_answers, `''`, now). Increments participant’s `sessions_completed` in `participants`.
  - **upload_photo**: Finds latest session row for that email+session_num; decodes base64 image, creates file in `DRIVE_FOLDER_ID`, sets sharing to “Anyone with link”; writes file URL into that row’s `contact_sheet_url` column.
- Sheets: `_getSheet(name)` creates tab if missing; `participants` and `sessions` get header rows as in PLAN.md.

### CORS

Apps Script Web App is invoked from the frontend origin. No custom CORS headers are set; the script is deployed with “Anyone” access. Frontend uses simple GET and POST with JSON body; avoid adding custom headers that trigger preflight if you see CORS issues.

---

## Configuration and Extending

### Change number of sessions (e.g. 2 → 3)

1. **js/config.js**: Set `numSessions: 3` and add a third object to `tracks` (e.g. `{ id: 'ambient', label: 'Ambient', youtubeId: '...' }`). Permutations will auto-include 6 groups.
2. **apps-script/Code.gs**: Set `TRACKS = ['pop','trance','ambient']` and `NUM_SESSIONS = 3`. Redeploy.

### Change or add survey questions

Edit `preTasks` or `postTasks` in `js/config.js`. Each item:

- **Scale**: `{ id, text, type: 'scale', min, max, minLabel, maxLabel }`.
- **Radio**: `{ id, text, type: 'radio', options: ['Option A','Option B',...] }`.
- **Text**: `{ id, text, type: 'textarea', required: false }` (optional).

Ids become keys in the stored JSON; no layout code changes needed.

### API URL

After deploying the Web App, copy the “Web app URL” and set `EXPERIMENT_CONFIG.apiUrl` in `js/config.js` to that URL (including `/exec`).

---

## Data Stored

- **Participants sheet**: One row per participant; `sessions_completed` updated after each session submit.
- **Sessions sheet**: One row per completed session; `contact_sheet_url` filled when photo upload succeeds.
- **Drive**: One JPEG per session that had photo capture enabled; name pattern includes email and session number.

Export from Sheets to CSV or use Google Sheets API for analysis in R/Python.
