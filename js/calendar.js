// =============================================================
// Calendar link generation utilities
// Used by both registration and post-session scheduling
// =============================================================

function getSessionUrl(email, sessionNum) {
  const base = window.location.origin +
    window.location.pathname.replace(/[^/]*$/, '');
  return `${base}session.html?email=${encodeURIComponent(email)}&session=${sessionNum}`;
}

function _toUTCStamp(date) {
  const p = n => String(n).padStart(2, '0');
  return `${date.getUTCFullYear()}${p(date.getUTCMonth() + 1)}${p(date.getUTCDate())}` +
    `T${p(date.getUTCHours())}${p(date.getUTCMinutes())}${p(date.getUTCSeconds())}Z`;
}

function buildGoogleCalendarUrl({ title, description, startDate, durationMinutes }) {
  const start = new Date(startDate);
  const end = new Date(start.getTime() + durationMinutes * 60000);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${_toUTCStamp(start)}/${_toUTCStamp(end)}`,
    details: description,
    trp: 'false',
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

function buildICSBlob({ title, description, startDate, durationMinutes, uid }) {
  const start = new Date(startDate);
  const end = new Date(start.getTime() + durationMinutes * 60000);
  const now = new Date();
  const safeDesc = (description || '').replace(/\n/g, '\\n').replace(/,/g, '\\,');
  const content = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//W241 Plank Study//EN',
    'BEGIN:VEVENT',
    `UID:${uid || (typeof crypto !== 'undefined' ? crypto.randomUUID() : Date.now())}`,
    `DTSTAMP:${_toUTCStamp(now)}`,
    `DTSTART:${_toUTCStamp(start)}`,
    `DTEND:${_toUTCStamp(end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${safeDesc}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT24H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Plank study session reminder — tomorrow',
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Plank study session in 1 hour',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  return new Blob([content], { type: 'text/calendar;charset=utf-8' });
}

function triggerICSDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'session.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Renders Google Calendar + .ics download buttons into `container`.
 * @param {HTMLElement} container
 * @param {{ email: string, sessionNum: number, scheduledDateTime: string|Date }} opts
 */
function renderCalendarLinks(container, { email, sessionNum, scheduledDateTime }) {
  const title = `W241 Plank Study — Session ${sessionNum}`;
  const sessionUrl = getSessionUrl(email, sessionNum);
  const description =
    `W241 Plank Study — Session ${sessionNum}\n\n` +
    `When it's time, open this link:\n${sessionUrl}\n\n` +
    `Remember: wear comfortable clothing and have space for a forearm plank.`;

  const gcalUrl = buildGoogleCalendarUrl({
    title,
    description,
    startDate: scheduledDateTime,
    durationMinutes: 30,
  });

  const icsBlob = buildICSBlob({
    title,
    description,
    startDate: scheduledDateTime,
    durationMinutes: 30,
    uid: `w241-${email}-s${sessionNum}@plank-study`,
  });

  container.innerHTML = `
    <p class="text-sm text-slate-500 mb-3">Add Session ${sessionNum} to your calendar:</p>
    <div class="flex flex-col gap-3">
      <a id="cal-gcal" href="${gcalUrl}" target="_blank" rel="noopener"
         class="btn-primary flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold">
        Add to Google Calendar
      </a>
      <button id="cal-ics"
         class="btn-outline flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold">
        Download for Apple / Outlook Calendar
      </button>
    </div>
    <p class="text-xs text-slate-400 mt-3 leading-relaxed">
      Reminders are set for 24 hours and 1 hour before your session.<br>
      Your direct session link is embedded in the calendar event.
    </p>
  `;

  container.querySelector('#cal-ics').addEventListener('click', () => {
    triggerICSDownload(icsBlob, `w241_session_${sessionNum}.ics`);
  });
}
