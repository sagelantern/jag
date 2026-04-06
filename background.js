// Jag - Background Service Worker
// Manages state, timers, streaks, and OpenClaw API integration

const DEFAULT_SITES = [
  // Social Media
  { pattern: 'reddit.com', category: 'never_work', enabled: true, group: 'Social Media' },
  { pattern: 'twitter.com', category: 'never_work', enabled: true, group: 'Social Media' },
  { pattern: 'x.com', category: 'never_work', enabled: true, group: 'Social Media' },
  { pattern: 'instagram.com', category: 'never_work', enabled: true, group: 'Social Media' },
  { pattern: 'facebook.com', category: 'never_work', enabled: true, group: 'Social Media' },
  { pattern: 'tiktok.com', category: 'never_work', enabled: true, group: 'Social Media' },
  { pattern: 'snapchat.com', category: 'never_work', enabled: true, group: 'Social Media' },
  { pattern: 'threads.net', category: 'never_work', enabled: true, group: 'Social Media' },
  { pattern: 'bsky.app', category: 'never_work', enabled: true, group: 'Social Media' },
  { pattern: 'mastodon.social', category: 'never_work', enabled: true, group: 'Social Media' },
  { pattern: 'linkedin.com', category: 'sometimes_work', enabled: false, group: 'Social Media' },
  { pattern: 'pinterest.com', category: 'never_work', enabled: true, group: 'Social Media' },
  { pattern: 'tumblr.com', category: 'never_work', enabled: true, group: 'Social Media' },

  // Video & Streaming
  { pattern: 'youtube.com', category: 'sometimes_work', enabled: true, group: 'Video & Streaming' },
  { pattern: 'netflix.com', category: 'never_work', enabled: true, group: 'Video & Streaming' },
  { pattern: 'twitch.tv', category: 'never_work', enabled: true, group: 'Video & Streaming' },
  { pattern: 'disneyplus.com', category: 'never_work', enabled: true, group: 'Video & Streaming' },
  { pattern: 'hulu.com', category: 'never_work', enabled: true, group: 'Video & Streaming' },
  { pattern: 'max.com', category: 'never_work', enabled: true, group: 'Video & Streaming' },
  { pattern: 'primevideo.com', category: 'never_work', enabled: true, group: 'Video & Streaming' },
  { pattern: 'peacocktv.com', category: 'never_work', enabled: true, group: 'Video & Streaming' },
  { pattern: 'vimeo.com', category: 'sometimes_work', enabled: false, group: 'Video & Streaming' },
  { pattern: 'dailymotion.com', category: 'never_work', enabled: true, group: 'Video & Streaming' },
  { pattern: 'rumble.com', category: 'never_work', enabled: true, group: 'Video & Streaming' },

  // News & Media
  { pattern: 'cnn.com', category: 'never_work', enabled: true, group: 'News & Media' },
  { pattern: 'bbc.com', category: 'never_work', enabled: true, group: 'News & Media' },
  { pattern: 'nytimes.com', category: 'never_work', enabled: true, group: 'News & Media' },
  { pattern: 'theguardian.com', category: 'never_work', enabled: true, group: 'News & Media' },
  { pattern: 'washingtonpost.com', category: 'never_work', enabled: true, group: 'News & Media' },
  { pattern: 'foxnews.com', category: 'never_work', enabled: true, group: 'News & Media' },
  { pattern: 'msnbc.com', category: 'never_work', enabled: true, group: 'News & Media' },
  { pattern: 'apnews.com', category: 'never_work', enabled: true, group: 'News & Media' },
  { pattern: 'reuters.com', category: 'never_work', enabled: true, group: 'News & Media' },
  { pattern: 'buzzfeed.com', category: 'never_work', enabled: true, group: 'News & Media' },
  { pattern: 'huffpost.com', category: 'never_work', enabled: true, group: 'News & Media' },
  { pattern: 'vice.com', category: 'never_work', enabled: true, group: 'News & Media' },
  { pattern: 'dailymail.co.uk', category: 'never_work', enabled: true, group: 'News & Media' },
  { pattern: 'news.google.com', category: 'never_work', enabled: true, group: 'News & Media' },

  // Forums & Communities
  { pattern: 'news.ycombinator.com', category: 'sometimes_work', enabled: true, group: 'Forums & Communities' },
  { pattern: 'quora.com', category: 'never_work', enabled: true, group: 'Forums & Communities' },
  { pattern: 'discord.com', category: 'sometimes_work', enabled: false, group: 'Forums & Communities' },
  { pattern: '4chan.org', category: 'never_work', enabled: true, group: 'Forums & Communities' },
  { pattern: 'lemmy.world', category: 'never_work', enabled: true, group: 'Forums & Communities' },
  { pattern: 'slashdot.org', category: 'never_work', enabled: true, group: 'Forums & Communities' },

  // Shopping
  { pattern: 'amazon.com', category: 'never_work', enabled: true, group: 'Shopping' },
  { pattern: 'ebay.com', category: 'never_work', enabled: true, group: 'Shopping' },
  { pattern: 'walmart.com', category: 'never_work', enabled: true, group: 'Shopping' },
  { pattern: 'target.com', category: 'never_work', enabled: true, group: 'Shopping' },
  { pattern: 'etsy.com', category: 'never_work', enabled: true, group: 'Shopping' },
  { pattern: 'bestbuy.com', category: 'never_work', enabled: true, group: 'Shopping' },
  { pattern: 'aliexpress.com', category: 'never_work', enabled: true, group: 'Shopping' },
  { pattern: 'lululemon.com', category: 'never_work', enabled: true, group: 'Shopping' },
  { pattern: 'nike.com', category: 'never_work', enabled: true, group: 'Shopping' },
  { pattern: 'zara.com', category: 'never_work', enabled: true, group: 'Shopping' },
  { pattern: 'airbnb.com', category: 'never_work', enabled: true, group: 'Shopping' },
  { pattern: 'zillow.com', category: 'never_work', enabled: true, group: 'Shopping' },
  { pattern: 'realtor.com', category: 'never_work', enabled: true, group: 'Shopping' },

  // Email (sometimes work)
  { pattern: 'mail.google.com', category: 'sometimes_work', enabled: true, group: 'Email' },
  { pattern: 'superhuman.com', category: 'sometimes_work', enabled: true, group: 'Email' },
  { pattern: 'outlook.live.com', category: 'sometimes_work', enabled: false, group: 'Email' },
  { pattern: 'mail.yahoo.com', category: 'sometimes_work', enabled: false, group: 'Email' },

  // Entertainment & Sports
  { pattern: 'espn.com', category: 'never_work', enabled: true, group: 'Entertainment & Sports' },
  { pattern: 'bleacherreport.com', category: 'never_work', enabled: true, group: 'Entertainment & Sports' },
  { pattern: 'thescore.com', category: 'never_work', enabled: true, group: 'Entertainment & Sports' },
  { pattern: 'spotify.com', category: 'never_work', enabled: false, group: 'Entertainment & Sports' },
  { pattern: 'imdb.com', category: 'never_work', enabled: true, group: 'Entertainment & Sports' },
  { pattern: 'rottentomatoes.com', category: 'never_work', enabled: true, group: 'Entertainment & Sports' },
  { pattern: 'twitch.tv', category: 'never_work', enabled: true, group: 'Entertainment & Sports' },

  // Travel & Lifestyle
  { pattern: 'tripadvisor.com', category: 'never_work', enabled: true, group: 'Travel & Lifestyle' },
  { pattern: 'booking.com', category: 'never_work', enabled: true, group: 'Travel & Lifestyle' },
  { pattern: 'hotels.com', category: 'never_work', enabled: true, group: 'Travel & Lifestyle' },
  { pattern: 'expedia.com', category: 'never_work', enabled: true, group: 'Travel & Lifestyle' },
  { pattern: 'yelp.com', category: 'never_work', enabled: true, group: 'Travel & Lifestyle' },
];

const DEFAULT_CONFIG = {
  workHours: { start: '09:00', end: '17:00', days: [1, 2, 3, 4, 5] },
  presenceTimes: [
    { name: 'Family Dinner', start: '19:00', end: '20:00', days: [0, 1, 2, 3, 4, 5, 6] }
  ],
  rollingWindowMinutes: 120,
  dailyTargetMinutes: 30,
  apiEndpoint: 'http://100.78.25.83:18789/v1/responses',
  apiBearerToken: '0649cd7eea0f60e90ea7d20588659f299e8b291904b5cc59',
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

// Initialize storage with defaults on install/update
chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get(['sites', 'config', 'streaks']);
  if (!data.sites) {
    await chrome.storage.local.set({ sites: DEFAULT_SITES });
  }
  // Always update config to pick up new defaults (like API token), but preserve user edits
  const existingConfig = data.config || {};
  const mergedConfig = { ...DEFAULT_CONFIG, ...existingConfig };
  // Force update token if it was empty (user never set it)
  if (!existingConfig.apiBearerToken) {
    mergedConfig.apiBearerToken = DEFAULT_CONFIG.apiBearerToken;
  }
  await chrome.storage.local.set({ config: mergedConfig });

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

// Get open count within rolling window (only counts sessions where user actually opened the site)
function getOpenCount(sessions, sitePattern, windowMinutes) {
  const cutoff = Date.now() - windowMinutes * 60 * 1000;
  return sessions.filter(s =>
    s.site === sitePattern &&
    s.timestamp > cutoff &&
    s.buttonChoice !== null &&
    s.buttonChoice !== 'nevermind'
  ).length;
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

  // Check if this is an email site — add email context
  const emailSites = ['mail.google.com', 'superhuman.com', 'outlook.live.com', 'mail.yahoo.com'];
  const isEmailSite = emailSites.some(e => site.pattern.includes(e));
  let emailContext = '';
  if (isEmailSite) {
    const stored = await chrome.storage.local.get(['lastEmailAccess']);
    const lastAccess = stored.lastEmailAccess;
    if (lastAccess) {
      const minAgo = Math.round((Date.now() - lastAccess) / 60000);
      emailContext = `\n\nEMAIL CONTEXT: Yash last checked email ${minAgo} minutes ago. Before showing the gatekeeper, CHECK his Gmail (ai@yash-kothari.com) for unread emails from real people (not newsletters/automated) received since ${new Date(lastAccess).toISOString()}. If there are important unread emails, mention them and be more lenient. If nothing new, say so and be strict — he's just compulsively refreshing.`;
    } else {
      emailContext = `\n\nEMAIL CONTEXT: No record of when Yash last checked email. CHECK his Gmail (ai@yash-kothari.com) for any important unread emails from real people. If there are some, mention them. If inbox is quiet, say so.`;
    }
  }

  const prompt = `[JAG BROWSER EXTENSION REQUEST - respond with ONLY JSON, no other text]

Yash just opened ${site.pattern} for the ${ordinal(openCount)} time in the last ${windowHours} hours. It is ${time} on ${day}. His Jag streak is ${streaks.current} days. He's spent ${Math.round(streaks.dailyMinutes)} min on distracting sites today (target: under ${config.dailyTargetMinutes} min). ${isWorkHours(config) ? 'It is work hours.' : 'It is outside work hours.'} ${isPresenceTime(config) ? 'It is a designated presence time (family/meditation).' : ''}

Use what you know about Yash: his calendar today, his priorities, his rituals, his patterns, what he should be doing right now. Generate ONE awareness line (max 15 words) that is deeply personal and specific to THIS moment AND this specific site.

The line must reference BOTH (a) something real from his life right now AND (b) what this particular site gives him vs what it costs him. For example:
- Reddit: the dopamine scroll, the r/Gunners rabbit hole, the "just checking" that becomes 30 min
- Email/Superhuman: the compulsive inbox refresh, checking without acting, the false sense of productivity
- YouTube: the algorithm rabbit hole, "one more video," entertainment disguised as learning
- Twitter/X: doomscrolling, hot takes that don't matter tomorrow, outrage dopamine
- Instagram: comparison trap, mindless stories, lives that aren't his
- HackerNews: intellectual procrastination dressed as staying informed

Make it specific enough that it only makes sense for THIS site at THIS time. Vary your approach every time: sometimes name the pattern, sometimes name what he'd lose, sometimes name what's waiting for him instead. Never repeat yourself. Never be generic or preachy.${emailContext}

Also return which buttons to show. Rules:
- "I don't need this" (type: nevermind, timer_seconds: 0) always included
- A browse button (type: browse) always included with timer_seconds based on escalation
- "I need this for work" (type: work) ONLY during work hours for sometimes_work sites

Return ONLY this JSON: {"awareness": "your line here", "buttons": [{"label": "string", "type": "work|browse|nevermind", "timer_seconds": number}]}`;

  const endpoint = config.apiEndpoint || DEFAULT_CONFIG.apiEndpoint;
  const headers = { 'Content-Type': 'application/json' };
  if (config.apiBearerToken) {
    headers['Authorization'] = `Bearer ${config.apiBearerToken}`;
  }
  headers['x-openclaw-model'] = 'anthropic/claude-sonnet-4-20250514';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: 'openclaw',
      input: prompt,
      instructions: 'This is a request from the Jag browser extension. Return ONLY valid JSON, nothing else. No markdown fences, no explanation, no preamble. The awareness line must be under 15 words, deeply personal to Yash using your knowledge of his life, and different every time. Reference specific things: his calendar, rituals he has or hasn\'t done today, his son Sohum, his wife Shivantika, meditation, workouts, Kindred, Pioneer Fund. Never be generic or preachy. State facts about his actual life.',
      stream: false
    }),
    signal: AbortSignal.timeout(20000)
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
// Track which tabs have an active overlay to prevent re-triggering
const overlayActiveTabs = new Map(); // tabId -> { site, timestamp }

chrome.webNavigation.onCommitted.addListener(async (details) => {
  // Only handle main frame navigations
  if (details.frameId !== 0) return;

  const data = await chrome.storage.local.get(['sites', 'config', 'sessions', 'streaks']);
  const sites = data.sites || DEFAULT_SITES;
  const config = data.config || DEFAULT_CONFIG;
  const sessions = data.sessions || [];

  const matchedSite = matchesFlaggedSite(details.url, sites);
  if (!matchedSite) return;

  // Don't re-trigger if this tab already has an active overlay for the same site (within 30s)
  const existing = overlayActiveTabs.get(details.tabId);
  if (existing && existing.site === matchedSite.pattern && (Date.now() - existing.timestamp) < 30000) {
    return;
  }
  overlayActiveTabs.set(details.tabId, { site: matchedSite.pattern, timestamp: Date.now() });

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

  // Show loading screen immediately
  try {
    await chrome.tabs.sendMessage(details.tabId, { type: 'JAG_SHOW_LOADING' });
  } catch (e) {
    console.log('Jag: Could not show loading screen:', e.message);
  }

  // Try API first, fall back to local templates
  let awareness, buttons;
  try {
    console.log('Jag: Calling API at', config.apiEndpoint);
    const apiResult = await getAwarenessFromAPI(matchedSite, openCount, config, streaks);
    console.log('Jag: API success! Awareness:', apiResult.awareness);
    awareness = apiResult.awareness;
    buttons = apiResult.buttons;
  } catch (err) {
    console.error('Jag: API FAILED. Error:', err.message, 'Token set:', !!config.apiBearerToken, 'Endpoint:', config.apiEndpoint);
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
  } else if (message.type === 'JAG_EVALUATE_REASON') {
    evaluateReason(message.data).then(result => {
      sendResponse(result);
    }).catch(err => {
      console.error('Jag: Evaluate error:', err);
      sendResponse({ verdict: 'allow', message: 'Go ahead.' });
    });
    return true; // async response
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

// Evaluate user's reason for opening a flagged site
async function evaluateReason(data) {
  const { site, reason, chatHistory, openCount, streak } = data;
  const storageData = await chrome.storage.local.get(['config', 'excuseHistory']);
  const config = storageData.config || DEFAULT_CONFIG;
  const excuseHistory = storageData.excuseHistory || [];

  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const day = now.toLocaleDateString('en-US', { weekday: 'long' });
  const roundNum = chatHistory.filter(m => m.role === 'user').length;

  // Save this excuse to history
  excuseHistory.push({
    site,
    reason,
    timestamp: Date.now(),
    verdict: null // will be updated after evaluation
  });
  // Keep last 50 excuses
  const trimmed = excuseHistory.slice(-50);
  await chrome.storage.local.set({ excuseHistory: trimmed });

  // Build recent excuse context (last 7 days, same site)
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentExcuses = trimmed
    .filter(e => e.timestamp > weekAgo && e.site === site)
    .slice(-10)
    .map(e => {
      const d = new Date(e.timestamp);
      return `${d.toLocaleDateString('en-US', { weekday: 'short' })} ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}: "${e.reason}" → ${e.verdict || 'pending'}`;
    })
    .join('\n');

  const conversationSoFar = chatHistory.map(m =>
    `${m.role === 'user' ? 'Yash' : 'Jag'}: ${m.text}`
  ).join('\n');

  // Email context for gatekeeper
  const emailSites = ['mail.google.com', 'superhuman.com', 'outlook.live.com', 'mail.yahoo.com'];
  const isEmailSite = emailSites.some(e => site.includes(e));
  let emailGatekeeperContext = '';
  if (isEmailSite) {
    const stored = await chrome.storage.local.get(['lastEmailAccess']);
    const lastAccess = stored.lastEmailAccess;
    if (lastAccess) {
      const minAgo = Math.round((Date.now() - lastAccess) / 60000);
      emailGatekeeperContext = `\nEMAIL INTEL: Yash last checked email ${minAgo} min ago. CHECK his Gmail (ai@yash-kothari.com) for unread emails from real people since ${new Date(lastAccess).toISOString()}. If there ARE important new emails, be more lenient and mention what's waiting. If there's nothing new, be extra strict — he's compulsively refreshing.`;
    } else {
      emailGatekeeperContext = `\nEMAIL INTEL: First email check. CHECK Gmail (ai@yash-kothari.com) for important unread emails. Mention findings.`;
    }
  }

  const prompt = `[JAG GATEKEEPER - respond with ONLY JSON]

Yash wants to open ${site}. It is ${time} on ${day}. Visit #${openCount} today. Streak: ${streak.current} days.
${isPresenceTime(config) ? 'IMPORTANT: It is currently a designated presence time (family/meditation). Be VERY strict. Only genuine emergencies pass.' : ''}
${!isWorkHours(config) ? 'It is outside work hours. Be stricter about "work" excuses.' : 'It is work hours.'}${emailGatekeeperContext}

${recentExcuses ? `RECENT EXCUSES for ${site} (last 7 days):\n${recentExcuses}\n\nIf Yash is using the same or similar excuse repeatedly, call it out. Repeating an excuse doesn't make it more valid.` : ''}

Current conversation:
${conversationSoFar}

Yash's latest reason: "${reason}"

You are a STRICT gatekeeper. Your default is DENY. Strictness level escalates with visit count.

STRICTNESS LEVEL (visit #${openCount} today):
${openCount <= 1 ? '- Standard: Allow specific + actionable reasons. Push back on vague ones.' : ''}${openCount === 2 ? '- Elevated: Reasons must be genuinely time-sensitive. "I want to check" is not enough. Why NOW?' : ''}${openCount === 3 ? '- High: You already let them through twice today. The bar is "this cannot wait until tomorrow." Be skeptical.' : ''}${openCount >= 4 ? '- Maximum: Visit #' + openCount + '. Almost nothing justifies this. Only allow genuine emergencies or truly urgent work with a specific deadline in the next hour. Everything else is denied.' : ''}

ALLOW if: The reason names a specific task that must happen NOW on this site AND meets the strictness level above. At visit #1, "checking the Webflow thread" might pass. At visit #4, only "the deploy is broken and the error is on HackerNews" level urgency passes.

PUSHBACK if: Round ${roundNum} is 1 and the reason doesn't meet the bar. Ask ONE specific question that forces them to be concrete about what exactly they need and why it can't wait.

DENY if: ${roundNum >= 2 ? 'This is round 2+. If still vague after pushback, deny. No third chances.' : 'The reason is transparently just wanting to browse, OR it is presence time with no emergency, OR the excuse is recycled, OR visit count is 4+ and the reason is not a genuine emergency.'}

Return ONLY this JSON:
{"verdict": "allow" | "pushback" | "deny", "message": "your response (1-2 sentences, direct, no lectures)"}`;

  const endpoint = config.apiEndpoint || DEFAULT_CONFIG.apiEndpoint;
  const headers = {
    'Content-Type': 'application/json',
    'x-openclaw-model': 'anthropic/claude-sonnet-4-20250514'
  };
  if (config.apiBearerToken) {
    headers['Authorization'] = `Bearer ${config.apiBearerToken}`;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: 'openclaw',
      input: prompt,
      instructions: 'You are Jag, a strict gatekeeper. Return ONLY valid JSON with verdict and message. Be direct and honest. If the reason is vague, push back hard. If it is specific and real, allow it gracefully. Never be preachy. Keep messages under 2 sentences.',
      stream: false
    }),
    signal: AbortSignal.timeout(20000)
  });

  if (!response.ok) throw new Error(`API returned ${response.status}`);

  const apiData = await response.json();
  let text = '';
  if (apiData.output) {
    for (const item of apiData.output) {
      if (item.type === 'message' && item.content) {
        for (const c of item.content) {
          if (c.type === 'output_text') text = c.text;
        }
      }
    }
  }

  const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parsed = JSON.parse(jsonStr);

  // Validate verdict
  if (!['allow', 'pushback', 'deny'].includes(parsed.verdict)) {
    parsed.verdict = 'pushback';
  }

  // Update the most recent excuse with the verdict
  const updated = await chrome.storage.local.get(['excuseHistory']);
  const history = updated.excuseHistory || [];
  if (history.length > 0) {
    history[history.length - 1].verdict = parsed.verdict;
    await chrome.storage.local.set({ excuseHistory: history });
  }

  return parsed;
}

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

  // Clear overlay tracking for this tab
  if (tabId) overlayActiveTabs.delete(tabId);

  // If nevermind, close the tab
  if (choice.buttonType === 'nevermind' && tabId) {
    try {
      await chrome.tabs.remove(tabId);
    } catch {}
  }

  // Start timing if they chose to proceed
  if (choice.buttonType !== 'nevermind' && tabId) {
    activeTimers.set(tabId, { site: choice.site, startTime: Date.now() });

    // Track last successful access for email sites
    const emailSites = ['mail.google.com', 'superhuman.com', 'outlook.live.com', 'mail.yahoo.com'];
    if (emailSites.some(e => choice.site.includes(e))) {
      await chrome.storage.local.set({ lastEmailAccess: Date.now() });
    }
  }
}
