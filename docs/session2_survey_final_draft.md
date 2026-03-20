# Session 2 survey — gap analysis and final draft (pre-implementation)

**Context:** The legacy Google Form for **Session 2** repeats the **core exercise + mood + exertion** flow but **omits Session-1-only demographics** (age, gender, activity habits). It adds **study-closure** items: ease of following instructions (legacy: PDF) and **overall participation experience**. The **app** should mirror Session 1 improvements: **timer** for duration (no self-report), **assigned audio** in-browser (no PDF / no “Session-2 track” wording), neutral labels (Audio A / B).

**Implemented in app:** **Email** comes from the session URL + registration. **`session.html` Step 1** shows an **Important** callout—for **Session 2**, the text matches the legacy line (**registered and completed Session 1**; session link should match your account). **Session 1** uses the same pattern without referring to “completed Session 1” (see `setupSafetyStep` in `session.js`).

**Relationship to Session 1 draft:** Pre-plank **energy** and **motivation** stems match **[session1_survey_final_draft.md](session1_survey_final_draft.md) §4.1** (1–7, legacy anchors). Post-plank **RPE**, **headphones**, and **pause/restart** match **session1** **§4.3**. Session 2 **does not** include session1 **§4.2** (activity background) unless you deliberately add a verification block.

**Principles**

- **Keep** pre-task timing: questions while **assigned audio** plays, before “Start plank.”
- **Replace** all **PDF** and **“music track assigned under Session-2”** language with **website / on-screen / assigned audio** wording.
- **Do not** ask **self-reported plank duration**; **`plank_duration_sec`** from the timer is authoritative.
- **Add** Session-2-specific legacy items: **instructions ease** (rewritten), **overall experience** (1–5).

---

## 1. Timing comparison

| Phase | Google Form (Session 2) | Current app |
|-------|-------------------------|-------------|
| Intro | PDF + “Session-2” track; second/final session | In-app steps + **assigned audio**; neutral UI labels; “Session 2 of 2” already shown |
| Identity | Email *, same as Session 1 | Email from URL / Step 1 confirmation — **covered** |
| Before plank | Energy 1–7 *, motivation 1–7 * (after **assigned audio** began) | **preTasks**: shorter scales + different stems — **gap** vs legacy (same as Session 1 analysis) |
| Plank | Self-reported seconds * | **Timer** — **covered** |
| After plank | RPE 0–10 *, headphones *, pause/restart * + conditional text | Partially aligned — **gaps** (RPE origin, headphones, pause) same as Session 1 |
| Closure | PDF instructions ease 1–5; overall experience 1–5; comments | **Not in app** — **gap** (Session 2 post-task extensions) |

---

## 2. Item-by-item gap table (Session 2 legacy)

| # | Legacy item | In app today? | Gap / note |
|---|-------------|---------------|------------|
| 1 | **Email** * | URL + Step 1 | **Covered** |
| 2 | **Plank hold (seconds)** * self-report | Timer → `plank_duration_sec` | **Covered** — do not ask |
| 3 | **Physically energized** after **assigned audio** began, before plank (1–7) * | `physical_feeling` 1–5, different stem | **Gap** — align to legacy **1–7** + stem (**session1 §4.1**) |
| 4 | **Motivated to perform well** after **assigned audio** began, before plank (1–7) * | `motivation` 1–5, different stem | **Gap** — align (**session1 §4.1**) |
| 5 | **RPE** immediately after plank (0–10) * | `rpe` 1–10, different anchors | **Gap** — **0–10** + legacy anchors (**session1 §4.3**) |
| 6 | **Headphones** during plank * | No | **Gap** (**session1 §4.3**) |
| 7 | **Pause/restart** * + conditional describe | No | **Gap** (**session1 §4.3**) |
| 8 | **Ease: follow PDF instructions** (1–5) | No | **Gap** — reword to **on-screen / website instructions** (**§4.3** below) |
| 9 | **Overall experience** in study (1–5) | No | **Gap** — **post-task**, Session 2 only (**§4.3** below) |
| 10 | **Comments/suggestions** (optional) | `comments` optional | **Covered** — can reuse stem “comments or suggestions about your experience” for Session 2 |

**Not on Session 2 legacy (vs Session 1):** Age, gender, activity level, plank frequency, volume-clarity item (unless you want parity — optional add from Session 1 **§4.3** `volume_clear`).

---

## 3. Where blocks live in the app

| Block | When | Session 2 |
|--------|------|-----------|
| **preTasks** | Step 4 — audio playing | Same constructs as Session 1 final draft **§4.1** (energy, motivation; optional audio liking) |
| **postTasks** | Step 5 — after STOP | Shared items per **session1 §4.3**; add Session-2-only **`instructions_ease`** and **`overall_experience`** (**§4.3** below) |
| **Activity / demographics** | Session 1 only | **Omit** for Session 2 (matches legacy) |

**Implementation note:** Today `preTasks` / `postTasks` are **one list** for all sessions in `config.js`. To match legacy, use **`sessionNum`**-keyed arrays in config or merge lists in `session.js` (e.g. `postTasksSession2 = basePostTasks.concat(session2Only)`).

---

## 4. Final draft — question text and scales

### 4.1 Pre-task (same as Session 1 — while assigned audio plays, before plank)

Use the same table as **[session1_survey_final_draft.md](session1_survey_final_draft.md) §4.1** (`energy_pre_plank`, `motivation_pre_plank`, optional `music_liking` wording with **audio** not “music” in participant-facing text).

### 4.2 Post-task — shared with Session 1 (immediately after plank)

Use **[session1_survey_final_draft.md](session1_survey_final_draft.md) §4.3** for: `rpe` (0–10), `headphones`, `plank_pause`, `plank_pause_detail`, optional `volume_clear`, optional `music_effect`, `form_quality`, `comments`.

**Session 2 choice:** Omit `volume_clear` if it was only on Session 1 legacy; **include** if you want symmetry across sessions.

### 4.3 Session 2 only — closure (after shared post-task items)

Place after procedural items (e.g. after pause/restart, before or after form_quality — your UX choice). Suggested order: RPE, headphones, pause/restart, **instructions ease**, **overall experience**, optional mechanism items, comments last.

| ID | Type | Question | Scale / options |
|----|------|----------|-----------------|
| `instructions_ease` | scale | How **easy** was it for you to follow the **instructions provided in the study website** (including the plank and audio steps)? | **1** = Very difficult … **5** = Very easy |
| `overall_experience` | scale | How would you rate your **overall experience** participating in this study? | **1** = Very negative … **5** = Very positive |

**Mapping from legacy:** Replaces “PDF document” with **study website**; keeps 1–5 anchors.

### 4.4 Comments (optional)

| ID | Type | Question |
|----|------|----------|
| `comments` | textarea | Do you have any **comments or suggestions** about your experience in this study? (Optional) |

---

## 5. Intro / framing copy (replace PDF + Session-2 track)

**Legacy opening** referenced PDF and “music track assigned to you under Session-2.” **Replace** with neutral website copy, e.g. for Step 1 helper or a one-time banner when `sessionNum === 2`:

> **Physical Performance Study — Session 2**  
> In this session you will perform a **forearm plank** while listening to the **assigned audio** for this session in the **study website**. Follow the **on-screen instructions** carefully. Complete the plank **before** the post-exercise questions, and exercise safely and to the best of your ability. **This is the second and final session.** Thank you for participating.

**Email (shown on Step 1 in the app for Session 2):**

> **Important:** Use the same email address you used when you registered and completed Session 1 (your session link should already match your account).

Contact: **carlos.schrupp@berkeley.edu** (`EXPERIMENT_CONFIG.researcherEmail`).

---

## 6. Implementation checklist

- [x] **`postTasksSession2Extra`** in `config.js`; merged in `buildPostTasksForSession` when `sessionNum === 2`.  
- [x] Session 2 inherits Session 1 **preTasks** and shared post items (1–7 pre, 0–10 RPE, etc.).  
- [x] No PDF / track / tempo / genre in participant UI.  
- [x] **[survey_questions_draft.md](survey_questions_draft.md)** updated.  

---

*Session 2 draft pairs with **session1_survey_final_draft.md**; implement both for full legacy parity.*
