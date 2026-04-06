const DEFAULT_CONFIG = {
  workHours: { start: '09:00', end: '17:00', days: [1, 2, 3, 4, 5] },
  presenceTimes: [
    { name: 'Family Dinner', start: '19:00', end: '20:00', days: [0, 1, 2, 3, 4, 5, 6] }
  ],
  rollingWindowMinutes: 120,
  dailyTargetMinutes: 30,
  apiEndpoint: 'http://100.78.25.83:18789/v1/responses',
  apiBearerToken: '0649cd7eea0f60e90ea7d20588659f299e8b291904b5cc59',
};

let sites = [];
let config = {};

// Load settings
async function load() {
  const data = await chrome.storage.local.get(['sites', 'config']);
  sites = data.sites || [];
  config = data.config || DEFAULT_CONFIG;

  renderSiteGroups();
  renderConfig();
}

function renderSiteGroups() {
  const container = document.getElementById('site-groups');
  container.innerHTML = '';

  // Group sites
  const groups = {};
  sites.forEach((site, index) => {
    const group = site.group || 'Other';
    if (!groups[group]) groups[group] = [];
    groups[group].push({ ...site, _index: index });
  });

  for (const [groupName, groupSites] of Object.entries(groups)) {
    const enabledCount = groupSites.filter(s => s.enabled).length;

    const div = document.createElement('div');
    div.className = 'site-group';
    div.innerHTML = `
      <div class="group-header">
        <span>
          <span class="group-name">${groupName}</span>
          <span class="group-count">${enabledCount}/${groupSites.length} active</span>
        </span>
        <button class="group-toggle-all" data-group="${groupName}">
          ${enabledCount === groupSites.length ? 'Disable all' : 'Enable all'}
        </button>
      </div>
      <div class="site-list">
        ${groupSites.map(s => `
          <div class="site-chip ${s.enabled ? 'enabled' : 'disabled'}" data-index="${s._index}">
            <span class="dot"></span>
            <span>${s.pattern}</span>
            ${s.category === 'sometimes_work' ? '<span class="category-tag">work ok</span>' : ''}
          </div>
        `).join('')}
      </div>
    `;
    container.appendChild(div);
  }

  // Chip click handlers
  container.querySelectorAll('.site-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const idx = parseInt(chip.dataset.index);
      sites[idx].enabled = !sites[idx].enabled;
      renderSiteGroups();
    });
  });

  // Group toggle handlers
  container.querySelectorAll('.group-toggle-all').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const groupName = btn.dataset.group;
      const groupSites = sites.filter(s => (s.group || 'Other') === groupName);
      const allEnabled = groupSites.every(s => s.enabled);
      sites.forEach(s => {
        if ((s.group || 'Other') === groupName) {
          s.enabled = !allEnabled;
        }
      });
      renderSiteGroups();
    });
  });
}

function renderConfig() {
  document.getElementById('work-start').value = config.workHours?.start || '09:00';
  document.getElementById('work-end').value = config.workHours?.end || '17:00';
  document.getElementById('daily-target').value = config.dailyTargetMinutes || 30;
  document.getElementById('rolling-window').value = config.rollingWindowMinutes || 120;
  document.getElementById('api-endpoint').value = config.apiEndpoint || DEFAULT_CONFIG.apiEndpoint;
  document.getElementById('api-token').value = config.apiBearerToken || '';
}

// Add site
document.getElementById('add-site-btn').addEventListener('click', () => {
  const input = document.getElementById('new-site');
  const category = document.getElementById('new-category').value;
  const pattern = input.value.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');

  if (!pattern) return;
  if (sites.some(s => s.pattern === pattern)) {
    alert('Site already exists');
    return;
  }

  sites.push({
    pattern,
    category,
    enabled: true,
    group: 'Custom'
  });

  input.value = '';
  renderSiteGroups();
});

// Save
document.getElementById('save-btn').addEventListener('click', async () => {
  config.workHours = {
    ...config.workHours,
    start: document.getElementById('work-start').value,
    end: document.getElementById('work-end').value,
  };
  config.dailyTargetMinutes = parseInt(document.getElementById('daily-target').value) || 30;
  config.rollingWindowMinutes = parseInt(document.getElementById('rolling-window').value) || 120;
  config.apiEndpoint = document.getElementById('api-endpoint').value.trim() || DEFAULT_CONFIG.apiEndpoint;
  config.apiBearerToken = document.getElementById('api-token').value.trim();

  await chrome.storage.local.set({ sites, config });

  const status = document.getElementById('save-status');
  status.textContent = 'Saved';
  status.style.color = '#c8b6ff';
  setTimeout(() => { status.textContent = ''; }, 2000);
});

// Enter key on add site input
document.getElementById('new-site').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('add-site-btn').click();
});

load();
