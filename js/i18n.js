(function (global) {
  var STRINGS = {
    en: {
      study: {
        title: 'Physical Performance Study',
      },
      common: {
        sessionLabel: 'Session {num}',
        openSession: 'Open Session {num}',
        notYetScheduled: 'Not yet scheduled',
        stopAudio: 'Stop audio',
        audioStopped: 'Audio stopped',
      },
      registration: {
        contactLine: 'Questions? Contact the researcher at {email}.',
        unexpectedResponse: 'Unexpected response from server.',
        failure: 'Registration failed: {message}. Please check your connection and try again.',
        screenoutInjuryTitle: 'Not eligible at this time',
        screenoutInjuryBody: 'For your safety, you should not enroll in this study online based on your answers. If you have questions, contact {email}.',
        screenoutAvailabilityTitle: 'Scheduling does not fit this study',
        screenoutAvailabilityBody: 'This study requires two short sessions within a specific time window. Thank you for your interest. If you have questions, contact {email}.',
        success: {
          alreadyComplete: 'Study already complete',
          alreadyRegistered: 'Already registered',
          enrolled: 'You\'re enrolled!',
          registeredAs: 'Registered as: {email}',
          groupPrefix: 'Session order (assigned audio): ',
          scheduledFor: 'Session {num} scheduled for:',
          beforeSession: 'Before Session {num}',
          directLinkNote: 'You can use this link directly if your calendar reminder fails.',
          emailSent: 'We sent your Session {num} link to {email}.',
          emailFailed: 'We could not send the email, but your direct link is shown below.',
        },
      },
      calendar: {
        directLinkTitle: 'Direct session link',
        openSession: 'Open Session {num}',
        eventTitle: '{studyTitle} - Session {num}',
        descriptionOpenLink: 'When it\'s time, open this link:',
        descriptionReminder: 'Remember: wear comfortable clothing and have space for a forearm plank.',
        addPrompt: 'Add Session {num} to your calendar:',
        addGoogle: 'Add to Google Calendar',
        addAppleOutlook: 'Download for Apple / Outlook Calendar',
        reminderInfo: 'Reminders are set for 24 hours and 1 hour before your session.',
        reminderEmbedded: 'Your direct session link is embedded in the calendar event.',
        alarmTomorrow: 'Physical Performance Study session reminder - tomorrow',
        alarmHour: 'Physical Performance Study session in 1 hour',
      },
      session: {
        errors: {
          missingParams: 'Missing session parameters. Please use the link from your calendar event.',
          emailNotFound: 'Email not found. Please register first.',
          loadFailed: 'Could not load your participant data. Check your connection and reload.',
          alreadySubmitted: 'You have already submitted Session {num}.',
          useNextSession: 'Please use your Session {num} link.',
          allComplete: 'You have completed all sessions - thank you!',
          completeFirst: 'Please complete Session {num} first.',
          submissionFailed: 'Submission failed: {message}. Please try again.',
          saveScheduleFailed: 'Could not save Session {num}: {message}',
          chooseValidSchedule: 'Please choose a valid date and time for Session {num}.',
        },
        instructionsHintSession1: 'Audio will start after a short "About your activity" step (Session 1 only). After audio begins, you will answer a few quick questions - then you will start the plank.',
        instructionsHintLater: 'Audio will begin on the next screen. There will be a short lead-in during which you will answer a few quick questions - then you will start the plank.',
        safetySessionLabel: 'Session {num} of {total}',
        safetyReminder1: 'Important: Use the same email address you used when you registered (your session link should already match your account).',
        safetyReminder2: 'Important: Use the same email address you used when you registered and completed Session 1 (your session link should already match your account).',
        safetyReminderLater: 'Important: Use the same email address you used when you registered and for each previous session (your session link should already match your account).',
        audioAssignedLabel: 'Assigned audio for this session: {label}',
        audioFallbackOpen: 'Open: {url}',
        cameraRequesting: 'Requesting camera permission...',
        cameraReady: 'Camera ready. A thumbnail will be captured each second.',
        cameraDenied: 'Camera permission denied - continuing without it.',
        scheduleSaved: 'Session {num} is scheduled. Save the link below and use it when it is time.',
        scheduleInitial: 'Now schedule Session {num} (24-72 hours from now).',
        scheduleSaving: 'Saving Session {num}...',
        scheduleConfirm: 'Confirm Session {num} schedule',
        scheduleEmailSent: 'We sent your Session {num} link to {email}.',
        scheduleEmailFailed: 'We could not send the email, but your direct link is shown below.',
        scheduleDirectLinkNote: 'You can use this link directly if your calendar reminder fails.',
        submittingData: 'Submitting session data...',
        buildingSheet: 'Building photo contact sheet...',
        uploadingSheet: 'Uploading contact sheet...',
      },
    },
    es: {
      study: {
        title: 'Estudio de Rendimiento Físico',
      },
      common: {
        sessionLabel: 'Sesión {num}',
        openSession: 'Abrir Sesión {num}',
        notYetScheduled: 'Aún no programada',
        stopAudio: 'Detener audio',
        audioStopped: 'Audio detenido',
      },
      registration: {
        contactLine: '¿Preguntas? Contacta al investigador en {email}.',
        unexpectedResponse: 'Respuesta inesperada del servidor.',
        failure: 'El registro falló: {message}. Revisa tu conexión e inténtalo de nuevo.',
        screenoutInjuryTitle: 'No elegible en este momento',
        screenoutInjuryBody: 'Por tu seguridad, no debes inscribirte en este estudio en línea según tus respuestas. Si tienes preguntas, contacta a {email}.',
        screenoutAvailabilityTitle: 'El horario no coincide con este estudio',
        screenoutAvailabilityBody: 'Este estudio requiere dos sesiones cortas dentro de una ventana de tiempo específica. Gracias por tu interés. Si tienes preguntas, contacta a {email}.',
        success: {
          alreadyComplete: 'Estudio ya completado',
          alreadyRegistered: 'Ya registrado',
          enrolled: 'Ya quedaste inscrito',
          registeredAs: 'Registrado como: {email}',
          groupPrefix: 'Orden de sesiones (audio asignado): ',
          scheduledFor: 'Sesión {num} programada para:',
          beforeSession: 'Antes de la Sesión {num}',
          directLinkNote: 'Puedes usar este enlace directamente si falla el recordatorio del calendario.',
          emailSent: 'Enviamos el enlace de tu Sesión {num} a {email}.',
          emailFailed: 'No pudimos enviar el correo, pero tu enlace directo aparece abajo.',
        },
      },
      calendar: {
        directLinkTitle: 'Enlace directo de la sesión',
        openSession: 'Abrir Sesión {num}',
        eventTitle: '{studyTitle} - Sesión {num}',
        descriptionOpenLink: 'Cuando llegue la hora, abre este enlace:',
        descriptionReminder: 'Recuerda: usa ropa cómoda y ten espacio para una plancha sobre antebrazos.',
        addPrompt: 'Agrega la Sesión {num} a tu calendario:',
        addGoogle: 'Agregar a Google Calendar',
        addAppleOutlook: 'Descargar para Apple / Outlook Calendar',
        reminderInfo: 'Los recordatorios se configuran para 24 horas y 1 hora antes de tu sesión.',
        reminderEmbedded: 'Tu enlace directo de la sesión está incluido en el evento del calendario.',
        alarmTomorrow: 'Recordatorio del Estudio de Rendimiento Físico - mañana',
        alarmHour: 'Sesión del Estudio de Rendimiento Físico en 1 hora',
      },
      session: {
        errors: {
          missingParams: 'Faltan parámetros de la sesión. Usa el enlace de tu evento de calendario.',
          emailNotFound: 'No se encontró el correo. Primero debes registrarte.',
          loadFailed: 'No se pudieron cargar tus datos de participante. Revisa tu conexión y recarga.',
          alreadySubmitted: 'Ya enviaste la Sesión {num}.',
          useNextSession: 'Usa el enlace de tu Sesión {num}.',
          allComplete: 'Ya completaste todas las sesiones. Gracias.',
          completeFirst: 'Primero debes completar la Sesión {num}.',
          submissionFailed: 'El envío falló: {message}. Inténtalo de nuevo.',
          saveScheduleFailed: 'No se pudo guardar la Sesión {num}: {message}',
          chooseValidSchedule: 'Elige una fecha y hora válidas para la Sesión {num}.',
        },
        instructionsHintSession1: 'El audio comenzará después de un paso corto sobre tu actividad (solo Sesión 1). Cuando el audio empiece, responderás unas preguntas rápidas y luego comenzarás la plancha.',
        instructionsHintLater: 'El audio comenzará en la siguiente pantalla. Habrá un breve periodo previo durante el cual responderás unas preguntas rápidas y luego comenzarás la plancha.',
        safetySessionLabel: 'Sesión {num} de {total}',
        safetyReminder1: 'Importante: usa el mismo correo electrónico que usaste al registrarte (tu enlace de sesión ya debería coincidir con tu cuenta).',
        safetyReminder2: 'Importante: usa el mismo correo electrónico que usaste al registrarte y completar la Sesión 1 (tu enlace de sesión ya debería coincidir con tu cuenta).',
        safetyReminderLater: 'Importante: usa el mismo correo electrónico que usaste al registrarte y en cada sesión previa (tu enlace de sesión ya debería coincidir con tu cuenta).',
        audioAssignedLabel: 'Audio asignado para esta sesión: {label}',
        audioFallbackOpen: 'Abrir: {url}',
        cameraRequesting: 'Solicitando permiso para la cámara...',
        cameraReady: 'Cámara lista. Se capturará una miniatura cada segundo.',
        cameraDenied: 'Permiso de cámara denegado; continuaremos sin ella.',
        scheduleSaved: 'La Sesión {num} ya está programada. Guarda el enlace de abajo y úsalo cuando llegue la hora.',
        scheduleInitial: 'Ahora programa la Sesión {num} (entre 24 y 72 horas desde ahora).',
        scheduleSaving: 'Guardando la Sesión {num}...',
        scheduleConfirm: 'Confirmar horario de la Sesión {num}',
        scheduleEmailSent: 'Enviamos el enlace de tu Sesión {num} a {email}.',
        scheduleEmailFailed: 'No pudimos enviar el correo, pero tu enlace directo aparece abajo.',
        scheduleDirectLinkNote: 'Puedes usar este enlace directamente si falla el recordatorio del calendario.',
        submittingData: 'Enviando los datos de la sesión...',
        buildingSheet: 'Creando la hoja de fotos...',
        uploadingSheet: 'Subiendo la hoja de fotos...',
      },
    },
  };

  function normalizeLocale(locale) {
    var raw = String(locale || '').toLowerCase();
    return raw.indexOf('es') === 0 ? 'es' : 'en';
  }

  function currentLocale() {
    return normalizeLocale(global.APP_LOCALE || (global.document && global.document.documentElement.lang) || 'en');
  }

  function localeTag(locale) {
    return normalizeLocale(locale) === 'es' ? 'es-419' : 'en-US';
  }

  function getValue(obj, path) {
    return String(path || '').split('.').reduce(function (acc, part) {
      return acc && Object.prototype.hasOwnProperty.call(acc, part) ? acc[part] : undefined;
    }, obj);
  }

  function interpolate(str, vars) {
    return String(str).replace(/\{(\w+)\}/g, function (_, key) {
      return vars && Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : '';
    });
  }

  function text(value, locale) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (typeof value === 'object') {
      var loc = normalizeLocale(locale || currentLocale());
      if (Object.prototype.hasOwnProperty.call(value, loc)) return String(value[loc]);
      if (Object.prototype.hasOwnProperty.call(value, 'en')) return String(value.en);
    }
    return String(value);
  }

  function t(path, vars, locale) {
    var loc = normalizeLocale(locale || currentLocale());
    var template = getValue(STRINGS[loc], path);
    if (template === undefined) template = getValue(STRINGS.en, path);
    return interpolate(text(template, loc), vars);
  }

  function pagePath(pageType, locale) {
    var loc = normalizeLocale(locale || currentLocale());
    if (pageType === 'session') return loc === 'es' ? 'session_es.html' : 'session.html';
    if (pageType === 'registration') return loc === 'es' ? 'index_es.html' : 'index.html';
    return pageType;
  }

  global.APP_I18N = {
    strings: STRINGS,
    normalizeLocale: normalizeLocale,
    locale: currentLocale,
    localeTag: localeTag,
    text: text,
    t: t,
    pagePath: pagePath,
  };
})(window);
