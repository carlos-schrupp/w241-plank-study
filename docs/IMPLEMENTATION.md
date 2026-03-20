# W241 Plank Experiment — Implementation Reference

This document describes what was built: file layout, API contract, configuration, and how to extend the study (e.g. add a third session or change survey questions).

---

## Repository Layout

```
w241_website/
  index.html              # Registration + success view with calendar links
  session.html            # Single-page session flow (steps include optional Session 1 activity + submit + schedule/complete)
  js/
    config.js             # EXPERIMENT_CONFIG: tracks, session1Activity, preTasks, postTasksPart1/2, postTasksSession2Extra, …
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

- **Registration:** Study description (Physical Performance Study), email *, age *, **gender** * (Male / Female / Other), optional name, injury Yes/No, availability Yes/No; if eligible, Session 1 `datetime-local` plus BP + combined consent checkboxes. Screen-outs POST `register` and log attempts.
- **Payload** `action: "register"`: `email`, `name`, `age`, `gender` (`male`|`female`|`other`), `injuryUnsafe`, `availability`, `session1PlannedAt`, `consentBp`, `consentParticipate`.
- **Success:** enrolled or `already_registered` — group label, Session 1 time, `renderCalendarLinks(...)` from `calendar.js`.
- Scripts: `config.js` (includes `researcherEmail`), `calendar.js`, inline script.

### session.html

- Progress bar at top; steps are `<section id="step-*">` with class `step`; only `step.active` is shown.
- Step IDs: `loading`, `error`, `safety`, `instructions`, `session1-activity` (Session 1 only), `audio`, `pre-task`, `plank`, `post-task`, `submitting`, `schedule`, `complete`. Progress text uses **Step k of n** from `getProgressSteps()` (7 steps when Session 1 includes activity; 6 when not).
- Plank step is a fixed full-screen overlay: large timer, STOP button, optional “REC” indicator when photo capture is on.
- YouTube player div: `youtube-player`; placeholder shown until API ready. Hidden elements: `capture-canvas`, `sheet-canvas`, `camera-feed` (small preview when camera on).
- Scripts: YouTube iframe API, `config.js`, `calendar.js`, `session.js`. Boot: `DOMContentLoaded` → `init()` in `session.js`.

### js/config.js

- **EXPERIMENT_CONFIG**:
  - `apiUrl`: Apps Script Web App URL (replace placeholder after deploy).
  - `studyTitle`, `researcherEmail`: copy / contact line on registration.
  - `numSessions`: 2 or 3.
  - `tracks`: array of `{ id, label, youtubeId }`. Order defines Latin square; permutations are computed from `tracks.map(t => t.id)`.
  - `session1Activity`: Session 1 only block (after instructions, before audio); merged into `preTasks` JSON on submit.
  - `preTasks`: pre-plank questions while audio plays.
  - `postTasksPart1`, `postTasksSession2Extra`, `postTasksPart2`: pieces assembled in `session.js` into the post-task form (`comments` appended there; Session 2 gets extra scales).
- Permutations are built once via an IIFE that runs `permute(trackIds)` and assigns `EXPERIMENT_CONFIG.permutations`.

### js/calendar.js

- `getSessionUrl(email, sessionNum)`: builds `session.html?email=...&session=N` using current origin and path.
- `buildGoogleCalendarUrl({ title, description, startDate, durationMinutes })`, `buildICSBlob(...)`: for calendar links and .ics download.
- `triggerICSDownload(blob, filename)`.
- `renderCalendarLinks(container, { email, sessionNum, scheduledDateTime })`: fills `container` with “Add to Google Calendar” link and “Download for Apple/Outlook” button; description includes session URL.

### js/session.js

- **State**: `S` object holds `email`, `sessionNum`, `participant`, `track`, `ytPlayer`, timer state, `wakeLock`, camera/frames state, `preTasks`, `postTasks`, `session1Activity`, `postTaskQuestionList`.
- **init()**: Parse `email` and `session` from URL; GET participant; validate session number; resolve track from `permutations[groupIndex][sessionNum - 1]`; then `showStep('safety')` and bind step handlers.
- **Steps**: Each step has a setup function that sets content and attaches the “next” button handler. **Session 1:** instructions → **session1-activity** → audio. **Session 2+:** instructions → audio. Plank step starts timer (`requestAnimationFrame`), optional 1fps capture; STOP stops both, then `showStep('post-task')` and fill survey.
- **Survey**: `renderQuestions` supports `showIf` (conditional block, e.g. pause detail after “Yes” to pause question); `allAnswered` skips requirements when `showIf` parent value does not match. Post-task list from `buildPostTasksForSession(sessionNum)`.
- **Submit**: POST `action: "session"` with email, sessionNum, audioTrack, plankDurationSec, **preTasks** payload = merged **`session1Activity` + `preTasks`** on Session 1, else `preTasks` only; **postTasks** as collected. Then if photo capture was used, build contact sheet and POST `action: "upload_photo"` with base64 image. On success, show `schedule` step (with next-session date picker and calendar links) or `complete` step.
- **Timer**: `performance.now()`-based; display `mm:ss.t`; Wake Lock requested when plank starts, released when STOP is pressed.
- **Photo**: `getUserMedia` for video; capture canvas draws from video every 1s; frames pushed to array. On stop, `buildContactSheet(frames)` produces one JPEG data URL (grid of thumbnails with second labels); that is sent as `imageBase64` in `upload_photo`.

---

## Backend (Apps Script)

### Code.gs

- **Constants**: `DRIVE_FOLDER_ID` (set after creating a Drive folder), `TRACKS` (e.g. `['pop','trance']`), `NUM_SESSIONS` (2 or 3). Must match `js/config.js` when adding sessions or tracks.
- **doGet(e)**: Reads `e.parameter.email`; looks up participant in `participants` sheet; returns JSON with `found`, `participantId`, `groupIndex`, `groupLabel`, `sessionsCompleted`.
- **doPost(e)**: `e.postData.contents` parsed as JSON; dispatches on `data.action`:
  - **register**: Always appends a row to **`registration_attempts`**. If injury or availability screen-out, returns `{ success, enrolled: false, enrollmentStatus }`. If eligible and email already in `participants`, logs and returns `alreadyRegistered` with group fields. If new enrollment, appends **`participants`** (`id`, `name`, `email`, `age`, `group_index`, `group_label`, 0, `registered_at`) and returns `{ enrolled: true, groupIndex, ... }`. Group index = (enrolled row count) % permutation count.
  - **session**: Appends row to `sessions`; increments `sessions_completed` (column resolved by header name).
  - **upload_photo**: Same as before.
- Sheets: `_getSheet(name)` creates `participants`, `sessions`, or `registration_attempts` if missing.

### CORS

Apps Script Web App is invoked from the frontend origin. No custom CORS headers are set; the script is deployed with “Anyone” access. Frontend uses simple GET and POST with JSON body; avoid adding custom headers that trigger preflight if you see CORS issues.

---

## Configuration and Extending

### Change number of sessions (e.g. 2 → 3)

1. **js/config.js**: Set `numSessions: 3` and add a third object to `tracks` (e.g. `{ id: 'ambient', label: 'Ambient', youtubeId: '...' }`). Permutations will auto-include 6 groups.
2. **apps-script/Code.gs**: Set `TRACKS = ['pop','trance','ambient']` and `NUM_SESSIONS = 3`. Redeploy.

### Change or add survey questions

Edit `session1Activity`, `preTasks`, and/or `postTasksPart1` / `postTasksSession2Extra` / `postTasksPart2` in `js/config.js`. If you add Session-2-only items, use `postTasksSession2Extra` or extend `buildPostTasksForSession` in `session.js`. Each item:

- **Scale**: `{ id, text, type: 'scale', min, max, minLabel, maxLabel }` (min may be **0** for RPE).
- **Radio**: `{ id, text, type: 'radio', options: [...] }`.
- **Text**: `{ id, text, type: 'textarea', required: false|true, showIf?: { questionId, equals }, placeholder? }`.

Ids become keys in the stored JSON.

### API URL

After deploying the Web App, copy the “Web app URL” and set `EXPERIMENT_CONFIG.apiUrl` in `js/config.js` to that URL (including `/exec`).

---

## Data Stored

- **Participants sheet**: One row per **enrolled** participant: `id`, `name`, `email`, `age`, `gender` (`male` / `female` / `other`), `group_index`, `group_label`, `sessions_completed`, `registered_at`. (`name` may be empty.) Upgrade existing sheets by inserting missing columns after `age`.
- **registration_attempts sheet**: Same demographics plus `injury_unsafe`, `availability_yes`, `enrollment_status`, `participant_id`, consent flags.
- **Sessions sheet**: One row per completed session; `contact_sheet_url` filled when photo upload succeeds.
- **Drive**: One JPEG per session that had photo capture enabled; name pattern includes email and session number.

Export from Sheets to CSV or use Google Sheets API for analysis in R/Python.
