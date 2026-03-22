// =============================================================
// Physical Performance Study — Google Apps Script Backend
// =============================================================

var DRIVE_FOLDER_ID = '13Z07fo_5xWixuiSueCZvtBiYfHvxMohS';

// Set this to your deployed static-site base URL so emailed links open the site.
// Example: 'https://your-study-site.netlify.app/'
var SITE_BASE_URL = 'https://carlos-schrupp.github.io/w241-plank-study/';

// Keep these in sync with js/config.js
var TRACKS = ['pop', 'trance']; // add 'track3' if numSessions = 3
var NUM_SESSIONS = 2;

// =============================================================
// CORS / response helpers
// =============================================================

function _json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function _sessionPlanFieldName(sessionNum) {
  return 'session' + sessionNum + '_planned_at';
}

function _toYesNo(flag) {
  return flag ? 'yes' : 'no';
}

function _fromYesNo(value) {
  var str = String(value || '').toLowerCase();
  return str === 'yes' || str === 'true';
}

function _normalizeSiteBaseUrl() {
  var base = String(SITE_BASE_URL || '').trim();
  if (!base) return '';
  if (base.charAt(base.length - 1) !== '/') base += '/';
  return base;
}

function _objectToRow(headers, obj) {
  return headers.map(function (key) {
    return Object.prototype.hasOwnProperty.call(obj, key) ? obj[key] : '';
  });
}

function _appendObjectRow(sheetName, obj) {
  var sheet = _getSheet(sheetName);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  sheet.appendRow(_objectToRow(headers, obj));
}

function _setParticipantFields(rowNum, updates) {
  var sheet = _getSheet('participants');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  Object.keys(updates).forEach(function (key) {
    var colIdx = headers.indexOf(key);
    if (colIdx >= 0) {
      sheet.getRange(rowNum, colIdx + 1).setValue(updates[key]);
    }
  });
}

function _participantToResponse(p) {
  var sessionsCompleted = Number(p.sessions_completed) || 0;
  var nextSessionNum = sessionsCompleted < NUM_SESSIONS ? sessionsCompleted + 1 : null;
  var out = {
    found: true,
    participantId: p.id,
    groupIndex: Number(p.group_index),
    groupLabel: p.group_label,
    sessionsCompleted: sessionsCompleted,
    nextSessionNum: nextSessionNum,
    emailOptIn: _fromYesNo(p.email_opt_in),
  };

  for (var s = 1; s <= NUM_SESSIONS; s++) {
    var plannedVal = p[_sessionPlanFieldName(s)];
    if (Object.prototype.toString.call(plannedVal) === '[object Date]' && !isNaN(plannedVal.getTime())) {
      plannedVal = plannedVal.toISOString();
    }
    out['session' + s + 'PlannedAt'] = plannedVal ? String(plannedVal) : '';
  }

  return out;
}

function _buildSessionUrl(email, sessionNum) {
  var base = _normalizeSiteBaseUrl();
  if (!base) return '';
  return base + 'session.html?email=' + encodeURIComponent(email) + '&session=' + sessionNum;
}

function _logRegistrationAttempt(obj) {
  _appendObjectRow('registration_attempts', obj);
}

function _logEmailEvent(obj) {
  _appendObjectRow('email_log', obj);
}

function _sendSessionLinkEmail(opts) {
  var sessionUrl = _buildSessionUrl(opts.email, opts.sessionNum);
  var sentAt = new Date().toISOString();
  if (!sessionUrl) {
    var missingBaseError = 'SITE_BASE_URL is not configured.';
    _logEmailEvent({
      sent_at: sentAt,
      email: opts.email,
      session_num: opts.sessionNum,
      email_type: opts.emailType,
      scheduled_at: opts.scheduledAt || '',
      status: 'failed',
      error: missingBaseError,
    });
    return { sent: false, error: missingBaseError };
  }

  var studyTitle = 'Physical Performance Study';
  var subject = studyTitle + ': Your Session ' + opts.sessionNum + ' link';
  var timeText = opts.scheduledLabel
    ? ('Planned time: ' + opts.scheduledLabel + '\n\n')
    : '';
  var body =
    'Thank you for participating in the ' + studyTitle + '.\n\n' +
    'Session ' + opts.sessionNum + ' link:\n' + sessionUrl + '\n\n' +
    timeText +
    'Open this link when it is time for your session.\n' +
    'Calendar reminders are still recommended.\n\n' +
    'Questions? Contact ' + opts.contactEmail + '.';
  var htmlBody =
    '<p>Thank you for participating in the <strong>' + studyTitle + '</strong>.</p>' +
    '<p><strong>Session ' + opts.sessionNum + ' link:</strong><br>' +
    '<a href="' + sessionUrl + '">' + sessionUrl + '</a></p>' +
    (opts.scheduledLabel
      ? '<p><strong>Planned time:</strong> ' + opts.scheduledLabel + '</p>'
      : '') +
    '<p>Open this link when it is time for your session. Calendar reminders are still recommended.</p>' +
    '<p>Questions? Contact <a href="mailto:' + opts.contactEmail + '">' + opts.contactEmail + '</a>.</p>';

  try {
    MailApp.sendEmail({
      to: opts.email,
      subject: subject,
      body: body,
      htmlBody: htmlBody,
    });
    _logEmailEvent({
      sent_at: sentAt,
      email: opts.email,
      session_num: opts.sessionNum,
      email_type: opts.emailType,
      scheduled_at: opts.scheduledAt || '',
      status: 'sent',
      error: '',
    });
    return { sent: true, error: '' };
  } catch (err) {
    _logEmailEvent({
      sent_at: sentAt,
      email: opts.email,
      session_num: opts.sessionNum,
      email_type: opts.emailType,
      scheduled_at: opts.scheduledAt || '',
      status: 'failed',
      error: err.message,
    });
    return { sent: false, error: err.message };
  }
}

function _validateScheduledWindow(isoString, minHours, maxHours) {
  var dt = new Date(isoString);
  if (isNaN(dt.getTime())) {
    return 'Please choose a valid date and time.';
  }
  var diffMs = dt.getTime() - Date.now();
  var minMs = minHours * 3600 * 1000;
  var maxMs = maxHours * 3600 * 1000;
  if (diffMs < minMs || diffMs > maxMs) {
    return 'Please choose a time between ' + minHours + ' and ' + maxHours + ' hours from now.';
  }
  return '';
}

// =============================================================
// Latin-square permutation generator
// =============================================================

function _permute(arr) {
  if (arr.length <= 1) return [arr.slice()];
  var result = [];
  for (var i = 0; i < arr.length; i++) {
    var rest = arr.filter(function (_, j) { return j !== i; });
    var sub = _permute(rest);
    for (var k = 0; k < sub.length; k++) {
      result.push([arr[i]].concat(sub[k]));
    }
  }
  return result;
}

var ALL_PERMUTATIONS = _permute(TRACKS);

// =============================================================
// Sheet helpers — tabs are auto-created if missing
// =============================================================

function _getSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (name === 'participants') {
      var participantHeaders = [
        'id', 'name', 'email', 'age', 'gender',
        'group_index', 'group_label',
        'sessions_completed', 'registered_at'
      ];
      for (var s = 1; s <= NUM_SESSIONS; s++) {
        participantHeaders.push(_sessionPlanFieldName(s));
      }
      participantHeaders.push('email_opt_in');
      sheet.appendRow(participantHeaders);
      sheet.setFrozenRows(1);
    } else if (name === 'sessions') {
      sheet.appendRow([
        'participant_id', 'email', 'session_num', 'audio_track',
        'plank_duration_sec',
        'pre_task_answers', 'post_task_answers',
        'contact_sheet_url', 'submitted_at'
      ]);
      sheet.setFrozenRows(1);
    } else if (name === 'registration_attempts') {
      sheet.appendRow([
        'attempt_id', 'attempted_at', 'email', 'name', 'age', 'gender',
        'injury_unsafe', 'availability_yes',
        'session1_planned_at', 'enrollment_status', 'participant_id',
        'consent_bp', 'consent_participate', 'email_opt_in'
      ]);
      sheet.setFrozenRows(1);
    } else if (name === 'email_log') {
      sheet.appendRow([
        'sent_at', 'email', 'session_num', 'email_type',
        'scheduled_at', 'status', 'error'
      ]);
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

function _findParticipant(email) {
  var sheet = _getSheet('participants');
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return null;
  var headers = data[0];
  var emailCol = headers.indexOf('email');
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][emailCol]).toLowerCase() === String(email).toLowerCase()) {
      var obj = {};
      headers.forEach(function (h, j) { obj[h] = data[i][j]; });
      obj._row = i + 1;
      return obj;
    }
  }
  return null;
}

// =============================================================
// HTTP endpoints
// =============================================================

function doGet(e) {
  try {
    var email = (e.parameter && e.parameter.email) ? e.parameter.email : null;
    if (!email) return _json({ error: 'email param required' });
    var p = _findParticipant(email);
    if (!p) return _json({ found: false });
    return _json(_participantToResponse(p));
  } catch (err) {
    return _json({ error: err.message });
  }
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (data.action === 'register')               return _handleRegister(data);
    if (data.action === 'session')                return _handleSession(data);
    if (data.action === 'schedule_next_session')  return _handleScheduleNextSession(data);
    if (data.action === 'upload_photo')           return _handleUploadPhoto(data);
    return _json({ error: 'Unknown action: ' + data.action });
  } catch (err) {
    return _json({ error: err.message });
  }
}

// =============================================================
// Handler: register
// =============================================================

function _handleRegister(data) {
  var name = (data.name || '').trim();
  var email = (data.email || '').trim().toLowerCase();
  var ageNum = parseInt(String(data.age), 10);
  var injuryUnsafe = data.injuryUnsafe === true;
  var availabilityYes = data.availability === true;
  var session1 = (data.session1PlannedAt || '').trim();
  var session1Label = (data.session1PlannedLabel || '').trim();
  var consentBp = data.consentBp === true;
  var consentParticipate = data.consentParticipate === true;
  var emailOptIn = data.emailOptIn === true;
  var contactEmail = String(data.contactEmail || '').trim() || 'carlos.schrupp@berkeley.edu';

  if (!email || email.indexOf('@') === -1) {
    return _json({ error: 'Valid email is required.' });
  }
  if (isNaN(ageNum)) {
    return _json({ error: 'Age is required.' });
  }

  var genderNorm = String(data.gender || '').trim().toLowerCase();
  if (['male', 'female', 'other'].indexOf(genderNorm) === -1) {
    return _json({ error: 'Please select Male, Female, or Other.' });
  }

  var now = new Date().toISOString();
  var attemptId = Utilities.getUuid();
  var enrollmentStatus = '';

  if (injuryUnsafe) {
    enrollmentStatus = 'screened_out_injury';
    _logRegistrationAttempt({
      attempt_id: attemptId,
      attempted_at: now,
      email: email,
      name: name,
      age: ageNum,
      gender: genderNorm,
      injury_unsafe: 'yes',
      availability_yes: _toYesNo(availabilityYes),
      session1_planned_at: session1,
      enrollment_status: enrollmentStatus,
      participant_id: '',
      consent_bp: consentBp,
      consent_participate: consentParticipate,
      email_opt_in: _toYesNo(emailOptIn),
    });
    return _json({
      success: true,
      enrolled: false,
      enrollmentStatus: enrollmentStatus,
    });
  }

  if (!availabilityYes) {
    enrollmentStatus = 'screened_out_availability';
    _logRegistrationAttempt({
      attempt_id: attemptId,
      attempted_at: now,
      email: email,
      name: name,
      age: ageNum,
      gender: genderNorm,
      injury_unsafe: 'no',
      availability_yes: 'no',
      session1_planned_at: session1,
      enrollment_status: enrollmentStatus,
      participant_id: '',
      consent_bp: consentBp,
      consent_participate: consentParticipate,
      email_opt_in: _toYesNo(emailOptIn),
    });
    return _json({
      success: true,
      enrolled: false,
      enrollmentStatus: enrollmentStatus,
    });
  }

  if (!consentBp || !consentParticipate) {
    return _json({ error: 'Please confirm the safety and participation statements to enroll.' });
  }
  if (!session1) {
    return _json({ error: 'Please choose a date and time for Session 1.' });
  }

  var existing = _findParticipant(email);
  if (existing) {
    enrollmentStatus = 'already_registered';
    var existingResp = _participantToResponse(existing);
    var nextSessionNum = existingResp.nextSessionNum;
    var emailDelivery = { sent: false, error: '' };
    var nextPlannedAt = nextSessionNum
      ? String(existing[_sessionPlanFieldName(nextSessionNum)] || '')
      : '';

    if (emailOptIn && nextSessionNum && nextPlannedAt) {
      _setParticipantFields(existing._row, { email_opt_in: 'yes' });
      emailDelivery = _sendSessionLinkEmail({
        email: email,
        sessionNum: nextSessionNum,
        scheduledAt: nextPlannedAt,
        scheduledLabel: '',
        emailType: 'registration_resend',
        contactEmail: contactEmail,
      });
      existing.email_opt_in = 'yes';
      existingResp.emailOptIn = true;
    }

    _logRegistrationAttempt({
      attempt_id: attemptId,
      attempted_at: now,
      email: email,
      name: name,
      age: ageNum,
      gender: genderNorm,
      injury_unsafe: 'no',
      availability_yes: 'yes',
      session1_planned_at: session1,
      enrollment_status: enrollmentStatus,
      participant_id: String(existing.id),
      consent_bp: consentBp,
      consent_participate: consentParticipate,
      email_opt_in: _toYesNo(emailOptIn),
    });

    return _json({
      alreadyRegistered: true,
      enrolled: false,
      enrollmentStatus: enrollmentStatus,
      emailSent: emailDelivery.sent,
      emailError: emailDelivery.error,
      nextSessionNum: existingResp.nextSessionNum,
      session1PlannedAt: existingResp.session1PlannedAt,
      session2PlannedAt: existingResp.session2PlannedAt,
      participantId: existingResp.participantId,
      groupIndex: existingResp.groupIndex,
      groupLabel: existingResp.groupLabel,
      sessionsCompleted: existingResp.sessionsCompleted,
      emailOptIn: existingResp.emailOptIn,
    });
  }

  var participantId = Utilities.getUuid();
  var sheet = _getSheet('participants');
  var total = Math.max(0, sheet.getLastRow() - 1);
  var groupIndex = total % ALL_PERMUTATIONS.length;
  var groupLabel = ALL_PERMUTATIONS[groupIndex].join('');

  var participantObj = {
    id: participantId,
    name: name,
    email: email,
    age: ageNum,
    gender: genderNorm,
    group_index: groupIndex,
    group_label: groupLabel,
    sessions_completed: 0,
    registered_at: now,
    email_opt_in: _toYesNo(emailOptIn),
  };
  participantObj[_sessionPlanFieldName(1)] = session1;
  for (var s = 2; s <= NUM_SESSIONS; s++) {
    participantObj[_sessionPlanFieldName(s)] = '';
  }
  _appendObjectRow('participants', participantObj);

  enrollmentStatus = 'enrolled';
  _logRegistrationAttempt({
    attempt_id: attemptId,
    attempted_at: now,
    email: email,
    name: name,
    age: ageNum,
    gender: genderNorm,
    injury_unsafe: 'no',
    availability_yes: 'yes',
    session1_planned_at: session1,
    enrollment_status: enrollmentStatus,
    participant_id: participantId,
    consent_bp: consentBp,
    consent_participate: consentParticipate,
    email_opt_in: _toYesNo(emailOptIn),
  });

  var emailDeliveryNew = { sent: false, error: '' };
  if (emailOptIn) {
    emailDeliveryNew = _sendSessionLinkEmail({
      email: email,
      sessionNum: 1,
      scheduledAt: session1,
      scheduledLabel: session1Label,
      emailType: 'registration',
      contactEmail: contactEmail,
    });
  }

  return _json({
    success: true,
    enrolled: true,
    enrollmentStatus: enrollmentStatus,
    participantId: participantId,
    groupIndex: groupIndex,
    groupLabel: groupLabel,
    sessionsCompleted: 0,
    nextSessionNum: 1,
    session1PlannedAt: session1,
    emailOptIn: emailOptIn,
    emailSent: emailDeliveryNew.sent,
    emailError: emailDeliveryNew.error,
  });
}

// =============================================================
// Handler: session data submission
// =============================================================

function _handleSession(data) {
  var email = (data.email || '').trim().toLowerCase();
  var sessionNum = Number(data.sessionNum);
  if (!email || !sessionNum) return _json({ error: 'email and sessionNum required' });

  var p = _findParticipant(email);
  if (!p) return _json({ error: 'participant not found' });

  var sessionId = Utilities.getUuid();
  var now = new Date().toISOString();

  _getSheet('sessions').appendRow([
    p.id,
    email,
    sessionNum,
    data.audioTrack || '',
    Number(data.plankDurationSec) || 0,
    JSON.stringify(data.preTasks || {}),
    JSON.stringify(data.postTasks || {}),
    '',
    now,
  ]);

  var completed = Number(p.sessions_completed) + 1;
  _setParticipantFields(p._row, { sessions_completed: completed });

  return _json({
    success: true,
    sessionId: sessionId,
    sessionsCompleted: completed,
  });
}

// =============================================================
// Handler: save next session schedule
// =============================================================

function _handleScheduleNextSession(data) {
  var email = (data.email || '').trim().toLowerCase();
  var nextSessionNum = Number(data.nextSessionNum);
  var scheduledAt = (data.scheduledAt || '').trim();
  var scheduledLabel = (data.scheduledLabel || '').trim();
  var emailOptIn = data.emailOptIn === true;
  var contactEmail = String(data.contactEmail || '').trim() || 'carlos.schrupp@berkeley.edu';

  if (!email || !nextSessionNum || !scheduledAt) {
    return _json({ error: 'email, nextSessionNum, and scheduledAt are required' });
  }

  var p = _findParticipant(email);
  if (!p) return _json({ error: 'participant not found' });

  var expectedNextSession = Number(p.sessions_completed) + 1;
  if (nextSessionNum !== expectedNextSession) {
    return _json({ error: 'Please schedule the next incomplete session only.' });
  }
  if (nextSessionNum > NUM_SESSIONS) {
    return _json({ error: 'All sessions are already complete.' });
  }

  var validationError = _validateScheduledWindow(scheduledAt, 24, 72);
  if (validationError) {
    return _json({ error: validationError });
  }

  var fieldName = _sessionPlanFieldName(nextSessionNum);
  var updates = {
    email_opt_in: _toYesNo(emailOptIn),
  };
  updates[fieldName] = scheduledAt;
  _setParticipantFields(p._row, updates);

  var emailDelivery = { sent: false, error: '' };
  if (emailOptIn) {
    emailDelivery = _sendSessionLinkEmail({
      email: email,
      sessionNum: nextSessionNum,
      scheduledAt: scheduledAt,
      scheduledLabel: scheduledLabel,
      emailType: 'schedule_next_session',
      contactEmail: contactEmail,
    });
  }

  return _json({
    success: true,
    nextSessionNum: nextSessionNum,
    scheduledAt: scheduledAt,
    emailOptIn: emailOptIn,
    emailSent: emailDelivery.sent,
    emailError: emailDelivery.error,
  });
}

// =============================================================
// Handler: contact-sheet photo upload to Google Drive
// =============================================================

function _handleUploadPhoto(data) {
  var email = (data.email || '').trim().toLowerCase();
  var sessionNum = Number(data.sessionNum);
  var imageB64 = data.imageBase64 || '';
  if (!email || !sessionNum || !imageB64) {
    return _json({ error: 'email, sessionNum, and imageBase64 required' });
  }

  var sheet = _getSheet('sessions');
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var emailCol = headers.indexOf('email');
  var sessionNumCol = headers.indexOf('session_num');
  var photoUrlCol = headers.indexOf('contact_sheet_url');

  var targetRow = -1;
  for (var i = rows.length - 1; i >= 1; i--) {
    if (
      String(rows[i][emailCol]).toLowerCase() === email &&
      Number(rows[i][sessionNumCol]) === sessionNum
    ) {
      targetRow = i + 1;
      break;
    }
  }
  if (targetRow === -1) return _json({ error: 'session row not found' });

  try {
    var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    var clean = imageB64.replace(/^data:image\/jpeg;base64,/, '');
    var bytes = Utilities.base64Decode(clean);
    var blob = Utilities.newBlob(bytes, 'image/jpeg',
      email + '_session' + sessionNum + '_sheet.jpg');
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    var url = file.getUrl();
    sheet.getRange(targetRow, photoUrlCol + 1).setValue(url);
    return _json({ success: true, url: url });
  } catch (err) {
    return _json({ error: 'Drive upload failed: ' + err.message });
  }
}
