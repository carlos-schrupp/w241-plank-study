# Survey and registration content — reference

This document describes what the site collects **as implemented** in `index.html` (registration) and `js/config.js` + `js/session.js` (in-session surveys). Design rationale and legacy alignment: **[session1_survey_final_draft.md](session1_survey_final_draft.md)**, **[session2_survey_final_draft.md](session2_survey_final_draft.md)**.

**Implementation note:** `preTasks` is shared across sessions. **Session 1** adds **`session1Activity`** (after instructions, before audio); answers are **merged into** `pre_task_answers` JSON on submit. **Post-task** lists are built in `session.js` from **`postTasksPart1`**, optional **`postTasksSession2Extra`** (when `sessionNum === 2`), **`postTasksPart2`**, and a **`comments`** item (wording differs Session 1 vs 2).

---

## Overview: when each instrument appears

| Phase | Page | When (participant experience) | Stored as |
|-------|------|------------------------------|-----------|
| Registration | `index.html` | Once, before any session; study information text; then fields and submit | **`participants`** row if enrolled; **`registration_attempts`** row for **every** submit (including screen-outs) |
| Session 1 activity | `session.html` | After instructions, **before** audio; **Session 1 only** | Keys merged into **`sessions.pre_task_answers`** with pre-task audio block |
| Pre-task survey | `session.html` | After **audio** has started; before “I’m ready — Start plank.” Audio continues. | JSON in `sessions.pre_task_answers` (with S1 activity keys if Session 1) |
| Post-task survey | `session.html` | Immediately after STOP on the timer; duration read-only above questions. | JSON in `sessions.post_task_answers` plus `plank_duration_sec` |

**Not asked in session:** **Age** and **gender** — only at **registration**.

---

## 1. Registration (`index.html`)

**Moment:** One-time enrollment. Study title: **Physical Performance Study**. In-app study description (no PDF): voluntary participation, confidentiality, email use, two sessions, timing window, de-identified data, contact **carlos.schrupp@berkeley.edu** (also in `EXPERIMENT_CONFIG.researcherEmail`).

### Fields (order on screen)

| Field | Required | Notes |
|-------|----------|--------|
| **Email** | Yes | Key for sessions and calendar link. |
| **Age** | Yes | Integer; no min/max enforced in copy. Stored in Sheet. |
| **Gender** | Yes | **Male** / **Female** / **Other** → stored as `male` / `female` / `other`. |
| **Full name** | No | Optional; email remains primary key. |
| **Injury unsafe for plank?** | Yes | No / Yes. If **Yes** → screen-out message; attempt **logged**; not enrolled. |
| **Available** for two sessions (≤10 min each, 24–72 h apart)? | Yes | Yes / No. If **No** → screen-out; **logged**. |
| **Session 1 date/time** | If eligible | Shown only when injury=No and availability=Yes; `datetime-local`. |
| **Blood pressure / hypertension** checkbox | If enrolling | Required to enroll. |
| **Combined consent** (read, agree to participate, consent to data use) | If enrolling | Required to enroll. |

### Submit button

- Label: **Continue** (disabled until required fields valid).
- **Screen-out** paths still POST to the backend so attempts are recorded.

### After successful enrollment (or already registered)

- Success view: group / session order, Session 1 time, Google Calendar + .ics.
- **Already registered** email: same success UI with title “Already registered.”

### Related docs

- **[registration_form_draft.md](registration_form_draft.md)** — design rationale and backend schema notes.
- **Sheets:** `participants` columns include `id`, `name`, `email`, `age`, `gender`, `group_index`, `group_label`, `sessions_completed`, `registered_at`. **`registration_attempts`** logs all submissions with `enrollment_status` (e.g. `enrolled`, `screened_out_injury`, `screened_out_availability`, `already_registered`).

---

## 2. Session 1 only — activity background (`config.js` → `session1Activity`)

**Moment:** After **Exercise instructions**, before **audio**. Omitted for Session 2+.

| ID | Type | Question | Notes |
|----|------|----------|--------|
| `activity_level` | radio | Regular gym-goer / physically active? | 3 frequency options |
| `activity_type` | textarea | Type of activity usually done? | Optional |
| `plank_frequency` | radio | Regularly perform planks? | Same 3 options as `activity_level` |

---

## 3. Pre-task survey (`config.js` → `preTasks`)

**Moment:** Session page; **assigned audio** playing; before plank.

| ID | Type | Question (summary) | Scale |
|----|------|-------------------|--------|
| `energy_pre_plank` | scale | After audio began, before plank: how physically energized? | 1–7 |
| `motivation_pre_plank` | scale | After audio began, before plank: motivated to perform well? | 1–7 |
| `music_liking` | scale | How much like this session’s audio so far? | 1–7 |

---

## 4. Post-task survey (built in `session.js` from config parts)

**Moment:** Immediately after STOP.

**All sessions (order):** `rpe` (0–10), `headphones`, `plank_pause`, `plank_pause_detail` (required if pause Yes), then Session 2 only: `instructions_ease` (1–5), `overall_experience` (1–5), then `volume_clear`, `music_effect`, `form_quality`, `comments`.

| ID | Type | Notes |
|----|------|--------|
| `rpe` | scale 0–10 | Legacy anchors in question text |
| `headphones` | radio | Yes / No |
| `plank_pause` | radio | Yes / No |
| `plank_pause_detail` | textarea | Shown only if pause **Yes** |
| `instructions_ease` | scale 1–5 | **Session 2 only** |
| `overall_experience` | scale 1–5 | **Session 2 only** |
| `volume_clear` | radio | Yes / Somewhat / No |
| `music_effect` | scale 1–5 | |
| `form_quality` | radio | Three form options |
| `comments` | textarea | Optional; Session 2 wording asks about study experience |

---

## 5. Optional: form verification camera

**Moment:** Toggle before plank (pre-task step). Front camera preferred; 1 fps contact sheet uploaded after session submit when enabled.

---

## Where to edit

| Content | File |
|---------|------|
| Registration copy / fields | `index.html` (and `Code.gs` for new stored fields) |
| Session 1 activity | `js/config.js` → `session1Activity` |
| Pre-task items | `js/config.js` → `preTasks` |
| Post-task blocks | `js/config.js` → `postTasksPart1`, `postTasksSession2Extra`, `postTasksPart2`; merge logic + conditionals in `js/session.js` |
