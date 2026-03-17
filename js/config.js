// =============================================================
// EXPERIMENT CONFIGURATION
// Edit this file to change study parameters, tracks, or questions.
// Keep TRACKS and NUM_SESSIONS in sync with apps-script/Code.gs
// =============================================================

const EXPERIMENT_CONFIG = {

  // Replace with your deployed Apps Script Web App URL after setup
  apiUrl: 'https://script.google.com/macros/s/AKfycbxgfrOf6b98lyPs1sjtmTeNdeCeBO9beK0O1mv_JICQn2Q_oe5AnI--oam9AnWBEczc/exec',

  studyTitle: 'Plank Exercise & Music Study',
  experimentId: '0001',

  // ---- Session design ----
  numSessions: 2, // change to 3 when/if needed

  // Audio tracks — order determines Latin-square columns.
  // Add a third track object here if numSessions = 3.
  tracks: [
    {
      id: 'pop',
      label: 'Pop 70 BPM',
      youtubeId: 'x8WbHWwZixk',
    },
    {
      id: 'trance',
      label: 'Uplifting Trance',
      youtubeId: 'iXAbte4QXKs',
    },
  ],

  // ---- Pre-task questions (shown while music plays, before plank) ----
  // Target: completable in ~60 seconds
  // Supported types: 'scale' | 'radio' | 'textarea'
  preTasks: [
    {
      id: 'motivation',
      text: 'How motivated are you to exercise right now?',
      type: 'scale',
      min: 1,
      max: 5,
      minLabel: 'Not at all',
      maxLabel: 'Very motivated',
    },
    {
      id: 'physical_feeling',
      text: 'How are you feeling physically right now?',
      type: 'scale',
      min: 1,
      max: 5,
      minLabel: 'Poor',
      maxLabel: 'Great',
    },
    {
      id: 'music_liking',
      text: "How much do you like today's music so far?",
      type: 'scale',
      min: 1,
      max: 5,
      minLabel: 'Strongly dislike',
      maxLabel: 'Love it',
    },
  ],

  // ---- Post-task questions (shown immediately after stopping the timer) ----
  postTasks: [
    {
      id: 'rpe',
      text: 'Rate your perceived exertion (1 = very easy, 10 = maximum effort)',
      type: 'scale',
      min: 1,
      max: 10,
      minLabel: 'Very easy',
      maxLabel: 'Max effort',
    },
    {
      id: 'music_effect',
      text: 'How did the music affect your plank performance?',
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
    {
      id: 'comments',
      text: 'Any comments about this session? (optional)',
      type: 'textarea',
      required: false,
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
