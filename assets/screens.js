/* Screen manifest shared by the gallery (index.html) and the walkthrough (prototype.html). */

const SCREEN_GROUPS = [
  {
    id: 'onboarding',
    title: 'Onboarding',
    screens: [
      { id: 'language', title: 'Language', note: 'First launch — English, Sinhala or Tamil.' },
      { id: 'phone', title: 'Phone number', note: 'WhatsApp verification code is sent to this number.' },
    ],
  },
  {
    id: 'home',
    title: 'Home',
    screens: [
      { id: 'home', title: 'Today', note: 'Quick actions, latest activity and the daily insight.' },
    ],
  },
  {
    id: 'logging',
    title: 'Quick logging',
    screens: [
      { id: 'log-breastfeed', title: 'Breastfeed', note: 'Left / right timers with total duration.' },
      { id: 'log-bottle', title: 'Bottle feed', note: 'Amount in ml plus formula or breast milk.' },
      { id: 'log-diaper', title: 'Diaper change', note: 'Wet, dirty or mixed.' },
      { id: 'log-sleep', title: 'Sleep', note: 'Nap or night, with a start/stop timer.' },
      { id: 'log-solids', title: 'Solids', note: 'Free-text food entry.' },
      { id: 'log-pumping', title: 'Pumping', note: 'Side and amount expressed.' },
      { id: 'log-growth', title: 'Growth entry', note: 'Weight, height and head circumference.' },
      { id: 'log-symptom', title: 'Symptom', note: 'Symptom name with an optional note.' },
      { id: 'log-milestone', title: 'Milestone', note: 'Milestone name with an optional note.' },
      { id: 'log-note', title: 'Note', note: 'Free-text note or photo.' },
    ],
  },
  {
    id: 'development',
    title: 'Development',
    screens: [
      { id: 'development', title: 'Development', note: 'Entry point for growth and immunisation.' },
      { id: 'growth', title: 'Growth chart', note: 'WHO + Sri Lanka standard curve with insights.' },
      { id: 'immunisation', title: 'Immunisation', note: 'Sri Lanka national vaccination schedule.' },
    ],
  },
];

const SCREEN_INDEX = {};
for (const group of SCREEN_GROUPS) {
  for (const screen of group.screens) {
    SCREEN_INDEX[screen.id] = screen;
  }
}
