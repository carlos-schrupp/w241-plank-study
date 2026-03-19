# Survey and registration content — draft for review

This document mirrors what the site collects **today** (as defined in `index.html` for registration and `js/config.js` for in-session surveys). Use it to revise wording, scales, or structure before locking the final protocol.

**Implementation note:** Pre-task and post-task items in `config.js` are **one shared list** for every session (Session 1, Session 2, and any future Session 3). If you need *different* questions on Session 2 than on Session 1, you will need a small code change (e.g. separate arrays keyed by `sessionNum`) in addition to editing this document.

---

## Overview: when each instrument appears

| Phase | Page | When (participant experience) | Stored as |
|-----|------|------------------------------|-----------|
| Registration | `index.html` | Once, before any session; after submit, calendar links for Session 1 appear | `participants` row in Google Sheet (name, email, group assignment; Session 1 scheduling time is **not** a column—only used for calendar event) |
| Pre-task survey | `session.html` (Step 4) | **After** music has started and participant tapped through audio step; **before** they tap “I’m ready — Start plank.” Music continues during this short form (~target: ~60 seconds). Same flow for Session 1 and Session 2; **today’s audio is whatever track is assigned for that session** (Latin-square order). | JSON in `sessions.pre_task_answers` |
| Post-task survey | `session.html` (Step 5) | **Immediately after** they tap STOP on the plank timer; plank duration is shown read-only above the questions. Same items for Session 1 and Session 2 in the current app. | JSON in `sessions.post_task_answers` plus `plank_duration_sec` |

---

## 1. Registration (`index.html`)

**Moment:** One-time enrollment. Participant has not yet done any plank in the study. They choose when Session 1 will be and receive calendar event(s) with the Session 1 link embedded.

### Fields (free text / structured)

1. **Full name**  
   - Label: “Full Name”  
   - Type: text  
   - Purpose: identify / contact; stored in Sheet.

2. **Email address**  
   - Label: “Email Address (used to match your sessions)”  
   - Type: email  
   - Purpose: key to merge Session 1 and Session 2 (and backend lookup). Must be consistent across sessions.

3. **Session 1 date and time**  
   - Label: “When would you like to do Session 1?”  
   - Type: `datetime-local`  
   - Helper text: “Choose a time when you have a quiet space and comfortable clothing.”  
   - Purpose: only drives the **calendar event** creation in the browser (not stored as a dedicated column unless you add that to the backend later).

### Safety and consent (checkboxes, all required to register)

**Checkbox A — Safety**

> I understand that forearm planks temporarily raise blood pressure. I do not have uncontrolled hypertension and I am not currently injured. If unsure, I will consult a doctor before participating.

**Checkbox B — Consent**

> I consent to participate in this study and for my anonymised data to be used for academic research.

### After registration (not “questions” but useful for revision)

- Success screen shows **group assignment** (session order of audio conditions, derived from Latin square).
- User is offered **Google Calendar** link and **.ics** download; event description includes deep link: `session.html?email=…&session=1`.

---

## 2. Session 1 — Pre-task survey (`config.js` → `preTasks`)

**Moment:** Participant is in **Session 1**, on the session page, **after** instructions and **after** they confirmed the assigned track is playing. They answer while **music is still playing**, before entering the full-screen plank timer. All three items are **required** in the UI (no `required: false`).

| ID (stored key) | Type | Question text | Response scale / options |
|-----------------|------|---------------|---------------------------|
| `motivation` | Scale 1–5 | How motivated are you to exercise right now? | **1** = Not at all … **5** = Very motivated |
| `physical_feeling` | Scale 1–5 | How are you feeling physically right now? | **1** = Poor … **5** = Great |
| `music_liking` | Scale 1–5 | How much do you like today's music so far? | **1** = Strongly dislike … **5** = Love it |

**Revision prompts for you:**

- “Today’s music” in Session 1 is the **first** condition in that participant’s order; consider whether the wording should name the genre or stay blind.
- Consider whether you want **attention checks** or **manipulation checks** here while music is salient.

---

## 3. Session 1 — Post-task survey (`config.js` → `postTasks`)

**Moment:** Session 1 plank **just ended**; timer stopped; duration displayed. Participant is still on the same page, **before** submit and **before** scheduling Session 2.

| ID (stored key) | Type | Question text | Response scale / options |
|-----------------|------|---------------|---------------------------|
| `rpe` | Scale 1–10 | Rate your perceived exertion (1 = very easy, 10 = maximum effort) | **1** = Very easy … **10** = Max effort |
| `music_effect` | Scale 1–5 | How did the music affect your plank performance? | **1** = Hurt my performance … **5** = Helped my performance |
| `form_quality` | Radio (single choice) | How would you describe your form during the plank? | (1) Maintained proper form throughout; (2) Mostly good — minor breaks corrected; (3) Form failed — I stopped due to form breakdown |
| `comments` | Textarea (optional) | Any comments about this session? (optional) | Free text; **not** required |

---

## 4. Session 2 — Pre-task survey

**Moment:** Same screen and **same question objects** as Session 1 pre-task: after audio step, music playing, **before** “Start plank.” The **track** differs from Session 1 for almost all participants (crossover order), but the **stem** of each item is unchanged in code.

**Verbatim items** (identical to Section 2):

1. **motivation** — “How motivated are you to exercise right now?” (1–5, Not at all … Very motivated)
2. **physical_feeling** — “How are you feeling physically right now?” (1–5, Poor … Great)
3. **music_liking** — “How much do you like today's music so far?” (1–5, Strongly dislike … Love it)

**Revision prompts for you:**

- Session 2 may be **24–72 hours** after Session 1; consider whether `physical_feeling` should reference “relative to yesterday” or stay state-based.
- **Order effects**: first vs second exposure to each genre; you may want session-specific wording (requires code split).

---

## 5. Session 2 — Post-task survey

**Moment:** Session 2 plank **just ended**; same as Section 3 but for the second scheduled session.

**Verbatim items** (identical to Section 3):

1. **rpe** — 1–10 perceived exertion  
2. **music_effect** — 1–5 hurt vs helped  
3. **form_quality** — three radio options  
4. **comments** — optional textarea  

**Revision prompts for you:**

- Consider adding **fatigue** or **sleep** if spacing is tight.
- If you randomize or counterbalance order, **music_effect** might reference “this session’s music” explicitly.

---

## 6. Optional: form verification camera (not survey)

**Moment:** Toggle appears on the pre-task step (before plank). If enabled, 1 fps stills during plank; not questionnaire content.

---

## Where to edit after you finalize copy

| Content | File |
|---------|------|
| Registration labels and consent text | `index.html` |
| Pre-task and post-task items (wording, scales, new questions) | `js/config.js` → `preTasks`, `postTasks` |

If you split Session 1 vs Session 2 question sets, plan to update `js/session.js` (which reads `EXPERIMENT_CONFIG.preTasks` / `postTasks`) and document the storage shape so analysis scripts match.
