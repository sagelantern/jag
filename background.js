// Jag - Background Service Worker
// Manages state, timers, streaks, and OpenClaw API integration

const DEFAULT_SITES = [
  { pattern: 'reddit.com', category: 'never_work', enabled: true },
  { pattern: 'twitter.com', category: 'never_work', enabled: true },
  { pattern: 'x.com', category: 'never_work', enabled: true },
  { pattern: 'instagram.com', category: 'never_work', enabled: true },
  { pattern: 'facebook.com', category: 'never_work', enabled: true },
  { pattern: 'youtube.com', category: 'sometimes_work', enabled: true },
  { pattern: 'news.ycombinator.com', category: 'sometimes_work', enabled: true },
  { pattern: 'tiktok.com', category: 'never_work', enabled: true },
  { pattern: 'superhuman.com', category: 'sometimes_work', enabled: true }
];

const DEFAULT_CONFIG = {
  workHours: { start: '09:00', end: '17:00', days: [1, 2, 3, 4, 5] },
  presenceTimes: [
    { name: 'Family Dinner', start: '19:00', end: '20:00', days: [0, 1, 2, 3, 4, 5, 6] }
  ],
  rollingWindowMinutes: 120,
  dailyTargetMinutes: 30,
  apiEndpoint: 'http://localhost:18789/v1/responses',
  apiBearerToken: '',
  timerBase: [10, 30, 60, 120, 180, 300] // seconds per open count tier (aggressive baseline)
};

const DEFAULT_STREAKS = {
  current: 0,
  longest: 0,
  dailyMinutes: 0,
  lastDate: null
};

// Fallback awareness templates when API is unreachable
const FALLBACK_TEMPLATES = [
  "{day}, {time}. {site} again. What were you just doing?",
  "Visit #{count}. The thing you were avoiding is still there.",
  "{time}. {site} won't give you what you actually need right now.",
  "That's {count} times today. Nothing new is waiting for you there.",
  "{time} on {day}. You opened {site} {count} times already. Walk away.",
  "The last {count} visits averaged 8 minutes each. That's an hour gone.",
  "{site}, visit #{count}. Name one thing you'll get from this.",
  "It's {time}. Close the laptop. Go do the thing."
];

// Initialize storage with defaults on install
chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get(['sites', 'config', 'streaks']);
  if (!data.sites) {
    await chrome.storage.local.set({ sites: DEFAULT_SITES });
  }
  if (!data.config) {
    await chrome.storage.local.set({ config: DEFAULT_CONFIG });
  }
  if (!data.streaks) {
    await chrome.storage.local.set({ streaks: DEFAULT_STREAKS });
  }
  if (!data.sessions) {
    await chrome.storage.local.set({ sessions: [] });
  }
});

// Check if a URL matches any flagged site
function matchesFlaggedSite(url, sites) {
  try {
    const hostname = new URL(url).hostname;
    return sites.find(s => s.enabled && hostname.includes(s.pattern));
  } catch {
    return null;
  }
}

// Get open count within rolling window
function getOpenCount(sessions, sitePattern, windowMinutes) {
  const cutoff = Date.now() - windowMinutes * 60 * 1000;
  return sessions.filter(s => s.site === sitePattern && s.timestamp > cutoff).length;
}

// Check if current time is within work hours
function isWorkHours(config) {
  const now = new Date();
  const day = now.getDay();
  if (!config.workHours.days.includes(day)) return false;

  const timeStr = now.toTimeString().slice(0, 5);
  return timeStr >= config.workHours.start && timeStr <= config.workHours.end;
}

// Check if current time is during a presence time
function isPresenceTime(config) {
  const now = new Date();
  const day = now.getDay();
  const timeStr = now.toTimeString().slice(0, 5);

  return config.presenceTimes.some(pt =>
    pt.days.includes(day) && timeStr >= pt.start && timeStr <= pt.end
  );
}

// Calculate timer seconds based on open count and context
function calculateTimer(openCount, buttonType, config, site) {
  const tiers = config.timerBase || DEFAULT_CONFIG.timerBase;
  const tierIndex = Math.min(openCount - 1, tiers.length - 1);
  let seconds = tiers[Math.max(0, tierIndex)];

  // Time-of-day adaptive multiplier
  const hour = new Date().getHours();
  if (hour >= 21 || hour < 6) {
    // Late night (9pm-6am): most aggressive. You shouldn't be here.
    seconds = Math.round(seconds * 3);
  } else if (hour >= 18) {
    // Evening (6pm-9pm): family time, wind down. Strong friction.
    seconds = Math.round(seconds * 2);
  } else if (hour < 9) {
    // Early morning (6am-9am): protect the morning routine.
    seconds = Math.round(seconds * 1.75);
  }
  // Work hours (9am-6pm): base timers apply

  // Button type modifier
  if (buttonType === 'work') {
    seconds = Math.round(seconds * 0.5);
  }

  // Outside configured work hours: additional bump
  if (!isWorkHours(config)) {
    seconds = Math.round(seconds * 1.5);
  }

  // Presence time (family dinner, meditation): strongest friction
  if (isPresenceTime(config)) {
    seconds = Math.round(seconds * 2.5);
  }

  // Never-work sites get a bump over sometimes-work
  if (site && site.category === 'never_work') {
    seconds = Math.round(seconds * 1.25);
  }

  return Math.max(seconds, 5); // minimum 5 seconds
}

function formatTimerLabel(seconds) {
  if (seconds >= 60) {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return sec > 0 ? `${min}m ${sec}s` : `${min}m`;
  }
  return `${seconds}s`;
}

// Generate fallback awareness line
function generateFallbackAwareness(site, openCount, windowMinutes, streakDays) {
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const day = now.toLocaleDateString('en-US', { weekday: 'long' });
  const window = windowMinutes >= 60
    ? `${Math.round(windowMinutes / 60)} hour(s)`
    : `${windowMinutes} minutes`;

  const template = FALLBACK_TEMPLATES[Math.floor(Math.random() * FALLBACK_TEMPLATES.length)];

  return template
    .replace(/{site}/g, site)
    .replace(/{count}/g, openCount)
    .replace(/{window}/g, window)
    .replace(/{time}/g, time)
    .replace(/{day}/g, day)
    .replace(/{streak}/g, streakDays);
}

// Generate fallback buttons
function generateFallbackButtons(site, openCount, config) {
  const buttons = [];
  const inWorkHours = isWorkHours(config);
  const inPresence = isPresenceTime(config);
  const baseTimer = calculateTimer(openCount, 'browse', config, site);

  // Work button: only during work hours and for sometimes_work sites
  if (inWorkHours && site.category === 'sometimes_work') {
    buttons.push({
      label: 'I need this for work',
      type: 'work',
      timer_seconds: calculateTimer(openCount, 'work', config, site)
    });
  }

  // Browse button - honest, escalating label
  let browseLabel;
  if (openCount >= 5) {
    browseLabel = `Open anyway (${formatTimerLabel(baseTimer)} wait)`;
  } else if (openCount >= 3) {
    browseLabel = `I know, let me through (${formatTimerLabel(baseTimer)} wait)`;
  } else {
    browseLabel = `Let me browse (${formatTimerLabel(baseTimer)} wait)`;
  }
  buttons.push({
    label: browseLabel,
    type: 'browse',
    timer_seconds: baseTimer
  });

  // Nevermind always present
  buttons.push({
    label: "I don't need this",
    type: 'nevermind',
    timer_seconds: 0
  });

  return buttons;
}

// Call OpenClaw API for contextual awareness
async function getAwarenessFromAPI(site, openCount, config, streaks) {
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const day = now.toLocaleDateString('en-US', { weekday: 'long' });
  const windowHours = Math.round(config.rollingWindowMinutes / 60 * 10) / 10;

  const prompt = `Context: The user is opening ${site.pattern} for the ${ordinal(openCount)} time in the last ${windowHours} hours. It is ${time} on ${day}. Their streak is ${streaks.current} days. They've spent ${Math.round(streaks.dailyMinutes)} minutes on distracting sites today (target: under ${config.dailyTargetMinutes} min). ${isWorkHours(config) ? 'It is work hours.' : 'It is outside work hours.'} ${isPresenceTime(config) ? 'It is a designated presence time (family/meditation).' : ''}

Generate ONE short awareness line (1 sentence, max 15 words). Be direct, specific to the moment, and vary your approach. Some options: name what they're avoiding, state the opportunity cost, note the pattern, ask what they actually need. Never use generic phrases like "you set these rules" or "is this intentional." Never lecture.

Also return buttons. "I don't need this" (nevermind, timer 0) is always included. "Let me browse" (browse) is always included with the appropriate timer. Only include "I need this for work" (work) during work hours for sometimes_work sites.

Return as JSON: {"awareness": string, "buttons": [{"label": string, "type": "work"|"browse"|"nevermind", "timer_seconds": number}]}`;

  const endpoint = config.apiEndpoint || DEFAULT_CONFIG.apiEndpoint;
  const headers = { 'Content-Type': 'application/json' };
  if (config.apiBearerToken) {
    headers['Authorization'] = `Bearer ${config.apiBearerToken}`;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4-20250514',
      input: prompt,
      instructions: 'You are Jag. Return ONLY valid JSON. The awareness line must be short (under 15 words), direct, and different every time. Good examples: "Third time in an hour. The run you planned is still waiting." or "4:15 PM. Sohum is awake. Reddit is not going anywhere." Bad examples: "Is this intentional?" or "You set these rules for a reason." Never be generic, preachy, or use questions that can be dismissed with "yes." The nevermind button label should be "I don\'t need this" with timer_seconds 0. The browse button timer_seconds should match the escalating timer for the open count.',
      text: { format: { type: 'text' } }
    }),
    signal: AbortSignal.timeout(5000)
  });

  if (!response.ok) throw new Error(`API returned ${response.status}`);

  const data = await response.json();

  // Extract text from OpenResponses format
  let text = '';
  if (data.output) {
    for (const item of data.output) {
      if (item.type === 'message' && item.content) {
        for (const c of item.content) {
          if (c.type === 'output_text') text = c.text;
        }
      }
    }
  }

  if (!text) throw new Error('No text in API response');

  // Parse JSON from response (handle possible markdown fences)
  const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parsed = JSON.parse(jsonStr);

  // Validate
  if (!parsed.awareness || !Array.isArray(parsed.buttons)) {
    throw new Error('Invalid response structure');
  }

  // Ensure nevermind button exists
  if (!parsed.buttons.find(b => b.type === 'nevermind')) {
    parsed.buttons.push({ label: 'Nevermind', type: 'nevermind', timer_seconds: 0 });
  }

  return parsed;
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// Update streak data for the day
async function updateStreaks() {
  const data = await chrome.storage.local.get(['streaks']);
  const streaks = data.streaks || { ...DEFAULT_STREAKS };
  const today = new Date().toISOString().slice(0, 10);

  if (streaks.lastDate !== today) {
    // New day - check if yesterday met target
    if (streaks.lastDate) {
      // Previous day existed; if dailyMinutes was under target, streak continues
      // If over, streak resets (handled at end of day or on first access)
      const data2 = await chrome.storage.local.get(['config']);
      const config = data2.config || DEFAULT_CONFIG;
      if (streaks.dailyMinutes <= config.dailyTargetMinutes) {
        streaks.current += 1;
        streaks.longest = Math.max(streaks.longest, streaks.current);
      } else {
        streaks.current = 0;
      }
    }
    streaks.dailyMinutes = 0;
    streaks.lastDate = today;
    await chrome.storage.local.set({ streaks });
  }

  return streaks;
}

// Track time spent on flagged sites
const activeTimers = new Map(); // tabId -> { site, startTime }

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  // Stop timing previous tab
  await stopTiming(activeInfo.tabId);

  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url) {
      const data = await chrome.storage.local.get(['sites']);
      const sites = data.sites || DEFAULT_SITES;
      const match = matchesFlaggedSite(tab.url, sites);
      if (match) {
        activeTimers.set(activeInfo.tabId, { site: match.pattern, startTime: Date.now() });
      }
    }
  } catch {}
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  await stopTiming(tabId);
  activeTimers.delete(tabId);
});

async function stopTiming(tabId) {
  const timer = activeTimers.get(tabId);
  if (timer) {
    const elapsed = (Date.now() - timer.startTime) / 1000 / 60; // minutes
    const data = await chrome.storage.local.get(['streaks']);
    const streaks = data.streaks || { ...DEFAULT_STREAKS };
    streaks.dailyMinutes = Math.round((streaks.dailyMinutes + elapsed) * 100) / 100;
    await chrome.storage.local.set({ streaks });
    activeTimers.delete(tabId);
  }
}

// Main navigation handler
chrome.webNavigation.onCommitted.addListener(async (details) => {
  // Only handle main frame navigations
  if (details.frameId !== 0) return;

  const data = await chrome.storage.local.get(['sites', 'config', 'sessions', 'streaks']);
  const sites = data.sites || DEFAULT_SITES;
  const config = data.config || DEFAULT_CONFIG;
  const sessions = data.sessions || [];

  const matchedSite = matchesFlaggedSite(details.url, sites);
  if (!matchedSite) return;

  // Update streaks for today
  const streaks = await updateStreaks();

  // Count opens in rolling window
  const openCount = getOpenCount(sessions, matchedSite.pattern, config.rollingWindowMinutes) + 1;

  // Record this session
  sessions.push({
    site: matchedSite.pattern,
    timestamp: Date.now(),
    buttonChoice: null,
    timerServed: null
  });

  // Prune old sessions (older than 7 days)
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const prunedSessions = sessions.filter(s => s.timestamp > weekAgo);
  await chrome.storage.local.set({ sessions: prunedSessions });

  // Try API first, fall back to local templates
  let awareness, buttons;
  try {
    const apiResult = await getAwarenessFromAPI(matchedSite, openCount, config, streaks);
    awareness = apiResult.awareness;
    buttons = apiResult.buttons;
  } catch (err) {
    console.log('Jag: API unavailable, using fallback:', err.message);
    awareness = generateFallbackAwareness(matchedSite.pattern, openCount, config.rollingWindowMinutes, streaks.current);
    buttons = generateFallbackButtons(matchedSite, openCount, config);
  }

  // Send overlay data to content script
  try {
    await chrome.tabs.sendMessage(details.tabId, {
      type: 'JAG_SHOW_OVERLAY',
      data: {
        awareness,
        buttons,
        streak: {
          current: streaks.current,
          longest: streaks.longest,
          dailyMinutes: streaks.dailyMinutes,
          targetMinutes: config.dailyTargetMinutes
        },
        openCount,
        site: matchedSite.pattern,
        windowMinutes: config.rollingWindowMinutes
      }
    });
  } catch (err) {
    console.log('Jag: Could not send message to tab:', err.message);
  }
});

// Handle button choice from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'JAG_BUTTON_CHOICE') {
    handleButtonChoice(message.data, sender.tab?.id);
    sendResponse({ ok: true });
  } else if (message.type === 'JAG_GET_TIMER') {
    // Content script requests timer calculation
    (async () => {
      const data = await chrome.storage.local.get(['config']);
      const config = data.config || DEFAULT_CONFIG;
      const seconds = calculateTimer(message.data.openCount, message.data.buttonType, config, message.data.site);
      sendResponse({ timer_seconds: seconds });
    })();
    return true; // async response
  }
  return false;
});

async function handleButtonChoice(choice, tabId) {
  const data = await chrome.storage.local.get(['sessions']);
  const sessions = data.sessions || [];

  // Update the most recent session for this site
  for (let i = sessions.length - 1; i >= 0; i--) {
    if (sessions[i].site === choice.site && sessions[i].buttonChoice === null) {
      sessions[i].buttonChoice = choice.buttonType;
      sessions[i].timerServed = choice.timerSeconds;
      break;
    }
  }
  await chrome.storage.local.set({ sessions });

  // If nevermind, close the tab
  if (choice.buttonType === 'nevermind' && tabId) {
    try {
      await chrome.tabs.remove(tabId);
    } catch {}
  }

  // Start timing if they chose to proceed
  if (choice.buttonType !== 'nevermind' && tabId) {
    activeTimers.set(tabId, { site: choice.site, startTime: Date.now() });
  }
}
