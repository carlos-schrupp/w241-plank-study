// =============================================================
// session.js — State machine for the guided session flow
// =============================================================

// ---- Application state ----
var S = {
  email:        null,
  sessionNum:   null,
  participant:  null,  // data from Apps Script GET
  track:        null,  // { id, label, youtubeId }
  currentStep:  null,
  locale:       null,

  // YouTube
  ytPlayer:     null,
  ytReady:      false,
  ytPlayCalled: false,
  audioStopped: false,

  // Timer
  timerStart:   null,
  timerRAF:     null,
  elapsedMs:    0,

  // Wake lock
  wakeLock:     null,

  // Photo capture
  photoEnabled: false,
  cameraStream: null,
  frames:       [],
  captureInterval: null,

  // Survey answers
  preTasks:  {},
  postTasks: {},
  session1Activity: {},

  /** @type {object[]|null} post-task schema for current session (set in setupPostTaskStep) */
  postTaskQuestionList: null,

  // Submission results
  sessionId:     null,
  sessionsCompleted: 0,
  nextSessionScheduledAt: null,

  // Plank accidental-start undo window
  plankBackEnabled: false,
  plankBackTimer: null,
};

// ---- Step IDs in order (for progress bar) ----
var STEPS = [
  'loading', 'error', 'safety', 'instructions', 'session1-activity',
  'audio', 'pre-task', 'plank', 'post-task',
  'submitting', 'schedule', 'complete',
];

function getProgressSteps() {
  var steps = ['safety', 'instructions'];
  if (typeof S !== 'undefined' && S.sessionNum === 1) {
    steps.push('session1-activity');
  }
  steps.push('audio', 'pre-task', 'plank', 'post-task');
  return steps;
}

// =============================================================
// DOM helpers
// =============================================================

function $(id) { return document.getElementById(id); }

function activeLocale() {
  return APP_I18N.normalizeLocale(S.locale || APP_I18N.locale());
}

function t(path, vars) {
  return APP_I18N.t(path, vars, activeLocale());
}

function localize(value) {
  return APP_I18N.text(value, activeLocale());
}

function optionValue(opt) {
  return opt && typeof opt === 'object' && Object.prototype.hasOwnProperty.call(opt, 'value')
    ? opt.value
    : opt;
}

function optionLabel(opt) {
  if (opt && typeof opt === 'object' && Object.prototype.hasOwnProperty.call(opt, 'label')) {
    return localize(opt.label);
  }
  return localize(opt);
}

function refreshMainStepBanner(stepName) {
  var el = $('step-' + stepName);
  if (!el) return;
  var b = el.querySelector('.js-step-banner');
  if (!b) return;
  var steps = getProgressSteps();
  var idx = steps.indexOf(stepName);
  if (idx < 0) return;
  b.textContent = activeLocale() === 'es'
    ? 'Paso ' + (idx + 1) + ' de ' + steps.length
    : 'Step ' + (idx + 1) + ' of ' + steps.length;
}

function showStep(name) {
  S.currentStep = name;
  STEPS.forEach(function (s) {
    var el = $('step-' + s);
    if (el) el.classList.remove('active');
  });
  var target = $('step-' + name);
  if (target) {
    target.classList.add('active');
    target.classList.add('fade-in');
  }
  // Progress bar
  var progressSteps = getProgressSteps();
  var idx = progressSteps.indexOf(name);
  var pct;
  if (idx >= 0) {
    pct = Math.round(((idx + 1) / progressSteps.length) * 100);
  } else if (name === 'submitting' || name === 'schedule' || name === 'complete') {
    pct = 100;
  } else {
    pct = 0;
  }
  $('progress-fill').style.width = pct + '%';

  refreshMainStepBanner(name);
  updatePostPlankAudioControls(name);

  // Scroll to top
  window.scrollTo({ top: 0 });
}

function showError(msg) {
  $('error-message').textContent = msg;
  showStep('error');
}

function isPostPlankStep(name) {
  return name === 'post-task' || name === 'schedule' || name === 'complete';
}

function updatePostPlankAudioControls(stepName) {
  var bar = $('post-plank-audio-bar');
  var btn = $('btn-stop-audio');
  if (!bar || !btn) return;

  var shouldShow = isPostPlankStep(stepName) && (!!S.ytPlayer || S.audioStopped);
  bar.classList.toggle('hidden', !shouldShow);
  btn.disabled = !S.ytPlayer || S.audioStopped;
  btn.textContent = S.audioStopped ? t('common.audioStopped') : t('common.stopAudio');
}

function stopStudyAudio() {
  if (!S.ytPlayer || S.audioStopped) return;
  try {
    if (typeof S.ytPlayer.stopVideo === 'function') {
      S.ytPlayer.stopVideo();
    } else if (typeof S.ytPlayer.pauseVideo === 'function') {
      S.ytPlayer.pauseVideo();
    }
  } catch (_) {
    return;
  }
  S.audioStopped = true;
  updatePostPlankAudioControls(S.currentStep);
}

// =============================================================
// YouTube IFrame API
// =============================================================

var _ytCreateQueue = null; // callback waiting for API to be ready

window.onYouTubeIframeAPIReady = function () {
  S.ytReady = true;
  if (_ytCreateQueue) {
    _ytCreateQueue();
    _ytCreateQueue = null;
  }
};

function createPlayer(videoId, onReady) {
  function doCreate() {
    $('yt-placeholder').style.display = 'none';
    S.ytPlayer = new YT.Player('youtube-player', {
      height: '200',
      width:  '100%',
      videoId: videoId,
      playerVars: {
        autoplay:  0,
        loop:      1,
        playlist:  videoId, // required for loop to work
        rel:       0,
        modestbranding: 1,
        playsinline: 1,
      },
      events: {
        onReady: function (e) { onReady(e.target); },
        onError: function () {
          $('audio-fallback').classList.remove('hidden');
          $('btn-audio-next').disabled = false;
        },
      },
    });
  }
  if (S.ytReady) {
    doCreate();
  } else {
    _ytCreateQueue = doCreate;
  }
}

// =============================================================
// Timer
// =============================================================

function formatTime(ms) {
  var totalSec = Math.floor(ms / 1000);
  var min      = Math.floor(totalSec / 60);
  var sec      = totalSec % 60;
  var tenth    = Math.floor((ms % 1000) / 100);
  return pad2(min) + ':' + pad2(sec) + '.' + tenth;
}

function pad2(n) { return String(n).padStart(2, '0'); }

function startTimer() {
  S.timerStart = performance.now();
  S.elapsedMs  = 0;
  function tick() {
    S.elapsedMs = performance.now() - S.timerStart;
    $('timer-display').textContent = formatTime(S.elapsedMs);
    S.timerRAF = requestAnimationFrame(tick);
  }
  S.timerRAF = requestAnimationFrame(tick);
}

function stopTimer() {
  cancelAnimationFrame(S.timerRAF);
  S.timerRAF = null;
  return S.elapsedMs;
}

// =============================================================
// Wake Lock
// =============================================================

async function requestWakeLock() {
  if (!('wakeLock' in navigator)) return;
  try {
    S.wakeLock = await navigator.wakeLock.request('screen');
  } catch (_) { /* silently ignored */ }
}

function releaseWakeLock() {
  if (S.wakeLock) { S.wakeLock.release().catch(function(){}); S.wakeLock = null; }
}

// Re-acquire on visibility change (iOS Safari releases it when tab hides)
document.addEventListener('visibilitychange', function () {
  if (document.visibilityState === 'visible' && S.timerRAF && !S.wakeLock) {
    requestWakeLock();
  }
});

// =============================================================
// Photo capture — 1 fps, contact-sheet output
// =============================================================

async function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return false;
  try {
    // Prefer front (selfie) camera so participants can see themselves
    // while planking; browsers will fall back if not available.
    S.cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'user' }, width: 640, height: 480 },
      audio: false,
    });
    var feed = $('camera-feed');
    feed.srcObject = S.cameraStream;
    await feed.play();
    return true;
  } catch (_) {
    return false;
  }
}

function startCapture() {
  var canvas = $('capture-canvas');
  canvas.width  = 640;
  canvas.height = 480;
  var ctx = canvas.getContext('2d');
  var feed = $('camera-feed');
  S.frames = [];

  S.captureInterval = setInterval(function () {
    ctx.drawImage(feed, 0, 0, 640, 480);
    S.frames.push(canvas.toDataURL('image/jpeg', 0.5));
  }, 1000);
}

function stopCapture() {
  clearInterval(S.captureInterval);
  S.captureInterval = null;
  if (S.cameraStream) {
    S.cameraStream.getTracks().forEach(function (t) { t.stop(); });
    S.cameraStream = null;
  }
  $('camera-feed').classList.add('hidden');
}

async function buildContactSheet(frames) {
  if (!frames.length) return null;

  // Limit to 600 frames to avoid memory issues on older devices
  var capped = frames.slice(0, 600);

  var thumbW = 80, thumbH = 60, labelH = 14;
  var cols   = Math.min(15, capped.length);
  var rows   = Math.ceil(capped.length / cols);

  // Pre-load all images
  var images = await Promise.all(capped.map(function (src) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload  = function () { resolve(img); };
      img.onerror = function () { resolve(null); };
      img.src = src;
    });
  }));

  var sheet = $('sheet-canvas');
  sheet.width  = cols * thumbW;
  sheet.height = rows * (thumbH + labelH);
  var ctx = sheet.getContext('2d');
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, sheet.width, sheet.height);

  images.forEach(function (img, i) {
    if (!img) return;
    var col = i % cols;
    var row = Math.floor(i / cols);
    var x   = col * thumbW;
    var y   = row * (thumbH + labelH);
    ctx.drawImage(img, x, y, thumbW, thumbH);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x, y + thumbH, thumbW, labelH);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px monospace';
    ctx.fillText(i + 's', x + 2, y + thumbH + 10);
  });

  return sheet.toDataURL('image/jpeg', 0.85);
}

// =============================================================
// API calls
// =============================================================

async function apiGet(params) {
  var url = new URL(EXPERIMENT_CONFIG.apiUrl);
  Object.keys(params).forEach(function (k) { url.searchParams.set(k, params[k]); });
  var res = await fetch(url.toString());
  return res.json();
}

async function apiPost(payload) {
  var res = await fetch(EXPERIMENT_CONFIG.apiUrl, {
    method: 'POST',
    // Omit Content-Type to stay a "simple" CORS request (no preflight)
    body: JSON.stringify(payload),
  });
  return res.json();
}

// =============================================================
// Survey form renderer
// =============================================================

function renderQuestions(questions, containerId, answersObj, onChangeCallback) {
  var container = $(containerId);
  container.innerHTML = '';

  function applyConditionalVisibility() {
    questions.forEach(function (q) {
      if (!q.showIf) return;
      var wrap = container.querySelector('[data-qid="' + q.id + '"]');
      if (!wrap) return;
      var show = answersObj[q.showIf.questionId] === q.showIf.equals;
      wrap.style.display = show ? '' : 'none';
      if (!show) {
        delete answersObj[q.id];
        var ta = wrap.querySelector('textarea');
        if (ta) ta.value = '';
        wrap.querySelectorAll('.scale-btn.selected, .radio-btn.selected').forEach(function (b) {
          b.classList.remove('selected');
        });
      }
    });
  }

  function bump() {
    applyConditionalVisibility();
    if (onChangeCallback) onChangeCallback();
  }

  questions.forEach(function (q) {
    var wrapper = document.createElement('div');
    wrapper.className = 'bg-slate-800 rounded-2xl p-4';
    wrapper.dataset.qid = q.id;
    if (q.showIf) {
      wrapper.style.display =
        answersObj[q.showIf.questionId] === q.showIf.equals ? '' : 'none';
    }

    var label = document.createElement('p');
    label.className = 'text-white text-sm font-medium mb-3 leading-snug';
    label.textContent = localize(q.text);
    wrapper.appendChild(label);

    if (q.type === 'scale') {
      var row = document.createElement('div');
      row.className = 'flex gap-1 mb-2 flex-wrap';
      for (var v = q.min; v <= q.max; v++) {
        (function (val) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'scale-btn';
          btn.textContent = val;
          btn.dataset.value = val;
          if (answersObj[q.id] === val) btn.classList.add('selected');
          btn.addEventListener('click', function () {
            row.querySelectorAll('.scale-btn').forEach(function (b) {
              b.classList.remove('selected');
            });
            btn.classList.add('selected');
            answersObj[q.id] = val;
            bump();
          });
          row.appendChild(btn);
        })(v);
      }
      var labRow = document.createElement('div');
      labRow.className = 'flex justify-between text-xs text-slate-500 mt-1 gap-2';
      labRow.innerHTML = '<span>' + localize(q.minLabel) + '</span><span>' + localize(q.maxLabel) + '</span>';
      wrapper.appendChild(row);
      wrapper.appendChild(labRow);

    } else if (q.type === 'radio') {
      var optList = document.createElement('div');
      optList.className = 'flex flex-col gap-2';
      q.options.forEach(function (opt) {
        var value = optionValue(opt);
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'radio-btn';
        if (answersObj[q.id] === value) btn.classList.add('selected');
        btn.textContent = optionLabel(opt);
        btn.addEventListener('click', function () {
          optList.querySelectorAll('.radio-btn').forEach(function (b) {
            b.classList.remove('selected');
          });
          btn.classList.add('selected');
          answersObj[q.id] = value;
          bump();
        });
        optList.appendChild(btn);
      });
      wrapper.appendChild(optList);

    } else if (q.type === 'textarea') {
      var ta = document.createElement('textarea');
      ta.rows = 3;
      ta.placeholder =
        q.placeholder !== undefined && q.placeholder !== null
          ? localize(q.placeholder)
          : (activeLocale() === 'es'
            ? 'Opcional. Déjalo en blanco para omitirlo.'
            : 'Optional - leave blank to skip');
      if (answersObj[q.id]) ta.value = answersObj[q.id];
      ta.className = 'w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-500 ' +
        'rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-blue-500';
      ta.addEventListener('input', function () {
        answersObj[q.id] = ta.value;
        bump();
      });
      wrapper.appendChild(ta);
    }

    container.appendChild(wrapper);
  });

  applyConditionalVisibility();
}

function allAnswered(questions, answersObj) {
  return questions.every(function (q) {
    if (q.showIf) {
      var parentVal = answersObj[q.showIf.questionId];
      if (parentVal !== q.showIf.equals) return true;
    }
    if (q.required === false) return true;
    var val = answersObj[q.id];
    if (val === undefined || val === null) return false;
    if (typeof val === 'string' && val.trim() === '') return false;
    return true;
  });
}

function buildPostTasksForSession(sessionNum) {
  var list = EXPERIMENT_CONFIG.postTasksPart1.map(function (t) {
    return JSON.parse(JSON.stringify(t));
  });
  if (sessionNum === 2) {
    EXPERIMENT_CONFIG.postTasksSession2Extra.forEach(function (t) {
      list.push(JSON.parse(JSON.stringify(t)));
    });
  }
  EXPERIMENT_CONFIG.postTasksPart2.forEach(function (t) {
    list.push(JSON.parse(JSON.stringify(t)));
  });
  var commentText =
    sessionNum === 2
      ? (activeLocale() === 'es'
        ? '¿Tienes comentarios o sugerencias sobre tu experiencia en este estudio? (opcional)'
        : 'Do you have any comments or suggestions about your experience in this study? (optional)')
      : (activeLocale() === 'es'
        ? '¿Algún otro comentario sobre esta sesión? (opcional)'
        : 'Any other comments about this session? (optional)');
  list.push({
    id: 'comments',
    text: commentText,
    type: 'textarea',
    required: false,
  });
  return list;
}

// =============================================================
// Calendar date constraints for next session
// =============================================================

function setupNextSessionPicker(sessionNum) {
  var input = $('next-session-dt');
  var emailToggle = $('chk-next-email-link');
  var btn = $('btn-save-next-session');
  var now = new Date();
  var minDt = new Date(now.getTime() + 24 * 3600 * 1000);
  var maxDt = new Date(now.getTime() + 72 * 3600 * 1000);

  function toLocal(d) {
    return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }
  input.min = toLocal(minDt);
  input.max = toLocal(maxDt);
  input.value = '';
  emailToggle.checked = !!S.participant.emailOptIn;
  btn.disabled = true;
  $('schedule-error').classList.add('hidden');
  $('next-link-container').innerHTML = '';
  $('next-calendar-links').innerHTML = '';
  $('next-email-status').className = 'hidden text-xs rounded-xl px-4 py-3 mb-4';

  input.onchange = function () {
    $('schedule-error').classList.add('hidden');
    $('next-link-container').innerHTML = '';
    $('next-calendar-links').innerHTML = '';
    $('next-email-status').className = 'hidden text-xs rounded-xl px-4 py-3 mb-4';
    btn.disabled = !input.value;
  };

  btn.onclick = function () {
    saveNextSessionSchedule(sessionNum);
  };
}

async function saveNextSessionSchedule(nextSessionNum) {
  var input = $('next-session-dt');
  var emailToggle = $('chk-next-email-link');
  var btn = $('btn-save-next-session');
  var err = $('schedule-error');
  var emailStatus = $('next-email-status');
  var scheduledAt = localDateTimeValueToIso(input.value);
  var scheduledLabel = scheduledAt ? formatStudyDateTime(scheduledAt, activeLocale()) : '';

  if (!scheduledAt) {
    err.textContent = t('session.errors.chooseValidSchedule', { num: nextSessionNum });
    err.classList.remove('hidden');
    return;
  }

  err.classList.add('hidden');
  emailStatus.className = 'hidden text-xs rounded-xl px-4 py-3 mb-4';
  btn.disabled = true;
  btn.textContent = t('session.scheduleSaving', { num: nextSessionNum });

  try {
    var res = await apiPost({
      action: 'schedule_next_session',
      email: S.email,
      nextSessionNum: nextSessionNum,
      scheduledAt: scheduledAt,
      scheduledLabel: scheduledLabel,
      emailOptIn: emailToggle.checked,
      contactEmail: EXPERIMENT_CONFIG.researcherEmail,
      locale: activeLocale(),
    });

    if (res.error) throw new Error(res.error);

    S.participant['session' + nextSessionNum + 'PlannedAt'] = res.scheduledAt;
    S.participant.emailOptIn = res.emailOptIn;
    S.participant.locale = activeLocale();
    S.nextSessionScheduledAt = res.scheduledAt;
    $('schedule-note').textContent = t('session.scheduleSaved', { num: nextSessionNum });

    renderDirectSessionLink(
      $('next-link-container'),
      {
        email: S.email,
        sessionNum: nextSessionNum,
        locale: activeLocale(),
        buttonLabel: t('common.openSession', { num: nextSessionNum }),
        note: t('session.scheduleDirectLinkNote'),
      }
    );
    renderCalendarLinks(
      $('next-calendar-links'),
      { email: S.email, sessionNum: nextSessionNum, scheduledDateTime: res.scheduledAt, locale: activeLocale() }
    );

    if (res.emailSent) {
      emailStatus.textContent = t('session.scheduleEmailSent', { num: nextSessionNum, email: S.email });
      emailStatus.classList.remove('hidden');
      emailStatus.classList.add('bg-emerald-500/10', 'text-emerald-200', 'border', 'border-emerald-500/30');
    } else if (emailToggle.checked && res.emailError) {
      emailStatus.textContent = t('session.scheduleEmailFailed');
      emailStatus.classList.remove('hidden');
      emailStatus.classList.add('bg-amber-500/10', 'text-amber-200', 'border', 'border-amber-500/30');
    }
  } catch (e) {
    err.textContent = t('session.errors.saveScheduleFailed', { num: nextSessionNum, message: e.message });
    err.classList.remove('hidden');
  } finally {
    btn.disabled = !input.value;
    btn.textContent = t('session.scheduleConfirm', { num: nextSessionNum });
  }
}

// =============================================================
// Init — runs on page load
// =============================================================

async function init() {
  if ($('btn-stop-audio')) {
    $('btn-stop-audio').onclick = stopStudyAudio;
  }

  // Parse URL params
  var params = new URLSearchParams(window.location.search);
  S.email      = params.get('email');
  S.sessionNum = parseInt(params.get('session'), 10);
  S.locale = APP_I18N.locale();

  if (!S.email || !S.sessionNum) {
    showError(t('session.errors.missingParams'));
    return;
  }

  // Load participant data
  try {
    var data = await apiGet({ email: S.email });
    if (!data.found) {
      showError(t('session.errors.emailNotFound'));
      return;
    }
    S.participant = data;
    S.locale = APP_I18N.normalizeLocale(window.APP_LOCALE || data.locale || 'en');
  } catch (e) {
    showError(t('session.errors.loadFailed'));
    return;
  }

  // Validate session number
  var completed = S.participant.sessionsCompleted;
  var total     = EXPERIMENT_CONFIG.numSessions;

  if (S.sessionNum <= completed) {
    var alreadySubmitted = t('session.errors.alreadySubmitted', { num: S.sessionNum }) + ' ' +
      (completed < total
        ? t('session.errors.useNextSession', { num: completed + 1 })
        : t('session.errors.allComplete'));
    showError(alreadySubmitted);
    return;
  }
  if (S.sessionNum > completed + 1) {
    showError(t('session.errors.completeFirst', { num: completed + 1 }));
    return;
  }

  // Resolve which track this participant gets for this session
  var perm = EXPERIMENT_CONFIG.permutations[S.participant.groupIndex];
  var trackId = perm[S.sessionNum - 1];
  S.track = EXPERIMENT_CONFIG.tracks.find(function (t) { return t.id === trackId; });

  setInstructionsAudioHint();

  // Set up step 1 (safety)
  setupSafetyStep();
  showStep('safety');
}

function setInstructionsAudioHint() {
  var el = $('instructions-audio-hint');
  if (!el) return;
  if (S.sessionNum === 1) {
    el.textContent = t('session.instructionsHintSession1');
  } else {
    el.textContent = t('session.instructionsHintLater');
  }
}

// =============================================================
// Step 1: Safety
// =============================================================

function setupSafetyStep() {
  $('safety-email').textContent = S.email;
  $('safety-session-label').textContent =
    t('session.safetySessionLabel', { num: S.sessionNum, total: EXPERIMENT_CONFIG.numSessions });

  var reminderEl = $('safety-email-reminder');
  var reminderText;
  if (S.sessionNum === 1) {
    reminderText = t('session.safetyReminder1');
  } else if (S.sessionNum === 2) {
    reminderText = t('session.safetyReminder2');
  } else {
    reminderText = t('session.safetyReminderLater');
  }
  reminderEl.textContent = reminderText;

  var checks = ['chk-no-injury', 'chk-no-bp', 'chk-space'];
  function checkAll() {
    var allChecked = checks.every(function (id) { return $(id).checked; });
    $('btn-safety-next').disabled = !allChecked;
  }
  checks.forEach(function (id) { $(id).addEventListener('change', checkAll); });

  $('btn-safety-next').addEventListener('click', function () {
    showStep('instructions');
    setupInstructionsStep();
  });
}

// =============================================================
// Step 2: Instructions
// =============================================================

function setupInstructionsStep() {
  $('btn-instructions-next').addEventListener('click', function () {
    if (S.sessionNum === 1) {
      showStep('session1-activity');
      setupSession1ActivityStep();
    } else {
      showStep('audio');
      setupAudioStep();
    }
  });
}

// =============================================================
// Step 2b: Session 1 only — activity background
// =============================================================

function setupSession1ActivityStep() {
  S.session1Activity = {};
  renderQuestions(
    EXPERIMENT_CONFIG.session1Activity,
    'session1-activity-form',
    S.session1Activity,
    checkSession1ActivityComplete
  );

  $('btn-session1-activity-next').addEventListener('click', function () {
    showStep('audio');
    setupAudioStep();
  });

  checkSession1ActivityComplete();
}

function checkSession1ActivityComplete() {
  $('btn-session1-activity-next').disabled =
    !allAnswered(EXPERIMENT_CONFIG.session1Activity, S.session1Activity);
}

// =============================================================
// Step 3: Audio
// =============================================================

function setupAudioStep() {
  S.audioStopped = false;
  updatePostPlankAudioControls(S.currentStep);
  $('audio-track-label').textContent =
    t('session.audioAssignedLabel', { label: localize(S.track.label) });

  var fallbackEl = $('audio-fallback-link');
  var ytUrl = 'https://youtu.be/' + S.track.youtubeId;
  fallbackEl.innerHTML = '<a href="' + ytUrl + '" target="_blank" rel="noopener" class="underline">' +
    t('session.audioFallbackOpen', { url: ytUrl }) + '</a>';

  // Show fallback link after 8 seconds if player hasn't loaded
  var fallbackTimer = setTimeout(function () {
    $('audio-fallback').classList.remove('hidden');
    $('btn-audio-next').disabled = false;
  }, 8000);

  createPlayer(S.track.youtubeId, function (player) {
    clearTimeout(fallbackTimer);
    S.ytPlayer = player;
    S.ytPlayCalled = false;
  });

  $('btn-audio-next').addEventListener('click', function () {
    // Attempt play on button tap (satisfies iOS autoplay policy)
    if (S.ytPlayer && !S.ytPlayCalled) {
      try { S.ytPlayer.playVideo(); } catch (_) {}
      S.ytPlayCalled = true;
    }
    showStep('pre-task');
    setupPreTaskStep();
  });

  // Enable continue button after a short moment so user sees the player
  setTimeout(function () {
    $('btn-audio-next').disabled = false;
  }, 1500);
}

// =============================================================
// Step 4: Pre-task questions + camera option
// =============================================================

function setupPreTaskStep() {
  renderQuestions(
    EXPERIMENT_CONFIG.preTasks,
    'pre-task-form',
    S.preTasks,
    checkPreTaskComplete
  );

  // Camera toggle
  var camOption = $('camera-option');
  var camToggle = $('camera-toggle');
  var camStatus = $('camera-status');
  var camPositioning = $('camera-positioning');

  // Hide camera option if getUserMedia not supported
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    camOption.style.display = 'none';
  }

  camToggle.addEventListener('change', async function () {
    if (!camToggle.checked) {
      S.photoEnabled = false;
      camStatus.textContent = '';
      camPositioning.classList.add('hidden');
      if (S.cameraStream) {
        S.cameraStream.getTracks().forEach(function (t) { t.stop(); });
        S.cameraStream = null;
      }
      return;
    }
    camStatus.textContent = t('session.cameraRequesting');
    var ok = await startCamera();
    if (ok) {
      S.photoEnabled = true;
      $('camera-feed').classList.remove('hidden');
      camStatus.textContent = t('session.cameraReady');
      camPositioning.classList.remove('hidden');
    } else {
      camToggle.checked = false;
      S.photoEnabled = false;
      camStatus.textContent = t('session.cameraDenied');
      camPositioning.classList.add('hidden');
    }
  });

  $('btn-pre-task-next').addEventListener('click', function () {
    showStep('plank');
    setupPlankStep();
  });

  checkPreTaskComplete();
}

function checkPreTaskComplete() {
  $('btn-pre-task-next').disabled =
    !allAnswered(EXPERIMENT_CONFIG.preTasks, S.preTasks);
}

// =============================================================
// Step 5: Plank — full-screen timer
// =============================================================

function setupPlankStep() {
  $('timer-display').textContent = '00:00.0';
  $('btn-plank-back').classList.remove('hidden');
  S.plankBackEnabled = true;
  if (S.plankBackTimer) {
    clearTimeout(S.plankBackTimer);
  }
  S.plankBackTimer = setTimeout(function () {
    S.plankBackEnabled = false;
    $('btn-plank-back').classList.add('hidden');
    S.plankBackTimer = null;
  }, 5000);

  if (S.photoEnabled) {
    $('recording-indicator').classList.remove('hidden');
  } else {
    $('recording-indicator').classList.add('hidden');
  }

  // Start timer + capture
  requestWakeLock();
  startTimer();
  if (S.photoEnabled) {
    startCapture();
  }

  $('btn-plank-stop').onclick = handlePlankStop;
  $('btn-plank-back').onclick = cancelPlankAndReturn;
}

function resetPlankBackState() {
  S.plankBackEnabled = false;
  if (S.plankBackTimer) {
    clearTimeout(S.plankBackTimer);
    S.plankBackTimer = null;
  }
  $('btn-plank-back').classList.add('hidden');
}

function cancelPlankAndReturn() {
  if (!S.plankBackEnabled) return;
  stopTimer();
  releaseWakeLock();
  resetPlankBackState();

  if (S.captureInterval) {
    clearInterval(S.captureInterval);
    S.captureInterval = null;
  }
  S.frames = [];
  S.elapsedMs = 0;
  $('recording-indicator').classList.add('hidden');
  $('timer-display').textContent = '00:00.0';

  if (S.photoEnabled && S.cameraStream) {
    $('camera-feed').classList.remove('hidden');
    $('camera-status').textContent = t('session.cameraReady');
  }

  showStep('pre-task');
}

async function handlePlankStop() {
  resetPlankBackState();
  var ms = stopTimer();
  releaseWakeLock();

  if (S.photoEnabled) {
    stopCapture();
  }
  $('recording-indicator').classList.add('hidden');

  S.elapsedMs = ms;
  var totalSec = ms / 1000;

  // Show post-task step
  showStep('post-task');
  setupPostTaskStep(totalSec);
}

// =============================================================
// Step 6: Post-task questions
// =============================================================

function setupPostTaskStep(totalSec) {
  var display = formatTime(S.elapsedMs);
  $('plank-time-display').textContent = display;

  S.postTasks = {};
  S.postTaskQuestionList = buildPostTasksForSession(S.sessionNum);
  renderQuestions(
    S.postTaskQuestionList,
    'post-task-form',
    S.postTasks,
    checkPostTaskComplete
  );

  $('btn-submit').addEventListener('click', submitSession.bind(null, totalSec));

  checkPostTaskComplete();
}

function checkPostTaskComplete() {
  var list = S.postTaskQuestionList || [];
  $('btn-submit').disabled = !allAnswered(list, S.postTasks);
}

// =============================================================
// Submit
// =============================================================

async function submitSession(totalSec) {
  $('submit-error').classList.add('hidden');
  showStep('submitting');
  $('submitting-note').textContent = t('session.submittingData');

  var preTasksPayload =
    S.sessionNum === 1
      ? Object.assign({}, S.session1Activity || {}, S.preTasks)
      : Object.assign({}, S.preTasks);

  // 1. Submit core session data
  try {
    var sessionRes = await apiPost({
      action:          'session',
      email:           S.email,
      sessionNum:      S.sessionNum,
      audioTrack:      S.track.id,
      plankDurationSec: parseFloat(totalSec.toFixed(3)),
      preTasks:        preTasksPayload,
      postTasks:       S.postTasks,
    });

    if (sessionRes.error) throw new Error(sessionRes.error);
    S.sessionId = sessionRes.sessionId;
    S.sessionsCompleted = sessionRes.sessionsCompleted;
    S.participant.sessionsCompleted = sessionRes.sessionsCompleted;
  } catch (e) {
    showStep('post-task');
    $('submit-error').textContent = t('session.errors.submissionFailed', { message: e.message });
    $('submit-error').classList.remove('hidden');
    $('btn-submit').disabled = false;
    return;
  }

  // 2. Upload contact sheet if photo capture was used
  if (S.photoEnabled && S.frames.length > 0) {
    $('submitting-note').textContent = t('session.buildingSheet');
    try {
      var sheetDataUrl = await buildContactSheet(S.frames);
      if (sheetDataUrl) {
        $('submitting-note').textContent = t('session.uploadingSheet');
        await apiPost({
          action:      'upload_photo',
          email:       S.email,
          sessionNum:  S.sessionNum,
          imageBase64: sheetDataUrl,
        });
        // Upload errors are non-fatal — core data is already saved
      }
    } catch (_) { /* non-fatal */ }
  }

  // 3. Show next step
  var totalSessions = EXPERIMENT_CONFIG.numSessions;
  if (S.sessionsCompleted < totalSessions) {
    showScheduleStep();
  } else {
    showStep('complete');
  }
}

// =============================================================
// Schedule next session
// =============================================================

function showScheduleStep() {
  var nextNum = S.sessionsCompleted + 1;
  $('schedule-plank-time').textContent = formatTime(S.elapsedMs);
  $('schedule-note').textContent = t('session.scheduleInitial', { num: nextNum });
  $('next-session-num').textContent = nextNum;
  $('next-session-email-num').textContent = nextNum;
  $('next-session-btn-num').textContent = nextNum;
  setupNextSessionPicker(nextNum);
  showStep('schedule');
}

// =============================================================
// Boot
// =============================================================

document.addEventListener('DOMContentLoaded', init);
