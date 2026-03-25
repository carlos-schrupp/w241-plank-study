// =============================================================
// Calendar link generation utilities
// Used by both registration and post-session scheduling
// =============================================================

function getSessionUrl(email, sessionNum, locale) {
  const base = window.location.origin +
    window.location.pathname.replace(/[^/]*$/, '');
  const pageName =
    typeof APP_I18N !== 'undefined'
      ? APP_I18N.pagePath('session', locale)
      : 'session.html';
  return `${base}${pageName}?email=${encodeURIComponent(email)}&session=${sessionNum}`;
}

function localDateTimeValueToIso(value) {
  if (!value) return '';
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? '' : dt.toISOString();
}

function formatStudyDateTime(value, locale) {
  if (!value) return '';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '';
  const localeTag =
    typeof APP_I18N !== 'undefined'
      ? APP_I18N.localeTag(locale)
      : undefined;
  return dt.toLocaleString(localeTag, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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

function buildICSBlob({ title, description, startDate, durationMinutes, uid, locale }) {
  const start = new Date(startDate);
  const end = new Date(start.getTime() + durationMinutes * 60000);
  const now = new Date();
  const safeDesc = (description || '').replace(/\n/g, '\\n').replace(/,/g, '\\,');
  const alarmTomorrow =
    typeof APP_I18N !== 'undefined'
      ? APP_I18N.t('calendar.alarmTomorrow', {}, locale)
      : 'Physical Performance Study session reminder - tomorrow';
  const alarmHour =
    typeof APP_I18N !== 'undefined'
      ? APP_I18N.t('calendar.alarmHour', {}, locale)
      : 'Physical Performance Study session in 1 hour';
  const content = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Physical Performance Study//EN',
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
    `DESCRIPTION:${alarmTomorrow}`,
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${alarmHour}`,
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

function renderDirectSessionLink(container, { email, sessionNum, buttonLabel, note, locale }) {
  const activeLocale =
    typeof APP_I18N !== 'undefined'
      ? APP_I18N.normalizeLocale(locale || APP_I18N.locale())
      : 'en';
  const sessionUrl = getSessionUrl(email, sessionNum, activeLocale);
  const linkTitle =
    typeof APP_I18N !== 'undefined'
      ? APP_I18N.t('calendar.directLinkTitle', {}, activeLocale)
      : 'Direct session link';
  const defaultButtonLabel =
    typeof APP_I18N !== 'undefined'
      ? APP_I18N.t('calendar.openSession', { num: sessionNum }, activeLocale)
      : `Open Session ${sessionNum}`;
  container.innerHTML = `
    <div class="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
      <p class="text-blue-300 text-xs font-medium uppercase tracking-wider mb-1">${linkTitle}</p>
      <a href="${sessionUrl}"
         class="btn-primary inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold w-full">
        ${buttonLabel || defaultButtonLabel}
      </a>
      <p class="text-slate-400 text-xs mt-3 break-all">${sessionUrl}</p>
      ${note ? `<p class="text-slate-400 text-xs mt-2">${note}</p>` : ''}
    </div>
  `;
}

/**
 * Renders Google Calendar + .ics download buttons into `container`.
 * @param {HTMLElement} container
 * @param {{ email: string, sessionNum: number, scheduledDateTime: string|Date }} opts
 */
function renderCalendarLinks(container, { email, sessionNum, scheduledDateTime, locale }) {
  const activeLocale =
    typeof APP_I18N !== 'undefined'
      ? APP_I18N.normalizeLocale(locale || APP_I18N.locale())
      : 'en';
  const studyTitle =
    typeof APP_I18N !== 'undefined'
      ? APP_I18N.t('study.title', {}, activeLocale)
      : ((typeof EXPERIMENT_CONFIG !== 'undefined' && EXPERIMENT_CONFIG.studyTitle)
        ? EXPERIMENT_CONFIG.studyTitle
        : 'Physical Performance Study');
  const title =
    typeof APP_I18N !== 'undefined'
      ? APP_I18N.t('calendar.eventTitle', { studyTitle, num: sessionNum }, activeLocale)
      : `${studyTitle} - Session ${sessionNum}`;
  const sessionUrl = getSessionUrl(email, sessionNum, activeLocale);
  const description =
    `${title}\n\n` +
    `${APP_I18N.t('calendar.descriptionOpenLink', {}, activeLocale)}\n${sessionUrl}\n\n` +
    `${APP_I18N.t('calendar.descriptionReminder', {}, activeLocale)}`;

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
    uid: `physical-performance-study-${email}-s${sessionNum}@study`,
    locale: activeLocale,
  });

  container.innerHTML = `
    <p class="text-sm text-slate-500 mb-3">${APP_I18N.t('calendar.addPrompt', { num: sessionNum }, activeLocale)}</p>
    <div class="flex flex-col gap-3">
      <a id="cal-gcal" href="${gcalUrl}" target="_blank" rel="noopener"
         class="btn-primary flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold">
        ${APP_I18N.t('calendar.addGoogle', {}, activeLocale)}
      </a>
      <button id="cal-ics"
         class="btn-outline flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold">
        ${APP_I18N.t('calendar.addAppleOutlook', {}, activeLocale)}
      </button>
    </div>
    <p class="text-xs text-slate-400 mt-3 leading-relaxed">
      ${APP_I18N.t('calendar.reminderInfo', {}, activeLocale)}<br>
      ${APP_I18N.t('calendar.reminderEmbedded', {}, activeLocale)}
    </p>
  `;

  container.querySelector('#cal-ics').addEventListener('click', () => {
    triggerICSDownload(icsBlob, `physical_performance_study_session_${sessionNum}.ics`);
  });
}
