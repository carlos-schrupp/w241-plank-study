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
      text: 'Are you a regular gym-goer or physically active?',
      type: 'radio',
      options: [
        'Yes, regularly (≥ 3 times per week)',
        'Occasionally (1–2 times per week)',
        'No, rarely or never',
      ],
    },
    {
      id: 'activity_type',
      text: 'What type of physical activity do you usually do?',
      type: 'textarea',
      required: false,
      placeholder: 'Optional',
    },
    {
      id: 'plank_frequency',
      text: 'Do you regularly perform planks?',
      type: 'radio',
      options: [
        'Yes, regularly (≥ 3 times per week)',
        'Occasionally (1–2 times per week)',
        'No, rarely or never',
      ],
    },
  ],

  // ---- Pre-task questions (shown while audio plays, before plank) — legacy 1–7 + liking ----
  preTasks: [
    {
      id: 'energy_pre_plank',
      text: 'After the assigned audio began, but before you started the plank, how physically energized did you feel?',
      type: 'scale',
      min: 1,
      max: 7,
      minLabel: 'Extremely low energy',
      maxLabel: 'Extremely high energy',
    },
    {
      id: 'motivation_pre_plank',
      text: 'After the assigned audio began, but before you started the plank, how motivated were you to perform well on the task?',
      type: 'scale',
      min: 1,
      max: 7,
      minLabel: 'Not at all motivated',
      maxLabel: 'Extremely motivated',
    },
    {
      id: 'music_liking',
      text: 'How much do you like this session\'s audio so far?',
      type: 'scale',
      min: 1,
      max: 7,
      minLabel: 'Strongly dislike',
      maxLabel: 'Love it',
    },
  ],

  // ---- Post-task: part 1 (all sessions) ----
  postTasksPart1: [
    {
      id: 'rpe',
      text: 'Immediately after completing the plank, how hard did the exercise feel overall? (0 = no exertion at all; 5 = somewhat hard; 10 = maximal exertion — the hardest effort you could sustain.)',
      type: 'scale',
      min: 0,
      max: 10,
      minLabel: 'No exertion at all',
      maxLabel: 'Maximal exertion',
    },
    {
      id: 'headphones',
      text: 'Did you use headphones during the plank exercise?',
      type: 'radio',
      options: ['Yes', 'No'],
    },
    {
      id: 'plank_pause',
      text: 'Did you pause or restart the plank at any point?',
      type: 'radio',
      options: ['Yes', 'No'],
    },
    {
      id: 'plank_pause_detail',
      text: 'If yes, please briefly describe what happened',
      type: 'textarea',
      required: true,
      showIf: { questionId: 'plank_pause', equals: 'Yes' },
      placeholder: 'Describe briefly…',
    },
  ],

  // ---- Post-task: Session 2 only (after pause items, per session2_survey_final_draft) ----
  postTasksSession2Extra: [
    {
      id: 'instructions_ease',
      text: 'How easy was it for you to follow the instructions provided in the study website (including the plank and audio steps)?',
      type: 'scale',
      min: 1,
      max: 5,
      minLabel: 'Very difficult',
      maxLabel: 'Very easy',
    },
    {
      id: 'overall_experience',
      text: 'How would you rate your overall experience participating in this study?',
      type: 'scale',
      min: 1,
      max: 5,
      minLabel: 'Very negative',
      maxLabel: 'Very positive',
    },
  ],

  // ---- Post-task: remainder (all sessions), comments added in JS (wording differs S1 vs S2) ----
  postTasksPart2: [
    {
      id: 'volume_clear',
      text: 'Were the audio volume instructions clear?',
      type: 'radio',
      options: ['Yes', 'Somewhat', 'No'],
    },
    {
      id: 'music_effect',
      text: 'How did this session\'s audio affect your plank performance?',
      type: 'scale',
      min: 1,
      max: 5,
      minLabel: 'Hurt my performance',
      maxLabel: 'Helped my performance',
    },
    {
      id: 'form_quality',
      text: 'How would you describe your form during the plank?',
      type: 'radio',
      options: [
        'Maintained proper form throughout',
        'Mostly good — minor breaks corrected',
        'Form failed — I stopped due to form breakdown',
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
