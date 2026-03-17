// =============================================================
// session.js — State machine for the guided session flow
// =============================================================

// ---- Application state ----
var S = {
  email:        null,
  sessionNum:   null,
  participant:  null,  // data from Apps Script GET
  track:        null,  // { id, label, youtubeId }

  // YouTube
  ytPlayer:     null,
  ytReady:      false,
  ytPlayCalled: false,

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

  // Submission results
  sessionId:     null,
  sessionsCompleted: 0,
};

// ---- Step IDs in order (for progress bar) ----
var STEPS = [
  'loading', 'error', 'safety', 'instructions',
  'audio', 'pre-task', 'plank', 'post-task',
  'submitting', 'schedule', 'complete',
];
var PROGRESS_STEPS = ['safety', 'instructions', 'audio', 'pre-task', 'plank', 'post-task'];

// =============================================================
// DOM helpers
// =============================================================

function $(id) { return document.getElementById(id); }

function showStep(name) {
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
  var idx = PROGRESS_STEPS.indexOf(name);
  var pct = idx < 0 ? 0 : Math.round(((idx + 1) / PROGRESS_STEPS.length) * 100);
  $('progress-fill').style.width = pct + '%';
  // Scroll to top
  window.scrollTo({ top: 0 });
}

function showError(msg) {
  $('error-message').textContent = msg;
  showStep('error');
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
    S.cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: 640, height: 480 },
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

  questions.forEach(function (q) {
    var wrapper = document.createElement('div');
    wrapper.className = 'bg-slate-800 rounded-2xl p-4';

    var label = document.createElement('p');
    label.className = 'text-white text-sm font-medium mb-3 leading-snug';
    label.textContent = q.text;
    wrapper.appendChild(label);

    if (q.type === 'scale') {
      var row = document.createElement('div');
      row.className = 'flex gap-1 mb-2';
      for (var v = q.min; v <= q.max; v++) {
        (function (val) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'scale-btn';
          btn.textContent = val;
          btn.dataset.value = val;
          btn.addEventListener('click', function () {
            row.querySelectorAll('.scale-btn').forEach(function (b) {
              b.classList.remove('selected');
            });
            btn.classList.add('selected');
            answersObj[q.id] = val;
            if (onChangeCallback) onChangeCallback();
          });
          row.appendChild(btn);
        })(v);
      }
      var labels = document.createElement('div');
      labels.className = 'flex justify-between text-xs text-slate-500 mt-1';
      labels.innerHTML = '<span>' + q.minLabel + '</span><span>' + q.maxLabel + '</span>';
      wrapper.appendChild(row);
      wrapper.appendChild(labels);

    } else if (q.type === 'radio') {
      var optList = document.createElement('div');
      optList.className = 'flex flex-col gap-2';
      q.options.forEach(function (opt) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'radio-btn';
        btn.textContent = opt;
        btn.addEventListener('click', function () {
          optList.querySelectorAll('.radio-btn').forEach(function (b) {
            b.classList.remove('selected');
          });
          btn.classList.add('selected');
          answersObj[q.id] = opt;
          if (onChangeCallback) onChangeCallback();
        });
        optList.appendChild(btn);
      });
      wrapper.appendChild(optList);

    } else if (q.type === 'textarea') {
      var ta = document.createElement('textarea');
      ta.rows = 3;
      ta.placeholder = 'Optional — leave blank to skip';
      ta.className = 'w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-500 ' +
        'rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-blue-500';
      ta.addEventListener('input', function () {
        answersObj[q.id] = ta.value;
        if (onChangeCallback) onChangeCallback();
      });
      wrapper.appendChild(ta);
    }

    container.appendChild(wrapper);
  });
}

function allAnswered(questions, answersObj) {
  return questions.every(function (q) {
    if (q.required === false) return true;
    var val = answersObj[q.id];
    return val !== undefined && val !== null && val !== '';
  });
}

// =============================================================
// Calendar date constraints for next session
// =============================================================

function setupNextSessionPicker(sessionNum) {
  var input = $('next-session-dt');
  var now = new Date();
  var minDt = new Date(now.getTime() + 24 * 3600 * 1000);
  var maxDt = new Date(now.getTime() + 72 * 3600 * 1000);

  function toLocal(d) {
    return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }
  input.min = toLocal(minDt);
  input.max = toLocal(maxDt);

  input.addEventListener('change', function () {
    if (!input.value) return;
    renderCalendarLinks(
      $('next-calendar-links'),
      { email: S.email, sessionNum: sessionNum, scheduledDateTime: input.value }
    );
  });
}

// =============================================================
// Init — runs on page load
// =============================================================

async function init() {
  // Parse URL params
  var params = new URLSearchParams(window.location.search);
  S.email      = params.get('email');
  S.sessionNum = parseInt(params.get('session'), 10);

  if (!S.email || !S.sessionNum) {
    showError('Missing session parameters. Please use the link from your calendar event.');
    return;
  }

  // Load participant data
  try {
    var data = await apiGet({ email: S.email });
    if (!data.found) {
      showError('Email not found. Please register first.');
      return;
    }
    S.participant = data;
  } catch (e) {
    showError('Could not load your participant data. Check your connection and reload.');
    return;
  }

  // Validate session number
  var completed = S.participant.sessionsCompleted;
  var total     = EXPERIMENT_CONFIG.numSessions;

  if (S.sessionNum <= completed) {
    showError(
      'You have already submitted Session ' + S.sessionNum + '. ' +
      (completed < total ? 'Please use your Session ' + (completed + 1) + ' link.' : 'You have completed all sessions — thank you!')
    );
    return;
  }
  if (S.sessionNum > completed + 1) {
    showError(
      'Please complete Session ' + (completed + 1) + ' first.'
    );
    return;
  }

  // Resolve which track this participant gets for this session
  var perm = EXPERIMENT_CONFIG.permutations[S.participant.groupIndex];
  var trackId = perm[S.sessionNum - 1];
  S.track = EXPERIMENT_CONFIG.tracks.find(function (t) { return t.id === trackId; });

  // Set up step 1 (safety)
  setupSafetyStep();
  showStep('safety');
}

// =============================================================
// Step 1: Safety
// =============================================================

function setupSafetyStep() {
  $('safety-email').textContent = S.email;
  $('safety-session-label').textContent =
    'Session ' + S.sessionNum + ' of ' + EXPERIMENT_CONFIG.numSessions;

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
    showStep('audio');
    setupAudioStep();
  });
}

// =============================================================
// Step 3: Audio
// =============================================================

function setupAudioStep() {
  $('audio-track-label').textContent = 'Today\'s track: ' + S.track.label;

  var fallbackEl = $('audio-fallback-link');
  var ytUrl = 'https://youtu.be/' + S.track.youtubeId;
  fallbackEl.innerHTML = '<a href="' + ytUrl + '" target="_blank" rel="noopener" class="underline">' +
    'Open: ' + ytUrl + '</a>';

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

  // Hide camera option if getUserMedia not supported
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    camOption.style.display = 'none';
  }

  camToggle.addEventListener('change', async function () {
    if (!camToggle.checked) {
      S.photoEnabled = false;
      camStatus.textContent = '';
      if (S.cameraStream) {
        S.cameraStream.getTracks().forEach(function (t) { t.stop(); });
        S.cameraStream = null;
      }
      return;
    }
    camStatus.textContent = 'Requesting camera permission...';
    var ok = await startCamera();
    if (ok) {
      S.photoEnabled = true;
      $('camera-feed').classList.remove('hidden');
      camStatus.textContent = 'Camera ready. A thumbnail will be captured each second.';
    } else {
      camToggle.checked = false;
      S.photoEnabled = false;
      camStatus.textContent = 'Camera permission denied — continuing without it.';
    }
  });

  $('btn-pre-task-next').addEventListener('click', function () {
    showStep('plank');
    setupPlankStep();
  });
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

  if (S.photoEnabled) {
    $('recording-indicator').classList.remove('hidden');
  }

  // Start timer + capture
  requestWakeLock();
  startTimer();
  if (S.photoEnabled) {
    startCapture();
  }

  $('btn-plank-stop').addEventListener('click', handlePlankStop, { once: true });
}

async function handlePlankStop() {
  var ms = stopTimer();
  releaseWakeLock();

  if (S.photoEnabled) {
    stopCapture();
  }

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

  renderQuestions(
    EXPERIMENT_CONFIG.postTasks,
    'post-task-form',
    S.postTasks,
    checkPostTaskComplete
  );

  $('btn-submit').addEventListener('click', submitSession.bind(null, totalSec));
}

function checkPostTaskComplete() {
  $('btn-submit').disabled =
    !allAnswered(EXPERIMENT_CONFIG.postTasks, S.postTasks);
}

// =============================================================
// Submit
// =============================================================

async function submitSession(totalSec) {
  $('submit-error').classList.add('hidden');
  showStep('submitting');
  $('submitting-note').textContent = 'Submitting session data...';

  // 1. Submit core session data
  try {
    var sessionRes = await apiPost({
      action:          'session',
      email:           S.email,
      sessionNum:      S.sessionNum,
      audioTrack:      S.track.id,
      plankDurationSec: parseFloat(totalSec.toFixed(3)),
      preTasks:        S.preTasks,
      postTasks:       S.postTasks,
    });

    if (sessionRes.error) throw new Error(sessionRes.error);
    S.sessionId = sessionRes.sessionId;
    S.sessionsCompleted = sessionRes.sessionsCompleted;
  } catch (e) {
    showStep('post-task');
    $('submit-error').textContent = 'Submission failed: ' + e.message + '. Please try again.';
    $('submit-error').classList.remove('hidden');
    $('btn-submit').disabled = false;
    return;
  }

  // 2. Upload contact sheet if photo capture was used
  if (S.photoEnabled && S.frames.length > 0) {
    $('submitting-note').textContent = 'Building photo contact sheet...';
    try {
      var sheetDataUrl = await buildContactSheet(S.frames);
      if (sheetDataUrl) {
        $('submitting-note').textContent = 'Uploading contact sheet...';
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
  $('schedule-note').textContent =
    'Now schedule Session ' + nextNum + ' (24 – 72 hours from now).';
  $('next-session-num').textContent = nextNum;
  setupNextSessionPicker(nextNum);
  showStep('schedule');
}

// =============================================================
// Boot
// =============================================================

document.addEventListener('DOMContentLoaded', init);
