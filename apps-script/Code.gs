// =============================================================
// W241 Plank Study — Google Apps Script Backend
//
// SETUP INSTRUCTIONS (do this once before deploying):
//
// 1. Open Google Sheets. Go to Extensions > Apps Script.
//    Delete any existing code and paste this entire file.
//
// 2. Create a Google Drive folder for contact-sheet photos.
//    Open it, copy the folder ID from the URL:
//    drive.google.com/drive/folders/FOLDER_ID_IS_HERE
//    Paste it into DRIVE_FOLDER_ID below.
//
// 3. In Apps Script, click Deploy > New Deployment.
//    Type: Web App
//    Execute as: Me
//    Who has access: Anyone
//    Click Deploy, copy the Web App URL.
//
// 4. Paste the Web App URL into js/config.js → apiUrl.
//
// 5. The Sheets tabs (participants, sessions) are created automatically
//    on first request. You do not need to create them manually.
// =============================================================

var DRIVE_FOLDER_ID = 'REPLACE_WITH_YOUR_GOOGLE_DRIVE_FOLDER_ID';

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

// =============================================================
// Latin-square permutation generator
// =============================================================

function _permute(arr) {
  if (arr.length <= 1) return [arr.slice()];
  var result = [];
  for (var i = 0; i < arr.length; i++) {
    var rest = arr.filter(function(_, j) { return j !== i; });
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
      sheet.appendRow([
        'id', 'name', 'email',
        'group_index', 'group_label',
        'sessions_completed', 'registered_at'
      ]);
      sheet.setFrozenRows(1);
    } else if (name === 'sessions') {
      sheet.appendRow([
        'participant_id', 'email', 'session_num', 'audio_track',
        'plank_duration_sec',
        'pre_task_answers', 'post_task_answers',
        'contact_sheet_url', 'submitted_at'
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
      headers.forEach(function(h, j) { obj[h] = data[i][j]; });
      obj._row = i + 1; // 1-indexed row number for range writes
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
    return _json({
      found: true,
      participantId: p.id,
      groupIndex: Number(p.group_index),
      groupLabel: p.group_label,
      sessionsCompleted: Number(p.sessions_completed),
    });
  } catch (err) {
    return _json({ error: err.message });
  }
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (data.action === 'register')      return _handleRegister(data);
    if (data.action === 'session')       return _handleSession(data);
    if (data.action === 'upload_photo')  return _handleUploadPhoto(data);
    return _json({ error: 'Unknown action: ' + data.action });
  } catch (err) {
    return _json({ error: err.message });
  }
}

// =============================================================
// Handler: register
// =============================================================

function _handleRegister(data) {
  var name  = (data.name  || '').trim();
  var email = (data.email || '').trim().toLowerCase();
  if (!name || !email) return _json({ error: 'name and email required' });

  var existing = _findParticipant(email);
  if (existing) {
    return _json({
      alreadyRegistered: true,
      participantId: existing.id,
      groupIndex: Number(existing.group_index),
      groupLabel: existing.group_label,
      sessionsCompleted: Number(existing.sessions_completed),
    });
  }

  var sheet = _getSheet('participants');
  // Exclude header row when counting existing participants
  var total = Math.max(0, sheet.getLastRow() - 1);
  var groupIndex = total % ALL_PERMUTATIONS.length;
  var groupLabel = ALL_PERMUTATIONS[groupIndex].join('');
  var id  = Utilities.getUuid();
  var now = new Date().toISOString();

  sheet.appendRow([id, name, email, groupIndex, groupLabel, 0, now]);

  return _json({
    success: true,
    participantId: id,
    groupIndex: groupIndex,
    groupLabel: groupLabel,
    sessionsCompleted: 0,
  });
}

// =============================================================
// Handler: session data submission
// =============================================================

function _handleSession(data) {
  var email      = (data.email || '').trim().toLowerCase();
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
    data.audioTrack    || '',
    Number(data.plankDurationSec) || 0,
    JSON.stringify(data.preTasks  || {}),
    JSON.stringify(data.postTasks || {}),
    '', // contact_sheet_url — filled later by upload_photo
    now,
  ]);

  // Increment sessions_completed
  var pSheet = _getSheet('participants');
  var completed = Number(p.sessions_completed) + 1;
  // sessions_completed is column F (index 5, 1-based = 6)
  pSheet.getRange(p._row, 6).setValue(completed);

  return _json({
    success: true,
    sessionId: sessionId,
    sessionsCompleted: completed,
  });
}

// =============================================================
// Handler: contact-sheet photo upload to Google Drive
// =============================================================

function _handleUploadPhoto(data) {
  var email      = (data.email || '').trim().toLowerCase();
  var sessionNum = Number(data.sessionNum);
  var imageB64   = data.imageBase64 || '';
  if (!email || !sessionNum || !imageB64) {
    return _json({ error: 'email, sessionNum, and imageBase64 required' });
  }

  // Locate the session row (most recent match)
  var sheet = _getSheet('sessions');
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var emailCol      = headers.indexOf('email');
  var sessionNumCol = headers.indexOf('session_num');
  var photoUrlCol   = headers.indexOf('contact_sheet_url');

  var targetRow = -1;
  for (var i = rows.length - 1; i >= 1; i--) {
    if (
      String(rows[i][emailCol]).toLowerCase() === email &&
      Number(rows[i][sessionNumCol]) === sessionNum
    ) {
      targetRow = i + 1; // 1-indexed
      break;
    }
  }
  if (targetRow === -1) return _json({ error: 'session row not found' });

  try {
    var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    var clean  = imageB64.replace(/^data:image\/jpeg;base64,/, '');
    var bytes  = Utilities.base64Decode(clean);
    var blob   = Utilities.newBlob(bytes, 'image/jpeg',
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
