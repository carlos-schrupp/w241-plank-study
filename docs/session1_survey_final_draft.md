# Session 1 survey — gap analysis and final draft (pre-implementation)

**Context:** The legacy Google Form mixed **demographics**, **pre-plank state**, **self-reported plank duration**, and **post-plank** items in one long form. The **app** improves data quality by: (1) capturing plank duration with a **timer** (not self-report), (2) asking **core pre-state questions while assigned audio is playing** before the plank, and (3) separating **safety/instructions/audio** into guided steps.

**Implemented elsewhere (do not duplicate in session):** **Age** and **gender** (Male / Female / Other) are collected on **`index.html` registration** only. See **survey_questions_draft.md** §1 and **registration_form_draft.md**.

**Principles for this draft**

- **Keep** the app’s pre-plank timing (questions during **assigned audio**, before “Start plank”).
- **Align** scales and stems with the **Google Form** where they measure the same construct.
- **Add** all **Google Form items** that are **missing** in the app, placing them in the right **moment** (Session 1-only demographics vs pre vs post).
- **Drop** redundant items: **email** (session link + registration), **PDF** references. **Age** and **gender** are **not** asked again in the session flow: **age** is collected **once** at **registration**; **gender** is **not** repeated in Session 1—if your IRB requires it, add **gender once** on the **registration** form only (not in session).
- **Session 2:** This file focuses on **Session 1** parity. For the legacy **Session 2** form (second/final session, PDF instructions ease, overall experience), see **[session2_survey_final_draft.md](session2_survey_final_draft.md)**. Session 2 should **repeat** procedural/post items and **omit** Session-1-only demographics unless you want a short verification block.

---

## 1. Timing comparison

| Phase | Google Form (Session 1) | Current app |
|--------|-------------------------|-------------|
| Intro | Refers to PDF + stimulus in PDF | In-app instructions + **assigned audio** in app (no PDF); UI labels neutral (Audio A / B) |
| Identity | Email, age, gender, activity habits | Email from URL; **age** (and **gender** if used) **only at registration** — **not** in session |
| Before plank | “After **audio** began, before plank”: energy 1–7, motivation 1–7 | **preTasks** while **assigned audio** plays: motivation 1–5, “physical feeling” 1–5, liking of **this session’s audio** 1–5 |
| Plank | Self-reported seconds | **Timer** (objective duration stored as `plank_duration_sec`) |
| After plank | RPE 0–10, headphones, pause/restart + conditional text, volume clarity | **postTasks**: RPE 1–10 (different anchors), audio effect (`music_effect`) 1–5, form quality radio, optional comments |

---

## 2. Item-by-item gap table

| # | Legacy Google Form item | In app today? | Gap / note |
|---|-------------------------|---------------|------------|
| 1 | **Email** * | Implicit (URL + backend) | **Covered** — no need to re-ask unless you want a typed confirmation field (not recommended). |
| 2 | **Age** * | Registration only | **Covered** at registration; **do not** ask again in session. |
| 3 | **Gender** * | Not in app (legacy form only) | **Decision:** If needed for IRB/analysis, add **once** on **registration**; **do not** ask again in session. If not needed, omit everywhere. |
| 4 | **Regular gym-goer / physically active** * (3 ordered options) | No | **Gap** — add (Session 1 only recommended). |
| 5 | **What type of physical activity do you usually do?** (open) | No | **Gap** — optional textarea (Session 1 only recommended). |
| 6 | **Do you regularly perform planks?** * (same 3-way frequency) | No | **Gap** — add (Session 1 only recommended). |
| 7 | **Plank duration (seconds)** * | Timer + `plank_duration_sec` | **Covered** — do **not** ask self-report; timer is authoritative. |
| 8 | **Energized after audio began, before plank** (1–7, low–high energy) | Partial: “physical feeling” **1–5**, different stem | **Gap** — replace or add with Form **1–7** and exact stem. |
| 9 | **Motivated to perform well after audio began, before plank** (1–7) | “How motivated to exercise right now?” **1–5** | **Gap** — align stem + **1–7** scale to match legacy. |
| — | *(not on legacy form)* | **Audio liking** (`music_liking` in JSON) 1–5 | **App-only** — **Keep** (useful manipulation check); keep during pre-task. |
| 10 | **RPE immediately after plank** (0–10, anchors: 0 none, 5 somewhat hard, 10 max) | RPE **1–10** (“very easy” to “max effort”) — **wrong scale origin** | **Gap** — change to **0–10** with Form anchors (Borg-style wording). |
| 11 | **Headphones during plank?** * | No | **Gap** — add post-task. |
| 12 | **Pause or restart plank?** * + conditional describe | No | **Gap** — add post-task Yes/No + optional textarea if Yes. |
| 13 | **Audio volume instructions clear?** * (Yes / Somewhat / No) | No | **Gap** — add post-task. |
| — | *(not on legacy form)* | **Audio effect on performance** (`music_effect`) 1–5 | **Optional keep** — distinct from volume clarity; good for mechanisms. |
| — | *(not on legacy form)* | **Form quality** radio + **comments** | **Optional keep** — strong for exclusion rules / QC; **recommend keep** at least form quality or merge with “pause/restart”. |

---

## 3. Where to place new items in the app

| Block | When | Content |
|--------|------|---------|
| **A. Session 1 activity background** | After **Step 1 (safety)** or after **Step 2 (instructions)**, **only if `session === 1`** | Activity frequency *, plank frequency *, optional activity type (textarea). **No** age or gender here (those belong at **registration** only). **Do not** place here: energy/motivation (those belong during **assigned audio**, Step 4). |
| **B. preTasks** | **Step 4** — **assigned audio** already playing | Add/replace per §4.1. Target still ~60–90 seconds. |
| **C. postTasks** | **Step 5** — immediately after **STOP** | Add/replace per §4.2. Show timer readout; do **not** ask duration. |

**Implementation note:** Demographics are **not** in `preTasks` today; `session.js` only renders `preTasks` / `postTasks`. You will need either:

- a small **session1Activity** config (e.g. `session1Demographics` rename) rendered in `session.js` when `sessionNum === 1`, or  
- extra steps in `session.html` (static sections + IDs).

Backend: either merge demographics into `pre_task_answers` JSON on Session 1 only, or add columns—JSON is simpler.

---

## 4. Final draft — question text and scales

### 4.1 Pre-task (while **assigned audio** plays, before plank)

*Order suggestion: energy, motivation, audio liking / manipulation check last.*

| ID | Type | Question | Scale / options |
|----|------|----------|-----------------|
| `energy_pre_plank` | scale | After the **assigned audio** began, but **before you started the plank**, how **physically energized** did you feel? | **1** = Extremely low energy … **7** = Extremely high energy |
| `motivation_pre_plank` | scale | After the **assigned audio** began, but **before you started the plank**, how **motivated** were you to **perform well on the task**? | **1** = Not at all motivated … **7** = Extremely motivated |
| `music_liking` | scale | How much do you like **this session’s audio** so far? | **1** = Strongly dislike … **7** = Love it *(optional: keep 1–5 if you want shorter UI; draft prefers **7** for parity with other pre moods)* |

**Note:** Dropping the old 1–5 “exercise motivation” and “physical feelingPoor–Great” avoids duplication with the two **legacy-aligned** items above; **audio liking** (`music_liking`) stays as app value-add.

---

### 4.2 Session 1 only — activity background (before or after instructions per §3)

**Not included here:** **Age** and **gender** — collected only at **registration** (add gender to registration if IRB requires it).

| ID | Type | Question | Response |
|----|------|----------|----------|
| `activity_level` | radio | Are you a **regular gym-goer** or **physically active**? | **Yes, regularly (≥ 3 times per week)**; **Occasionally (1–2 times per week)**; **No, rarely or never** |
| `activity_type` | textarea | What **type of physical activity** do you **usually** do? | Optional — placeholder “Optional” |
| `plank_frequency` | radio | Do you **regularly perform planks**? | Same three options as `activity_level` |

---

### 4.3 Post-task (immediately after plank; **both** sessions)

| ID | Type | Question | Scale / options |
|----|------|----------|-----------------|
| `rpe` | scale | Immediately after completing the plank, **how hard did the exercise feel overall**? | **0** = No exertion at all; **5** = Somewhat hard; **10** = Maximal exertion (hardest effort you could sustain). *Use 0–10 step.* |
| `headphones` | radio | Did you use **headphones** during the plank exercise? | **Yes** / **No** |
| `plank_pause` | radio | Did you **pause or restart** the plank at any point? | **Yes** / **No** |
| `plank_pause_detail` | textarea | If yes, please briefly describe what happened | **Required if** `plank_pause === Yes`; else hidden or optional |
| `volume_clear` | radio | Were the **audio volume** instructions clear? | **Yes** / **Somewhat** / **No** |
| `music_effect` | scale | *(Optional retention from current app)* How did **this session’s audio** **affect** your plank performance? | **1** = Hurt … **5** = Helped |
| `form_quality` | radio | *(Recommended retention)* How would you describe your **form** during the plank? | Same three options as current app |
| `comments` | textarea | Any other comments about this session? | Optional |

**Remove** from post-task any **duplicate** of plank **duration** (timer is source of truth).

---

## 5. Intro / framing copy (replace PDF language)

For **Session 1** header or Step 1 helper text, legacy form said: read PDF and Session-1 track in PDF. **Replace** with e.g.:

> In this session you will perform a **forearm plank** while listening to the **assigned audio** for this session in the study website. Follow the **on-screen instructions**. Complete the plank **before** the post-exercise questions. The study has **two sessions** with **different** assigned audio; sessions must be **at least 24 hours** and **no more than 72 hours** apart.

Contact: **carlos.schrupp@berkeley.edu** (already in `EXPERIMENT_CONFIG.researcherEmail`).

**Email consistency (implemented in app):** `session.html` **Step 1** shows an **Important** callout: use the **same email** you used when you **registered** (your session link should already match your account). Session 2 shows the same idea with **and completed Session 1** in the sentence; see **session2_survey_final_draft.md** §5.

---

## 6. Session 2

- **Reuse** pre-task block (same constructs; “this session’s audio” wording still applies).
- **Reuse** post-task block (same as Session 1).
- **Omit** Session 1 **activity background** block (§4.2) **unless** you want a minimal check — default for Session 2 = **omit**; age/gender never in session.

---

## 7. Implementation checklist

- [x] Extend `config.js` — **Session 1 activity** block; `preTasks` §4.1; post items via `postTasksPart1` / `postTasksPart2` and `buildPostTasksForSession` in `session.js`.  
- [x] `session.js` + `session.html`: Session 1 activity step; `showIf` for `plank_pause_detail`; RPE **0–10**.  
- [x] `renderQuestions`: conditional visibility + scale **min 0**.  
- [x] `Code.gs`: unchanged — extended JSON in `pre_task_answers` / `post_task_answers`.  
- [x] `docs/survey_questions_draft.md` updated.

---

*This document is the single source for Session 1 survey final draft until copied into `config.js` and `session.js`.*
