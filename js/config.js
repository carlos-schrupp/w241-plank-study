// =============================================================
// EXPERIMENT CONFIGURATION
// Edit this file to change study parameters, tracks, or questions.
// Keep TRACKS and NUM_SESSIONS in sync with apps-script/Code.gs
// =============================================================

const EXPERIMENT_CONFIG = {

  // Replace with your deployed Apps Script Web App URL after setup
  apiUrl: 'https://script.google.com/macros/s/AKfycbznhmaE9G0mqA-vxBLVFTKD1GPxjt4BM4sVBMTX5MkBEudqN3QtxGPuZaQmY5GeJO6P/exec',

  studyTitle: 'Physical Performance Study',
  experimentId: '0001',
  researcherEmail: 'carlos.schrupp@berkeley.edu',

  // ---- Session design ----
  numSessions: 2, // change to 3 when/if needed

  // Audio tracks — order determines Latin-square columns.
  // Add a third track object here if numSessions = 3.
  // Labels are shown to participants (neutral — avoid genre/tempo/mood cues).
  tracks: [
    {
      id: 'pop',
      label: 'Audio A',
      youtubeId: 'x8WbHWwZixk',
    },
    {
      id: 'trance',
      label: 'Audio B',
      youtubeId: 'iXAbte4QXKs',
    },
  ],

  // ---- Session 1 only: after instructions, before audio (legacy activity block) ----
  session1Activity: [
    {
      id: 'activity_level',
      text: {
        en: 'Are you a regular gym-goer or physically active?',
        es: '¿Sueles ir al gimnasio o mantenerte físicamente activo?'
      },
      type: 'radio',
      options: [
        {
          value: 'yes_regular',
          label: {
            en: 'Yes, regularly (>= 3 times per week)',
            es: 'Sí, regularmente (>= 3 veces por semana)'
          },
        },
        {
          value: 'occasionally',
          label: {
            en: 'Occasionally (1-2 times per week)',
            es: 'Ocasionalmente (1-2 veces por semana)'
          },
        },
        {
          value: 'no_rarely',
          label: {
            en: 'No, rarely or never',
            es: 'No, rara vez o nunca'
          },
        },
      ],
    },
    {
      id: 'activity_type',
      text: {
        en: 'What type of physical activity do you usually do?',
        es: '¿Qué tipo de actividad física sueles hacer?'
      },
      type: 'textarea',
      required: false,
      placeholder: {
        en: 'Optional',
        es: 'Opcional'
      },
    },
    {
      id: 'plank_frequency',
      text: {
        en: 'Do you regularly perform planks?',
        es: '¿Realizas planchas con regularidad?'
      },
      type: 'radio',
      options: [
        {
          value: 'yes_regular',
          label: {
            en: 'Yes, regularly (>= 3 times per week)',
            es: 'Sí, regularmente (>= 3 veces por semana)'
          },
        },
        {
          value: 'occasionally',
          label: {
            en: 'Occasionally (1-2 times per week)',
            es: 'Ocasionalmente (1-2 veces por semana)'
          },
        },
        {
          value: 'no_rarely',
          label: {
            en: 'No, rarely or never',
            es: 'No, rara vez o nunca'
          },
        },
      ],
    },
  ],

  // ---- Pre-task questions (shown while audio plays, before plank) — legacy 1–7 + liking ----
  preTasks: [
    {
      id: 'energy_pre_plank',
      text: {
        en: 'After the assigned audio began, but before you started the plank, how physically energized did you feel?',
        es: 'Después de que comenzó el audio asignado, pero antes de iniciar la plancha, ¿qué tan energizado físicamente te sentiste?'
      },
      type: 'scale',
      min: 1,
      max: 7,
      minLabel: {
        en: 'Extremely low energy',
        es: 'Energía extremadamente baja'
      },
      maxLabel: {
        en: 'Extremely high energy',
        es: 'Energía extremadamente alta'
      },
    },
    {
      id: 'motivation_pre_plank',
      text: {
        en: 'After the assigned audio began, but before you started the plank, how motivated were you to perform well on the task?',
        es: 'Después de que comenzó el audio asignado, pero antes de iniciar la plancha, ¿qué tan motivado estabas para rendir bien en la tarea?'
      },
      type: 'scale',
      min: 1,
      max: 7,
      minLabel: {
        en: 'Not at all motivated',
        es: 'Nada motivado'
      },
      maxLabel: {
        en: 'Extremely motivated',
        es: 'Extremadamente motivado'
      },
    },
    {
      id: 'music_liking',
      text: {
        en: 'How much do you like this session\'s audio so far?',
        es: 'Hasta ahora, ¿qué tanto te está gustando el audio de esta sesión?'
      },
      type: 'scale',
      min: 1,
      max: 7,
      minLabel: {
        en: 'Strongly dislike',
        es: 'Me desagrada mucho'
      },
      maxLabel: {
        en: 'Love it',
        es: 'Me encanta'
      },
    },
  ],

  // ---- Post-task: part 1 (all sessions) ----
  postTasksPart1: [
    {
      id: 'rpe',
      text: {
        en: 'Immediately after completing the plank, how hard did the exercise feel overall? (0 = no exertion at all; 5 = somewhat hard; 10 = maximal exertion - the hardest effort you could sustain.)',
        es: 'Inmediatamente después de completar la plancha, ¿qué tan exigente se sintió el ejercicio en general? (0 = ningún esfuerzo; 5 = algo difícil; 10 = esfuerzo máximo, el más intenso que podrías sostener.)'
      },
      type: 'scale',
      min: 0,
      max: 10,
      minLabel: {
        en: 'No exertion at all',
        es: 'Ningún esfuerzo'
      },
      maxLabel: {
        en: 'Maximal exertion',
        es: 'Esfuerzo máximo'
      },
    },
    {
      id: 'headphones',
      text: {
        en: 'Did you use headphones during the plank exercise?',
        es: '¿Usaste audífonos durante el ejercicio de plancha?'
      },
      type: 'radio',
      options: [
        { value: 'yes', label: { en: 'Yes', es: 'Sí' } },
        { value: 'no', label: { en: 'No', es: 'No' } },
      ],
    },
    {
      id: 'plank_pause',
      text: {
        en: 'Did you pause or restart the plank at any point?',
        es: '¿Pausaste o reiniciaste la plancha en algún momento?'
      },
      type: 'radio',
      options: [
        { value: 'yes', label: { en: 'Yes', es: 'Sí' } },
        { value: 'no', label: { en: 'No', es: 'No' } },
      ],
    },
    {
      id: 'plank_pause_detail',
      text: {
        en: 'If yes, please briefly describe what happened',
        es: 'Si la respuesta es sí, describe brevemente qué ocurrió'
      },
      type: 'textarea',
      required: true,
      showIf: { questionId: 'plank_pause', equals: 'yes' },
      placeholder: {
        en: 'Describe briefly...',
        es: 'Descríbelo brevemente...'
      },
    },
  ],

  // ---- Post-task: Session 2 only (after pause items, per session2_survey_final_draft) ----
  postTasksSession2Extra: [
    {
      id: 'instructions_ease',
      text: {
        en: 'How easy was it for you to follow the instructions provided in the study website (including the plank and audio steps)?',
        es: '¿Qué tan fácil te resultó seguir las instrucciones del sitio del estudio (incluyendo los pasos de audio y plancha)?'
      },
      type: 'scale',
      min: 1,
      max: 5,
      minLabel: {
        en: 'Very difficult',
        es: 'Muy difícil'
      },
      maxLabel: {
        en: 'Very easy',
        es: 'Muy fácil'
      },
    },
    {
      id: 'overall_experience',
      text: {
        en: 'How would you rate your overall experience participating in this study?',
        es: '¿Cómo calificarías tu experiencia general al participar en este estudio?'
      },
      type: 'scale',
      min: 1,
      max: 5,
      minLabel: {
        en: 'Very negative',
        es: 'Muy negativa'
      },
      maxLabel: {
        en: 'Very positive',
        es: 'Muy positiva'
      },
    },
    {
      id: 'music_effect_overall',
      text: {
        en: 'Across the two sessions, how much do you think the assigned audio influenced your plank performance?',
        es: 'Considerando las dos sesiones, ¿cuánto crees que el audio asignado influyó en tu rendimiento en la plancha?'
      },
      type: 'scale',
      min: 1,
      max: 5,
      minLabel: {
        en: 'Not at all',
        es: 'Nada'
      },
      maxLabel: {
        en: 'A great deal',
        es: 'Muchísimo'
      },
    },
  ],

  // ---- Post-task: remainder (all sessions), comments added in JS (wording differs S1 vs S2) ----
  postTasksPart2: [
    {
      id: 'volume_clear',
      text: {
        en: 'Were the audio volume instructions clear?',
        es: '¿Fueron claras las instrucciones sobre el volumen del audio?'
      },
      type: 'radio',
      options: [
        { value: 'yes', label: { en: 'Yes', es: 'Sí' } },
        { value: 'somewhat', label: { en: 'Somewhat', es: 'Más o menos' } },
        { value: 'no', label: { en: 'No', es: 'No' } },
      ],
    },
    {
      id: 'form_quality',
      text: {
        en: 'How would you describe your form during the plank?',
        es: '¿Cómo describirías tu forma durante la plancha?'
      },
      type: 'radio',
      options: [
        {
          value: 'maintained_proper_form',
          label: {
            en: 'Maintained proper form throughout',
            es: 'Mantuve la forma correcta durante toda la plancha'
          },
        },
        {
          value: 'mostly_good_minor_breaks',
          label: {
            en: 'Mostly good - minor breaks corrected',
            es: 'Mayormente buena; corregí pequeñas interrupciones'
          },
        },
        {
          value: 'form_failed_stopped',
          label: {
            en: 'Form failed - I stopped due to form breakdown',
            es: 'La forma se perdió; me detuve por la mala ejecución'
          },
        },
      ],
    },
  ],
};

// Auto-generate all Latin-square permutations from the track list
(function buildPermutations() {
  function permute(arr) {
    if (arr.length <= 1) return [arr.slice()];
    const out = [];
    for (let i = 0; i < arr.length; i++) {
      const rest = arr.filter((_, j) => j !== i);
      for (const p of permute(rest)) out.push([arr[i], ...p]);
    }
    return out;
  }
  EXPERIMENT_CONFIG.permutations = permute(
    EXPERIMENT_CONFIG.tracks.map(t => t.id)
  );
})();
