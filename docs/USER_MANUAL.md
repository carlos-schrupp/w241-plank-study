# W241 Plank Experiment — User Manual

This manual has two parts: **Researcher setup** (one-time configuration and deployment) and **Participant instructions** (how to register and complete sessions).

---

## Part 1: Researcher Setup

### Prerequisites

- A Google account (for Sheets, Drive, Apps Script).
- A place to host the static site (e.g. Netlify, GitHub Pages, or a course server). The site is static HTML/JS; no server-side code runs on the host.

### Step 1: Google Sheets and Apps Script

1. Create a new Google Sheet (or use an existing one). This will hold participant and session data.
2. In the sheet, go to **Extensions > Apps Script**. Delete any sample code and paste in the full contents of `apps-script/Code.gs` from this project.
3. In `Code.gs`, set **DRIVE_FOLDER_ID**:
   - In Google Drive, create a folder for contact-sheet images (e.g. “W241 Plank contact sheets”).
   - Open the folder and copy the folder ID from the URL: `https://drive.google.com/drive/folders/FOLDER_ID_HERE`.
   - In the script, replace `'REPLACE_WITH_YOUR_GOOGLE_DRIVE_FOLDER_ID'` with that ID.
4. Ensure **TRACKS** and **NUM_SESSIONS** at the top of `Code.gs` match your design (e.g. `TRACKS = ['pop','trance']`, `NUM_SESSIONS = 2`). If you add a third condition, add it here and in `js/config.js`.
5. Save the script. Click **Deploy > New deployment**. Choose **Web app**.
   - **Execute as**: Me.
   - **Who has access**: Anyone (so participants’ browsers can call it).
   - Click **Deploy**, authorize if prompted, then copy the **Web app URL** (it ends with `/exec`).

### Step 2: Frontend configuration

1. Open `js/config.js` in the project.
2. Set **apiUrl** to the Web app URL you copied (e.g. `'https://script.google.com/macros/s/.../exec'`).
3. Optionally adjust **numSessions**, **tracks** (labels and YouTube IDs), and **preTasks** / **postTasks** to match your protocol. See IMPLEMENTATION.md for the question format.

### Step 3: Host the site

1. Upload the project (at least `index.html`, `session.html`, and the `js/` folder) to your host. Do **not** upload the `apps-script/` folder to the web host; that code lives only in Google Apps Script.
2. Ensure the site is served over **HTTPS** (required for camera and Wake Lock on most devices).
3. The session URL participants will use is: `https://your-site.com/session.html?email=...&session=N`. The registration page should be the main entry (e.g. `https://your-site.com/` or `https://your-site.com/index.html`).

### Step 4: Verify

1. Open the registration page. Complete **email**, **age**, **gender** (Male / Female / Other), optional name, eligibility (injury / availability), then if eligible **Session 1** time and both consent checkboxes. Submit. You should see success (or a screen-out message if ineligible) and calendar links when enrolled.
2. Use one of the calendar links (or build the session URL by hand with that email and `session=1`). Complete the flow through one session: safety, instructions, audio, pre-task questions, plank (start/stop), post-task questions, submit. Check that a row appears in the **sessions** sheet and, if you enabled photo capture, that an image appears in the Drive folder.
3. Run a quick test on a phone (same browser you intend participants to use) to confirm layout and that the timer and camera (if used) work.

### Where the data lives

- **Google Sheet**:
  - **participants** — one row per **enrolled** person: includes `email`, `age`, `gender`, group assignment, `sessions_completed`.
  - **registration_attempts** — one row per **registration submit** (enrolled, screen-outs, duplicate email); use for screening statistics.
  - **sessions** — one row per completed session: duration, pre/post answer JSON, contact sheet URL.
- **Google Drive folder**: One JPEG contact sheet per session where the participant enabled form verification; file name includes email and session number.

### Changing questions or sessions

- **Survey questions**: Edit `preTasks` and `postTasks` in `js/config.js`. No need to change HTML or other JS.
- **Adding a third session**: Update `numSessions` and `tracks` in `js/config.js`, and `TRACKS` and `NUM_SESSIONS` in `Code.gs`; redeploy the Web app. See IMPLEMENTATION.md for details.

---

## Part 2: Participant Instructions

Share the following (or a shortened version) with participants. You can adapt the links and study title to your deployment.

---

### Before you start

- You will do **two sessions** (or three, if your researcher specified). Each session is a single forearm plank while listening to **assigned audio** (the study examines music and performance; the app labels conditions neutrally as e.g. Audio A / Audio B). Sessions are on different days, 24–72 hours apart.
- You need: a phone or tablet (with browser and optional camera for form verification), headphones (recommended), a comfortable surface (e.g. exercise mat), and a few minutes of quiet space per session.
- **Safety**: Planks can temporarily raise blood pressure. If you have hypertension or are injured, check with your doctor before participating. Do not do intense core exercise in the 24 hours before a session.

---

### Registration (do once)

1. Open the **registration link** (e.g. study homepage). The study is titled **Physical Performance Study**.
2. Read the study information on the page (includes a short thank-you to participants). Enter your **email** (required for all sessions), **age**, and **gender** (Male, Female, or Other). **Full name** is optional. Answer the **injury** and **scheduling availability** questions honestly. If you are eligible, choose a **date and time** for Session 1 and check the **blood pressure** and **participation/consent** boxes.
3. Tap **Continue** to submit. If you are not eligible, you will see a short message (your response may still be logged for research statistics). If you enroll successfully, you will see a thank-you line, your **group** / **session order (assigned audio)**, and Session 1 time.
4. Add the session to your calendar:
   - **Add to Google Calendar**: opens Google Calendar with the event pre-filled; the event description contains the link to open when it’s time.
   - **Download for Apple / Outlook Calendar**: downloads a file you can open to add the event; the description again has the session link.
5. **Important**: When it’s time for your session, open the **link from the calendar event** (or the link the researcher sent). That link opens the correct session and pre-fills your email.

---

### When it’s time for a session

1. **Before you start**: No intense core work in the last 24 hours. Have comfortable clothes, a mat or soft surface, and enough space for a forearm plank. Headphones are recommended.
2. Open the **session link** from your calendar (or the link from the researcher). The page will show “Session X of 2” (or 3).
3. **Step 1 — Before you begin**: Confirm the email shown is yours. Read the **Important** note about using the **same email** you used when you registered (for Session 2, the text also mentions having completed Session 1). Check the three safety/readiness boxes and tap **Continue**.
4. **Step 2 — Instructions**: Read the short plank instructions (position, form, when to stop). The amber note explains when **audio** starts: **Session 1** says audio comes after the short activity questions; **Session 2** says audio begins on the **next** screen. Tap **I understand — Continue**.
5. **Session 1 only — About your activity**: Answer three short questions (activity level, optional activity type, plank frequency). Tap **Continue to audio**. *(Omitted in Session 2.)*
6. **Audio**: The page will load **this session’s assigned audio**. Set volume to a comfortable level (around 60%). Optionally turn on “form verification camera” if you want to help with quality control (one photo per second, combined into a single image). Tap **Audio is playing — Continue**.
7. **Quick questions**: Answer the questions while **this session’s audio** plays. When done, tap **I’m ready — Start plank**.
8. **Plank**: Put your device where you can see it (e.g. on the floor in front of you). When ready, get into plank position, then tap **START**. The timer will run and **the audio** will keep playing. Hold the plank as long as you can with good form. When you stop, tap **STOP** immediately. Do not pause or restart the timer.
9. **Post-session questions**: Your time is shown. Answer the follow-up questions (Session 2 includes a few extra study-experience questions) and tap **Submit session data**.
10. **After submit**: If you have more sessions to do, the page will ask you to **schedule the next session** (24–72 hours from now). Use the calendar links again and open the new link when it’s time. If you’ve completed all sessions, you’ll see a “Study complete” message.

---

### Tips

- Use the **same email** for every session so the system can match your data.
- Open the session link **at the time you scheduled** (or when you’re ready that day). The link in the calendar event is the one you need.
- If the audio doesn’t auto-play, tap the “Audio is playing — Continue” button; that often allows playback to start on phones.
- Keep the screen on and avoid locking the device during the plank so the timer stays visible.

---

### Problems?

- **“Email not found”**: Register first using the main registration link; then use the session link from your calendar.
- **“Please complete Session X first”**: Complete sessions in order (1, then 2, then 3 if applicable). Use the link for the next session from the “Schedule next session” step.
- **Audio or timer not working**: Try a different browser (e.g. Chrome or Safari). Ensure you’ve allowed the page to play media if the browser asks.
- **Camera**: Form verification is optional. If you don’t enable it or permission is denied, you can still complete the session.

If something still doesn’t work, contact the researcher with your email and what step you were on.
