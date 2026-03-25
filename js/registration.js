(function () {
  var locale = APP_I18N.locale();
  var CONTACT = (typeof EXPERIMENT_CONFIG !== 'undefined' && EXPERIMENT_CONFIG.researcherEmail)
    ? EXPERIMENT_CONFIG.researcherEmail
    : 'carlos.schrupp@berkeley.edu';

  document.getElementById('contact-line').textContent =
    APP_I18N.t('registration.contactLine', { email: CONTACT }, locale);

  var form = document.getElementById('reg-form');
  var fieldEmail = document.getElementById('field-email');
  var fieldAge = document.getElementById('field-age');
  var fieldName = document.getElementById('field-name');
  var fieldDT = document.getElementById('field-datetime');
  var chkEmailLink = document.getElementById('chk-email-link');
  var chkBp = document.getElementById('chk-bp');
  var chkConsent = document.getElementById('chk-consent');
  var enrollmentExtra = document.getElementById('enrollment-extra');
  var eligibilityHint = document.getElementById('eligibility-hint');
  var btnReg = document.getElementById('btn-register');
  var errBox = document.getElementById('reg-error');
  var spinner = document.getElementById('spinner');
  var viewForm = document.getElementById('view-form');
  var viewSuc = document.getElementById('view-success');
  var viewScreenout = document.getElementById('view-screenout');

  function getInjury() {
    var r = form.querySelector('input[name="injury"]:checked');
    return r ? r.value : null;
  }

  function getAvail() {
    var r = form.querySelector('input[name="avail"]:checked');
    return r ? r.value : null;
  }

  function getGender() {
    var r = form.querySelector('input[name="gender"]:checked');
    return r ? r.value : null;
  }

  function isEligiblePath() {
    return getInjury() === 'no' && getAvail() === 'yes';
  }

  function updateEnrollmentUI() {
    var elig = isEligiblePath();
    if (elig) {
      enrollmentExtra.classList.remove('hidden');
      eligibilityHint.classList.add('hidden');
    } else {
      enrollmentExtra.classList.add('hidden');
      eligibilityHint.classList.remove('hidden');
      fieldDT.value = '';
      chkBp.checked = false;
      chkConsent.checked = false;
    }
    checkReady();
  }

  (function setDatetimeMin() {
    var min = new Date(Date.now() + 60 * 60 * 1000);
    var iso = new Date(min - min.getTimezoneOffset() * 60000)
      .toISOString().slice(0, 16);
    fieldDT.min = iso;
  })();

  function checkReady() {
    var emailOk = fieldEmail.value.trim().indexOf('@') !== -1;
    var ageVal = fieldAge.value.trim();
    var ageOk = ageVal !== '' && !isNaN(parseInt(ageVal, 10));
    var genderOk = getGender() !== null;
    var inj = getInjury();
    var av = getAvail();
    var radiosOk = inj !== null && av !== null;

    var ok = emailOk && ageOk && genderOk && radiosOk;
    if (ok && isEligiblePath()) {
      ok = fieldDT.value !== '' && chkBp.checked && chkConsent.checked;
    }
    btnReg.disabled = !ok;
  }

  ['input', 'change'].forEach(function (evt) {
    fieldEmail.addEventListener(evt, checkReady);
    fieldAge.addEventListener(evt, checkReady);
    fieldName.addEventListener(evt, checkReady);
    fieldDT.addEventListener(evt, checkReady);
    chkBp.addEventListener(evt, checkReady);
    chkConsent.addEventListener(evt, checkReady);
  });
  form.querySelectorAll('input[name="gender"]').forEach(function (el) {
    el.addEventListener('change', checkReady);
  });
  form.querySelectorAll('input[name="injury"], input[name="avail"]').forEach(function (el) {
    el.addEventListener('change', updateEnrollmentUI);
  });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    errBox.classList.add('hidden');
    spinner.classList.remove('hidden');
    btnReg.disabled = true;

    var injuryUnsafe = getInjury() === 'yes';
    var availability = getAvail() === 'yes';
    var ageNum = parseInt(fieldAge.value.trim(), 10);
    var session1Iso = isEligiblePath() ? localDateTimeValueToIso(fieldDT.value) : '';
    var session1Label = session1Iso ? formatStudyDateTime(session1Iso, locale) : '';

    var payload = {
      action: 'register',
      email: fieldEmail.value.trim().toLowerCase(),
      name: fieldName.value.trim(),
      age: ageNum,
      gender: getGender(),
      injuryUnsafe: injuryUnsafe,
      availability: availability,
      session1PlannedAt: session1Iso,
      session1PlannedLabel: session1Label,
      emailOptIn: chkEmailLink.checked,
      consentBp: chkBp.checked,
      consentParticipate: chkConsent.checked,
      contactEmail: CONTACT,
      locale: locale,
    };

    try {
      var res = await fetch(EXPERIMENT_CONFIG.apiUrl, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      var data = await res.json();
      if (data.error) throw new Error(data.error);

      if (data.enrollmentStatus === 'screened_out_injury') {
        viewForm.classList.add('hidden');
        viewScreenout.classList.remove('hidden');
        document.getElementById('screenout-title').textContent =
          APP_I18N.t('registration.screenoutInjuryTitle', {}, locale);
        document.getElementById('screenout-body').textContent =
          APP_I18N.t('registration.screenoutInjuryBody', { email: CONTACT }, locale);
        return;
      }

      if (data.enrollmentStatus === 'screened_out_availability') {
        viewForm.classList.add('hidden');
        viewScreenout.classList.remove('hidden');
        document.getElementById('screenout-title').textContent =
          APP_I18N.t('registration.screenoutAvailabilityTitle', {}, locale);
        document.getElementById('screenout-body').textContent =
          APP_I18N.t('registration.screenoutAvailabilityBody', { email: CONTACT }, locale);
        return;
      }

      if (data.alreadyRegistered) {
        showSuccess({
          name: payload.name,
          email: payload.email,
          groupIndex: data.groupIndex,
          groupLabel: data.groupLabel,
          scheduledDateTime: data.nextSessionNum === 2 ? data.session2PlannedAt : data.session1PlannedAt,
          nextSessionNum: data.nextSessionNum,
          sessionsCompleted: data.sessionsCompleted,
          alreadyRegistered: true,
          emailRequested: payload.emailOptIn,
          emailSent: data.emailSent,
          emailError: data.emailError,
        });
        return;
      }

      if (data.enrolled) {
        showSuccess({
          name: payload.name,
          email: payload.email,
          groupIndex: data.groupIndex,
          groupLabel: data.groupLabel,
          scheduledDateTime: data.session1PlannedAt || session1Iso,
          nextSessionNum: data.nextSessionNum || 1,
          sessionsCompleted: data.sessionsCompleted || 0,
          alreadyRegistered: false,
          emailRequested: payload.emailOptIn,
          emailSent: data.emailSent,
          emailError: data.emailError,
        });
        return;
      }

      throw new Error(APP_I18N.t('registration.unexpectedResponse', {}, locale));
    } catch (err) {
      errBox.textContent = APP_I18N.t('registration.failure', { message: err.message }, locale);
      errBox.classList.remove('hidden');
      btnReg.disabled = false;
    } finally {
      spinner.classList.add('hidden');
    }
  });

  function showSuccess(o) {
    viewForm.classList.add('hidden');
    viewScreenout.classList.add('hidden');
    viewSuc.classList.remove('hidden');
    viewSuc.classList.add('fade-in');

    document.getElementById('success-title').textContent =
      o.sessionsCompleted >= EXPERIMENT_CONFIG.numSessions
        ? APP_I18N.t('registration.success.alreadyComplete', {}, locale)
        : (o.alreadyRegistered
          ? APP_I18N.t('registration.success.alreadyRegistered', {}, locale)
          : APP_I18N.t('registration.success.enrolled', {}, locale));

    var line = APP_I18N.t('registration.success.registeredAs', { email: o.email }, locale);
    if (o.name) line += ' (' + o.name + ')';
    document.getElementById('success-line').textContent = line;

    if (o.sessionsCompleted >= EXPERIMENT_CONFIG.numSessions) {
      document.getElementById('group-badge').classList.add('hidden');
      document.getElementById('success-session-box').classList.add('hidden');
      document.getElementById('success-link-container').innerHTML = '';
      document.getElementById('calendar-links-container').innerHTML = '';
      document.getElementById('success-email-status').classList.add('hidden');
      return;
    }

    document.getElementById('group-badge').classList.remove('hidden');
    document.getElementById('success-session-box').classList.remove('hidden');

    var perms = EXPERIMENT_CONFIG.permutations;
    var tracks = EXPERIMENT_CONFIG.tracks;
    var perm = perms[o.groupIndex];
    var labels = perm.map(function (id) {
      var t = tracks.find(function (x) { return x.id === id; });
      return t ? APP_I18N.text(t.label, locale) : id;
    });
    document.getElementById('group-label').textContent =
      APP_I18N.t('registration.success.groupPrefix', {}, locale) + labels.join(' -> ');

    document.getElementById('success-session-label').textContent =
      APP_I18N.t('registration.success.scheduledFor', { num: o.nextSessionNum }, locale);
    document.getElementById('success-session-time').textContent =
      formatStudyDateTime(o.scheduledDateTime, locale) || APP_I18N.t('common.notYetScheduled', {}, locale);
    document.getElementById('success-prep-title').textContent =
      APP_I18N.t('registration.success.beforeSession', { num: o.nextSessionNum }, locale);

    renderDirectSessionLink(
      document.getElementById('success-link-container'),
      {
        email: o.email,
        sessionNum: o.nextSessionNum,
        locale: locale,
        buttonLabel: APP_I18N.t('common.openSession', { num: o.nextSessionNum }, locale),
        note: APP_I18N.t('registration.success.directLinkNote', {}, locale),
      }
    );

    if (o.scheduledDateTime) {
      renderCalendarLinks(
        document.getElementById('calendar-links-container'),
        {
          email: o.email,
          sessionNum: o.nextSessionNum,
          scheduledDateTime: o.scheduledDateTime,
          locale: locale,
        }
      );
    } else {
      document.getElementById('calendar-links-container').innerHTML = '';
    }

    var emailStatus = document.getElementById('success-email-status');
    emailStatus.className = 'hidden text-xs rounded-xl px-4 py-3 mb-4';
    if (o.emailSent) {
      emailStatus.textContent = APP_I18N.t(
        'registration.success.emailSent',
        { num: o.nextSessionNum, email: o.email },
        locale
      );
      emailStatus.classList.remove('hidden');
      emailStatus.classList.add('bg-emerald-500/10', 'text-emerald-200', 'border', 'border-emerald-500/30');
    } else if (o.emailRequested && o.emailError) {
      emailStatus.textContent = APP_I18N.t('registration.success.emailFailed', {}, locale);
      emailStatus.classList.remove('hidden');
      emailStatus.classList.add('bg-amber-500/10', 'text-amber-200', 'border', 'border-amber-500/30');
    }
  }

  document.getElementById('btn-re-register').addEventListener('click', function () {
    viewSuc.classList.add('hidden');
    viewForm.classList.remove('hidden');
    viewForm.classList.add('fade-in');
    form.reset();
    updateEnrollmentUI();
    btnReg.disabled = true;
  });

  document.getElementById('btn-screenout-back').addEventListener('click', function () {
    viewScreenout.classList.add('hidden');
    viewForm.classList.remove('hidden');
    viewForm.classList.add('fade-in');
    btnReg.disabled = false;
    checkReady();
  });

  updateEnrollmentUI();
})();
