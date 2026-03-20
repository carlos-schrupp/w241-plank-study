# Registration form — consolidated draft (pre-implementation)

**Status:** **Registration is largely implemented** in `index.html` + `apps-script/Code.gs` (including **gender**, `registration_attempts`, screen-outs). Keep this file for IRB copy alignment and backend schema notes; update it when you change consent wording or fields.

**Goal:** Keep the strongest parts of the **original Google Form** (clarity, eligibility, consent framing) and the **current app** (Session 1 scheduling, calendar links, in-study flow). **There is no PDF:** all exercise instructions and assigned-music context are delivered **inside the session flow** of the website.

**Approved copy decisions (this version):**

- **IRB-visible study title:** **Physical Performance Study** (matches the original Google Form title).
- **Consent:** One **combined** checkbox for “read + agree to participate + data use” (replaces separate 5b and 5c).
- **Spelling:** **American English** (e.g. *anonymized* where applicable; *de-identified* is acceptable US usage).
- **Age:** Collect **Age** as on the original form; **do not** state, imply, or enforce a **minimum age** in copy or validation (no 18+ language, no min/max rules unless IRB later requires otherwise).
- **Injury = Yes:** Participant is **not** enrolled (no group assignment / no session links), but the attempt is **stored** for statistics (see §8).
- **PDF:** **Not** provided; description states that instructions are **in the app** during sessions (no PDF link).

---

## 1. What this draft combines

| Element | From Google Form | From current app | Draft choice |
|--------|------------------|------------------|--------------|
| Study title | Physical Performance Study (form title) | Plank Exercise… | **Physical Performance Study** (IRB-aligned). |
| Study purpose & voluntary participation | Yes | Partial | **Form-style intro** + **in-app instructions** (no PDF). |
| Confidentiality & email use | Yes | Partial | **Form-style language** explicitly. |
| Session count, duration, spacing | Yes | Enforced later in flow | **State on registration** (≤10 min, 2 sessions, 24–72 h). |
| Email | Required | Required | **Keep required**; helper text matches Form intent. |
| Age | Required | Missing | **Add required age** field. **No** minimum/maximum age in UI copy or validation (per current protocol decision). |
| Injury / safety | Dedicated Yes/No | Merged checkbox | **Dedicated Yes/No** matching Form stem; BP wording stays as separate checkbox (§5a). |
| Availability attestation | Yes/No | Implicit | **Add required Yes** (same as Form). |
| Consent | Single “read + agree” | Separate blocks | **One combined checkbox** for read + participate + data use (§5b). |
| Full name | Not on your pasted Form | Required | **Optional** with label note; backend must allow blank name. |
| Session 1 time | Not on Form | Required | **Keep.** |
| Researcher contact | Context in Form | Missing | **Add** short line with contact email. |
| Instructions format | PDF mentioned historically | In-app | **Only** in-app session instructions; **no** PDF sentence or link. |

---

## 2. Suggested page structure (order on screen)

1. **Header** — e.g. UC Berkeley MIDS — W241; **title:** **Physical Performance Study**; experiment ID if needed.
2. **Study description** (static block — §3).
3. **Contact** (one line — PI email).
4. **Form fields** (§4).
5. **Safety, eligibility & consent** (§5).
6. **Session 1 scheduling** (§6).
7. **Submit** button.
8. **Success view** (only if enrollment completed — §7). Screen-outs still **submit** to backend for logging (§8).

---

## 3. Study description (proposed static text)

Use as one block above the fields. Edit for exact IRB wording.

> **Physical Performance Study — registration**
>
> You are invited to participate in a research study examining how **music** affects **physical performance** during a short exercise task (**forearm plank**). In each session you will open the study website, follow **on-screen instructions** in your browser, and perform a plank while listening to the **assigned audio** for that session (order varies by participant to keep the study fair). **All task instructions are provided in the website during your sessions; no separate PDF is used.**
>
> The study has **two sessions**. Each session takes **no more than about 10 minutes** (including setup and short questions). The two sessions should be completed **at least 24 hours apart** and **no more than 72 hours apart**.
>
> **Participation is voluntary.** You may **withdraw at any time** without penalty.
>
> **Confidentiality:** Your responses will be kept **confidential**. Your **email** will only be used to **link your answers across the two sessions** and to provide **study links and reminders** (e.g. calendar events). It will not be used for unrelated marketing.
>
> **Data use:** With your consent below, **de-identified** or limited data may be used for **academic research** and reporting, consistent with your consent and institutional policies.
>
> If you have questions, contact the researcher at **carlos.schrupp@berkeley.edu**.

---

## 4. Field specifications (draft)

| # | Field ID (suggested) | Label & input | Required? | Notes / validation |
|---|----------------------|-----------------|-----------|---------------------|
| F1 | `email` | **Email address** | **Yes** | Type: email. Helper: *Required — we use this only to match Session 1 and Session 2 and to send your session link (e.g. in your calendar).* |
| F2 | `age` | **Age** | **Yes** | Type: number (integer). **Do not** display or enforce a minimum or maximum age in the app unless IRB requires it later. |
| F2b | `gender` | **Gender** | **Yes** | Type: radio. Options: **Male** / **Female** / **Other**. Stored as `male` / `female` / `other`. |
| F3 | `display_name` | **Full name (optional)** | **No** | Type: text. Helper: *Optional. If provided, we may use it only for internal study management; your email is the main key to pair sessions.* Placeholder: “Jane Smith”. |
| F4 | `injury_unsafe` | **Do you have any injuries or medical conditions that would make performing a plank exercise unsafe for you?** | **Yes** | Type: radio. Options: **No** / **Yes**. If **Yes**: show safety message and **do not** show enrollment success (no calendar / no group). **Still send** payload to backend to **log** the attempt (§8). |
| F5 | `availability` | **Are you available to complete two sessions, each lasting no more than 10 minutes, at least 24 hours apart but no more than 72 hours apart?** | **Yes** | Type: radio. Options: **Yes** / **No**. If **No**, block enrollment UI and **log** attempt if you want symmetry with injury logging (recommended for statistics). |
| F6 | `session1_datetime` | **When would you like to start Session 1?** | **Yes** (only if F4=No and F5=Yes) | Type: `datetime-local`. Helper: *Pick a time when you have a quiet space, comfortable clothing, and ~10 minutes.* |

---

## 5. Safety, blood pressure & consent (proposed checkboxes)

**Checkbox 5a — Blood pressure / medical caution (required for enrollment path)**  
> I understand that isometric exercises such as forearm planks can **temporarily increase blood pressure**. I do **not** have **uncontrolled hypertension**. If I am unsure whether exercise is safe for me, I will **consult a qualified health professional** before participating.

**Checkbox 5b — Combined: read, agree to participate, and data use (required for enrollment path)**  
> I have **read** the study description on this page, **agree to participate** in this study, and **consent** to the **research team** using my study data **as described above** (including **de-identified** or aggregated reporting where permitted by this project and my institution).

*(Single checkbox replaces the former separate “read + agree” and “data use” lines.)*

---

## 6. Session 1 scheduling (from app)

Shown only when the participant passes injury and availability (both eligible).

- **Label:** When would you like to start Session 1?  
- **Help:** Same as F6.  
- **Behavior:** On successful **enrollment**, show **Google Calendar** + **.ics** with embedded `session.html?email=...&session=1`.

Optional helper:

> *Session 2 will be scheduled from the website **after** Session 1, within the 24–72 hour window.*

---

## 7. Success screen (enrollment only)

- Shown **only** when participant is **enrolled** (injury No, availability Yes, checkboxes checked, submit succeeded).  
- Keep: enrolled confirmation, **group / session order**, Session 1 time, calendar buttons, “Before Session 1” bullets.  
- Display *Registered as: [email]* and show name only if provided.

**Screen-out UX (injury Yes or availability No):** Clear message (safety or scheduling); **no** calendar links. Backend still records the attempt (§8).

---

## 8. Backend / data model — enrollment + screened-out attempts

**Requirement:** Store submissions where **injury = Yes** (and, if desired, **availability = No**) for **statistics**, even when the participant is **not** enrolled.

### Option A — Recommended: `registration_attempts` sheet

Every submit from the registration form creates one row (server-side), including screen-outs.

| Column (example) | Notes |
|------------------|--------|
| `attempt_id` | UUID |
| `attempted_at` | ISO timestamp |
| `email` | As entered (required on form even for screen-out, for traceability; hash in analysis if needed for privacy policy) |
| `name` | Optional; empty allowed |
| `age` | Number |
| `gender` | `male` / `female` / `other` |
| `injury_unsafe` | `yes` / `no` |
| `availability` | `yes` / `no` |
| `session1_planned_at` | ISO or empty if screen-out before scheduling |
| `enrollment_status` | e.g. `enrolled` / `screened_out_injury` / `screened_out_availability` / `screened_out_consent` (if you validate checkboxes server-side) |
| `participant_id` | Fill only if `enrolled` (links to `participants.id`) |

**Enrolled** participants: still add/update **`participants`** as today (id, name, email, group…), plus you can mirror one row in `registration_attempts` with `enrollment_status=enrolled` for a single analysis table.

### Option B — Single `participants` sheet with status

Add columns such as `enrollment_status`, `injury_unsafe`, `availability_no`, etc., and only assign `group_index` when `enrolled`. Works but mixes enrolled and non-enrolled rows in one table — fine if you filter in analysis.

**Register payload** (`doPost` `action: "register"`): must accept all fields, **always** log attempts when injury=yes or availability=no, and only run group assignment + success response when eligible.

---

## 9. Implementation checklist (after you approve this draft)

- [ ] `index.html`: title **Physical Performance Study**; study text §3; American spelling; no PDF; combined 5b; age field without min/max; optional name; injury + availability radios; screen-out messages; log API on screen-out.  
- [ ] Client: submit payload for **all** terminal actions (enroll + screen-out) to log statistics.  
- [ ] `Code.gs`: `registration_attempts` (or chosen schema); `_handleRegister` branches; allow blank `name`; no age min/max.  
- [ ] Migrate / create Sheets columns.  
- [ ] Contact email in live app matches **carlos.schrupp@berkeley.edu** (see study description §3).  
- [ ] Update `docs/survey_questions_draft.md` registration section to match final approved text.  
- [ ] IRB final sync.

---

## 10. Resolved decisions (reference)

| Topic | Decision |
|-------|-----------|
| Consent layout | **Single** combined checkbox (5b) for read + participate + data use. |
| Study title on page | **Physical Performance Study**. |
| Minimum age | **Do not** mention or enforce in app (age still collected). |
| Injury Yes | **Do not enroll**; **do store** attempt for statistics (e.g. `registration_attempts`). |
| Spelling | **American** English. |
| PDF | **None**; instructions **only** in session flow; stated in §3. |

---

*Draft version: consolidated from Google Form + current app registration. Revise freely; then approve for engineering implementation.*
