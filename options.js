// Jag - Options Page

const DEFAULT_CONFIG = {
  workHours: { start: '09:00', end: '17:00', days: [1, 2, 3, 4, 5] },
  presenceTimes: [
    { name: 'Family Dinner', start: '19:00', end: '20:00', days: [0, 1, 2, 3, 4, 5, 6] }
  ],
  rollingWindowMinutes: 120,
  dailyTargetMinutes: 30,
  apiEndpoint: 'http://localhost:18789/v1/responses',
  apiBearerToken: '',
  timerBase: [5, 15, 30, 60, 120]
};

const DEFAULT_SITES = [
  { pattern: 'reddit.com', category: 'never_work', enabled: true },
  { pattern: 'twitter.com', category: 'never_work', enabled: true },
  { pattern: 'x.com', category: 'never_work', enabled: true },
  { pattern: 'instagram.com', category: 'never_work', enabled: true },
  { pattern: 'facebook.com', category: 'never_work', enabled: true },
  { pattern: 'youtube.com', category: 'sometimes_work', enabled: true },
  { pattern: 'news.ycombinator.com', category: 'sometimes_work', enabled: true },
  { pattern: 'tiktok.com', category: 'never_work', enabled: true }
];

let sites = [];
let config = {};

// Load settings
async function loadSettings() {
  const data = await chrome.storage.local.get(['sites', 'config']);
  sites = data.sites || [...DEFAULT_SITES];
  config = data.config || { ...DEFAULT_CONFIG };

  renderSites();
  renderPresenceTimes();

  document.getElementById('work-start').value = config.workHours.start;
  document.getElementById('work-end').value = config.workHours.end;

  // Work days checkboxes
  for (let i = 0; i < 7; i++) {
    document.getElementById(`wd-${i}`).checked = config.workHours.days.includes(i);
  }

  document.getElementById('daily-target').value = config.dailyTargetMinutes;
  document.getElementById('rolling-window').value = config.rollingWindowMinutes;
  document.getElementById('api-endpoint').value = config.apiEndpoint;
  document.getElementById('api-token').value = config.apiBearerToken || '';
}

// Render sites list
function renderSites() {
  const container = document.getElementById('sites-list');
  container.innerHTML = sites.map((site, i) => `
    <div class="site-item">
      <div class="site-info">
        <span class="site-pattern">${escapeHTML(site.pattern)}</span>
        <span class="site-category ${site.category}">${site.category.replace('_', ' ')}</span>
      </div>
      <button class="btn-danger" data-remove-site="${i}">Remove</button>
    </div>
  `).join('');

  // Attach remove handlers
  container.querySelectorAll('[data-remove-site]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.removeSite);
      sites.splice(idx, 1);
      renderSites();
    });
  });
}

// Render presence times
function renderPresenceTimes() {
  const container = document.getElementById('presence-list');
  const times = config.presenceTimes || [];
  container.innerHTML = times.map((pt, i) => `
    <div class="presence-item">
      <span class="presence-name">${escapeHTML(pt.name)}</span>
      <span class="presence-time">${pt.start} – ${pt.end}</span>
      <button class="btn-danger" data-remove-presence="${i}">Remove</button>
    </div>
  `).join('');

  container.querySelectorAll('[data-remove-presence]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.removePresence);
      config.presenceTimes.splice(idx, 1);
      renderPresenceTimes();
    });
  });
}

// Add site
document.getElementById('add-site-btn').addEventListener('click', () => {
  const pattern = document.getElementById('new-site-pattern').value.trim();
  const category = document.getElementById('new-site-category').value;
  if (!pattern) return;

  sites.push({ pattern, category, enabled: true });
  document.getElementById('new-site-pattern').value = '';
  renderSites();
});

// Add presence time
document.getElementById('add-presence-btn').addEventListener('click', () => {
  const name = document.getElementById('new-presence-name').value.trim();
  const start = document.getElementById('new-presence-start').value;
  const end = document.getElementById('new-presence-end').value;
  if (!name || !start || !end) return;

  if (!config.presenceTimes) config.presenceTimes = [];
  config.presenceTimes.push({ name, start, end, days: [0, 1, 2, 3, 4, 5, 6] });

  document.getElementById('new-presence-name').value = '';
  document.getElementById('new-presence-start').value = '';
  document.getElementById('new-presence-end').value = '';
  renderPresenceTimes();
});

// Save
document.getElementById('save-btn').addEventListener('click', async () => {
  // Gather work days
  const workDays = [];
  for (let i = 0; i < 7; i++) {
    if (document.getElementById(`wd-${i}`).checked) workDays.push(i);
  }

  config.workHours = {
    start: document.getElementById('work-start').value,
    end: document.getElementById('work-end').value,
    days: workDays
  };

  config.dailyTargetMinutes = parseInt(document.getElementById('daily-target').value) || 30;
  config.rollingWindowMinutes = parseInt(document.getElementById('rolling-window').value) || 120;
  config.apiEndpoint = document.getElementById('api-endpoint').value.trim() || DEFAULT_CONFIG.apiEndpoint;
  config.apiBearerToken = document.getElementById('api-token').value.trim();

  await chrome.storage.local.set({ sites, config });

  // Show save confirmation
  const status = document.getElementById('save-status');
  status.classList.add('visible');
  setTimeout(() => status.classList.remove('visible'), 2000);
});

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Init
loadSettings();
