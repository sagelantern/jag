// Jag v0.2 - Background Service Worker
// Manages state, timers, streaks, OpenClaw API, RSS feeds, Lichess puzzles, mid-session check-ins

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
  timerBase: [10, 30, 60, 120, 180, 300],
  compassionLevel: 50 // 0 = full compassion, 100 = full strict
};

const DEFAULT_STREAKS = {
  current: 0,
  longest: 0,
  dailyMinutes: 0,
  lastDate: null
};

// RSS feed URLs for One Interesting Thing
const RSS_FEEDS = [
  { name: 'Stratechery', url: 'https://stratechery.com/feed/' },
  { name: "Lenny's Newsletter", url: 'https://www.lennysnewsletter.com/feed' },
  { name: 'First Round Review', url: 'https://review.firstround.com/feed.xml' },
  { name: 'Psyche (Aeon)', url: 'https://psyche.co/feed' },
  { name: "Lion's Roar", url: 'https://www.lionsroar.com/feed/' },
  { name: 'BPS Research Digest', url: 'https://www.bps.org.uk/research-digest/rss' },
];

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

// ─── Initialization ──────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get(['sites', 'config', 'streaks', 'sessions', 'checkins']);
  if (!data.sites) {
    await chrome.storage.local.set({ sites: DEFAULT_SITES });
  }
  const existingConfig = data.config || {};
  const mergedConfig = { ...DEFAULT_CONFIG, ...existingConfig };
  if (!existingConfig.apiBearerToken) {
    mergedConfig.apiBearerToken = DEFAULT_CONFIG.apiBearerToken;
  }
  // Ensure compassionLevel exists
  if (mergedConfig.compassionLevel === undefined) {
    mergedConfig.compassionLevel = DEFAULT_CONFIG.compassionLevel;
  }
  mergedConfig.compassionLevel = clampCompassionLevel(mergedConfig.compassionLevel);
  await chrome.storage.local.set({ config: mergedConfig });

  if (!data.streaks) {
    await chrome.storage.local.set({ streaks: DEFAULT_STREAKS });
  }
  if (!data.sessions) {
    await chrome.storage.local.set({ sessions: [] });
  }
  if (!data.checkins) {
    await chrome.storage.local.set({ checkins: [] });
  }

  // Set up RSS fetch alarm (every 6 hours)
  chrome.alarms.create('jag-rss-fetch', { periodInMinutes: 360 });
  // Fetch immediately on install
  fetchRSSFeeds();
  fetchLichessPuzzle();
});

// ─── Alarm handler ───────────────────────────────────────────────

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'jag-rss-fetch') {
    fetchRSSFeeds();
    fetchLichessPuzzle();
  } else if (alarm.name.startsWith('jag-checkin-')) {
    // Mid-session check-in alarm: jag-checkin-{tabId}-{minuteMark}
    const parts = alarm.name.split('-');
    const tabId = parseInt(parts[2]);
    const minuteMark = parseInt(parts[3]);
    triggerCheckin(tabId, minuteMark);
  }
});

// ─── RSS Feed Fetching ───────────────────────────────────────────

async function fetchRSSFeeds() {
  const articles = [];
  for (const feed of RSS_FEEDS) {
    try {
      const response = await fetch(feed.url, { signal: AbortSignal.timeout(15000) });
      if (!response.ok) continue;
      const text = await response.text();
      const parsed = parseRSSXML(text, feed.name);
      articles.push(...parsed.slice(0, 3)); // top 3 per feed
    } catch (e) {
      console.log('Jag RSS: Failed to fetch', feed.name, e.message);
    }
  }
  if (articles.length > 0) {
    await chrome.storage.local.set({
      rssArticles: articles,
      rssLastFetch: Date.now()
    });
    console.log('Jag RSS: Cached', articles.length, 'articles');
  }
}

function parseRSSXML(xmlText, sourceName) {
  // Simple RSS/Atom XML parser for service worker (no DOMParser)
  const articles = [];
  // Try RSS <item> blocks
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xmlText)) !== null) {
    const block = match[1];
    const title = extractTag(block, 'title');
    const link = extractTag(block, 'link');
    const description = extractTag(block, 'description');
    const content = extractTag(block, 'content:encoded') || extractTag(block, 'content');
    if (title) {
      articles.push({
        title: decodeHTMLEntities(title),
        link,
        preview: stripHTML(decodeHTMLEntities(description || '')).slice(0, 200),
        content: stripHTML(decodeHTMLEntities(content || description || '')).slice(0, 3000),
        source: sourceName,
        fetchedAt: Date.now()
      });
    }
  }
  // Try Atom <entry> blocks if no items found
  if (articles.length === 0) {
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
    while ((match = entryRegex.exec(xmlText)) !== null) {
      const block = match[1];
      const title = extractTag(block, 'title');
      const linkMatch = block.match(/<link[^>]+href="([^"]+)"/);
      const link = linkMatch ? linkMatch[1] : '';
      const summary = extractTag(block, 'summary') || extractTag(block, 'content');
      if (title) {
        articles.push({
          title: decodeHTMLEntities(title),
          link,
          preview: stripHTML(decodeHTMLEntities(summary || '')).slice(0, 200),
          content: stripHTML(decodeHTMLEntities(summary || '')).slice(0, 3000),
          source: sourceName,
          fetchedAt: Date.now()
        });
      }
    }
  }
  return articles;
}

function extractTag(xml, tag) {
  // Handle CDATA sections
  const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i');
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1];
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = xml.match(regex);
  return m ? m[1].trim() : '';
}

function stripHTML(html) {
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function decodeHTMLEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

// ─── Lichess Puzzle ──────────────────────────────────────────────

async function fetchLichessPuzzle() {
  try {
    const response = await fetch('https://lichess.org/api/puzzle/daily', {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) return;
    const puzzle = await response.json();
    await chrome.storage.local.set({
      lichessPuzzle: {
        id: puzzle.puzzle?.id,
        fen: puzzle.game?.fen,
        moves: puzzle.puzzle?.solution,
        rating: puzzle.puzzle?.rating,
        url: `https://lichess.org/training/${puzzle.puzzle?.id}`,
        fetchedAt: Date.now()
      }
    });
    console.log('Jag: Cached Lichess puzzle', puzzle.puzzle?.id);
  } catch (e) {
    console.log('Jag: Failed to fetch Lichess puzzle', e.message);
  }
}

// ─── Mid-Session Check-In ────────────────────────────────────────

function scheduleCheckin(tabId, site, userResponse, sessionId) {
  // Schedule first check-in at 2 minutes
  chrome.alarms.create(`jag-checkin-${tabId}-2`, { delayInMinutes: 2 });
  // Store check-in context
  chrome.storage.local.get(['checkinContext'], (data) => {
    const ctx = data.checkinContext || {};
    ctx[tabId] = { site, userResponse, sessionId, startTime: Date.now() };
    chrome.storage.local.set({ checkinContext: ctx });
  });
}

async function triggerCheckin(tabId, minuteMark) {
  const data = await chrome.storage.local.get(['checkinContext']);
  const ctx = (data.checkinContext || {})[tabId];
  if (!ctx) return;

  try {
    // Check tab still exists and is on the same site
    const tab = await chrome.tabs.get(tabId);
    if (!tab.url || !tab.url.includes(ctx.site)) return;

    await chrome.tabs.sendMessage(tabId, {
      type: 'JAG_CHECKIN',
      data: {
        site: ctx.site,
        userResponse: ctx.userResponse,
        minuteMark,
        sessionId: ctx.sessionId
      }
    });
  } catch (e) {
    // Tab gone or can't message — clean up
    const d = await chrome.storage.local.get(['checkinContext']);
    const c = d.checkinContext || {};
    delete c[tabId];
    await chrome.storage.local.set({ checkinContext: c });
  }
}

// ─── Utility Functions ───────────────────────────────────────────

function matchesFlaggedSite(url, sites) {
  try {
    const hostname = new URL(url).hostname;
    return sites.find(s => s.enabled && hostname.includes(s.pattern));
  } catch {
    return null;
  }
}

function getOpenCount(sessions, sitePattern, windowMinutes) {
  const cutoff = Date.now() - windowMinutes * 60 * 1000;
  return sessions.filter(s =>
    s.site === sitePattern &&
    s.timestamp > cutoff &&
    s.buttonChoice !== null &&
    s.buttonChoice !== 'nevermind'
  ).length;
}

function isWorkHours(config) {
  const now = new Date();
  const day = now.getDay();
  if (!config.workHours.days.includes(day)) return false;
  const timeStr = now.toTimeString().slice(0, 5);
  return timeStr >= config.workHours.start && timeStr <= config.workHours.end;
}

function isPresenceTime(config) {
  const now = new Date();
  const day = now.getDay();
  const timeStr = now.toTimeString().slice(0, 5);
  return config.presenceTimes.some(pt =>
    pt.days.includes(day) && timeStr >= pt.start && timeStr <= pt.end
  );
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function clampCompassionLevel(level) {
  const value = Number(level);
  if (!Number.isFinite(value)) return DEFAULT_CONFIG.compassionLevel;
  return Math.max(0, Math.min(100, Math.round(value)));
}

// ─── Compassion-Level Modulated Behavior ─────────────────────────

// Returns a tone descriptor for AI prompts based on compassionLevel
function getToneDirective(level) {
  if (level <= 15) {
    return 'Warm, gentle, and reflective. Never deny access. Acknowledge the feeling as real and valid. Gently question whether the chosen remedy matches the actual need. Tone: caring friend.';
  } else if (level <= 35) {
    return 'Supportive with a gentle opinion. Rarely push back. Acknowledge the feeling, then offer a soft observation about the pattern. Tone: wise friend who cares.';
  } else if (level <= 65) {
    return 'Honest and direct with a clear point of view. Challenge the remedy, not the person. Use their own pattern data. Not adversarial, but not a pushover. Tone: good friend who won\'t let you bullshit yourself.';
  } else if (level <= 85) {
    return 'Confrontational when warranted. Call out repeated patterns. Default to pushback. Tone: coach who has seen this before and isn\'t buying it.';
  } else {
    return 'Prosecutorial. Blunt. Calls out BS directly. Default is deny. Only genuine emergencies pass. Tone: drill sergeant who knows every excuse.';
  }
}

// Returns gate behavior based on compassionLevel
function getGateBehavior(level, openCount, roundNum) {
  const clamped = clampCompassionLevel(level);
  if (clamped === 0) {
    return { defaultVerdict: 'allow', maxPushbacks: 0, denyAllowed: false };
  }
  if (clamped <= 20) {
    // Full compassion: always allow after one reflection
    return { defaultVerdict: 'allow', maxPushbacks: 0, denyAllowed: false };
  } else if (clamped <= 45) {
    return { defaultVerdict: 'allow', maxPushbacks: 1, denyAllowed: false };
  } else if (clamped <= 70) {
    // Balanced: allow most, pushback on weak, rare deny
    const denyAllowed = clamped >= 55 && (openCount >= 4 || roundNum >= 2);
    return { defaultVerdict: 'allow', maxPushbacks: 1, denyAllowed };
  } else if (clamped < 100) {
    return { defaultVerdict: 'pushback', maxPushbacks: 2, denyAllowed: true };
  } else {
    // Full strict: deny default at 100
    return { defaultVerdict: 'deny', maxPushbacks: 2, denyAllowed: true };
  }
}

// Timer multiplier based on compassionLevel (0 = no timers, 100 = aggressive)
function getTimerMultiplier(level) {
  const clamped = clampCompassionLevel(level);
  if (clamped === 0) return 0; // no timers at full compassion
  return clamped / 50; // 0.2 at 10, 1.0 at 50, 2.0 at 100
}

function calculateTimer(openCount, buttonType, config, site) {
  const tiers = config.timerBase || DEFAULT_CONFIG.timerBase;
  const tierIndex = Math.min(openCount - 1, tiers.length - 1);
  let seconds = tiers[Math.max(0, tierIndex)];

  const hour = new Date().getHours();
  if (hour >= 21 || hour < 6) {
    seconds = Math.round(seconds * 3);
  } else if (hour >= 18) {
    seconds = Math.round(seconds * 2);
  } else if (hour < 9) {
    seconds = Math.round(seconds * 1.75);
  }

  if (buttonType === 'work') {
    seconds = Math.round(seconds * 0.5);
  }
  if (!isWorkHours(config)) {
    seconds = Math.round(seconds * 1.5);
  }
  if (isPresenceTime(config)) {
    seconds = Math.round(seconds * 2.5);
  }
  if (site && site.category === 'never_work') {
    seconds = Math.round(seconds * 1.25);
  }

  // Apply compassion level multiplier
  const compassion = clampCompassionLevel(
    config.compassionLevel !== undefined ? config.compassionLevel : DEFAULT_CONFIG.compassionLevel
  );
  seconds = Math.round(seconds * getTimerMultiplier(compassion));

  if (compassion === 0) return 0; // no timers
  return Math.max(seconds, 5);
}

function formatTimerLabel(seconds) {
  if (seconds >= 60) {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return sec > 0 ? `${min}m ${sec}s` : `${min}m`;
  }
  return `${seconds}s`;
}

// ─── Fallback Templates ──────────────────────────────────────────

function generateFallbackAwareness(site, openCount, windowMinutes, streakDays) {
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const day = now.toLocaleDateString('en-US', { weekday: 'long' });
  const template = FALLBACK_TEMPLATES[Math.floor(Math.random() * FALLBACK_TEMPLATES.length)];
  return template
    .replace(/{site}/g, site)
    .replace(/{count}/g, openCount)
    .replace(/{time}/g, time)
    .replace(/{day}/g, day)
    .replace(/{streak}/g, streakDays);
}

function generateFallbackButtons(site, openCount, config) {
  const buttons = [];
  const inWorkHours = isWorkHours(config);
  const baseTimer = calculateTimer(openCount, 'browse', config, site);

  if (inWorkHours && site.category === 'sometimes_work') {
    buttons.push({
      label: 'I need this for work',
      type: 'work',
      timer_seconds: calculateTimer(openCount, 'work', config, site)
    });
  }

  let browseLabel;
  if (baseTimer > 0) {
    browseLabel = `Continue to ${site.pattern} (${formatTimerLabel(baseTimer)} wait)`;
  } else {
    browseLabel = `Continue to ${site.pattern}`;
  }
  buttons.push({ label: browseLabel, type: 'browse', timer_seconds: baseTimer });
  buttons.push({ label: "I don't need this", type: 'nevermind', timer_seconds: 0 });
  return buttons;
}

// ─── OpenClaw API: Awareness Line ────────────────────────────────

async function getAwarenessFromAPI(site, openCount, config, streaks) {
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const day = now.toLocaleDateString('en-US', { weekday: 'long' });
  const windowHours = Math.round(config.rollingWindowMinutes / 60 * 10) / 10;

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

The line must reference BOTH (a) something real from his life right now AND (b) what this particular site gives him vs what it costs him.${emailContext}

Return ONLY this JSON: {"awareness": "your line here"}`;

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
      instructions: 'This is a request from the Jag browser extension. Return ONLY valid JSON, nothing else. No markdown fences, no explanation, no preamble. The awareness line must be under 15 words, deeply personal to Yash using your knowledge of his life, and different every time.',
      stream: false
    }),
    signal: AbortSignal.timeout(20000)
  });

  if (!response.ok) throw new Error(`API returned ${response.status}`);

  const data = await response.json();
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

  const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parsed = JSON.parse(jsonStr);
  if (!parsed.awareness) throw new Error('Invalid response structure');
  return parsed.awareness;
}

// ─── OpenClaw API: Evaluate Reason (Educational, Compassion-Scaled) ──

async function evaluateReason(data) {
  const { site, reason, chatHistory, openCount, streak } = data;
  const storageData = await chrome.storage.local.get(['config', 'excuseHistory', 'checkins']);
  const config = storageData.config || DEFAULT_CONFIG;
  const excuseHistory = storageData.excuseHistory || [];
  const checkins = storageData.checkins || [];
  const compassion = clampCompassionLevel(
    config.compassionLevel !== undefined ? config.compassionLevel : DEFAULT_CONFIG.compassionLevel
  );

  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const day = now.toLocaleDateString('en-US', { weekday: 'long' });
  const userRounds = chatHistory.filter(m => m.role === 'user').length;
  // Count how many times we've redirected for BS in this conversation
  const bsRedirects = chatHistory.filter(m => m.role === 'agent' && m.isBSRedirect).length;

  // Save excuse
  excuseHistory.push({ site, reason, timestamp: Date.now(), verdict: null });
  const trimmed = excuseHistory.slice(-50);
  await chrome.storage.local.set({ excuseHistory: trimmed });

  // Recent excuses for context
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentExcuses = trimmed
    .filter(e => e.timestamp > weekAgo && e.site === site)
    .slice(-10)
    .map(e => {
      const d = new Date(e.timestamp);
      return `${d.toLocaleDateString('en-US', { weekday: 'short' })} ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}: "${e.reason}" → ${e.verdict || 'pending'}`;
    })
    .join('\n');

  // Recent check-in data for pattern context
  const recentCheckins = checkins
    .filter(c => c.site === site && c.timestamp > weekAgo)
    .slice(-10);
  const notWorthItCount = recentCheckins.filter(c => c.wasWorthIt === 'no').length;
  const totalCheckins = recentCheckins.length;
  let checkinContext = '';
  if (totalCheckins > 0) {
    checkinContext = `\nCHECK-IN DATA: Of the last ${totalCheckins} mid-session check-ins for ${site}, Yash said "not worth it" ${notWorthItCount} times (${Math.round(notWorthItCount / totalCheckins * 100)}%). Use this data in your response.`;
  }

  const conversationSoFar = chatHistory.map(m =>
    `${m.role === 'user' ? 'Yash' : 'Jag'}: ${m.text}`
  ).join('\n');

  // Email context
  const emailSites = ['mail.google.com', 'superhuman.com', 'outlook.live.com', 'mail.yahoo.com'];
  const isEmailSite = emailSites.some(e => site.includes(e));
  let emailGatekeeperContext = '';
  if (isEmailSite) {
    const stored = await chrome.storage.local.get(['lastEmailAccess']);
    const lastAccess = stored.lastEmailAccess;
    if (lastAccess) {
      const minAgo = Math.round((Date.now() - lastAccess) / 60000);
      emailGatekeeperContext = `\nEMAIL INTEL: Yash last checked email ${minAgo} min ago. CHECK his Gmail (ai@yash-kothari.com) for unread emails from real people since ${new Date(lastAccess).toISOString()}. If there ARE important new emails, be more lenient. If nothing new, be extra strict.`;
    } else {
      emailGatekeeperContext = `\nEMAIL INTEL: First email check. CHECK Gmail (ai@yash-kothari.com) for important unread emails. Mention findings.`;
    }
  }

  const gate = getGateBehavior(compassion, openCount, userRounds);
  const toneDirective = getToneDirective(compassion);

  // Deterministic BS detection so low-effort responses always redirect instead of deny.
  if (isLowEffortReason(reason)) {
    if (bsRedirects >= 2) {
      const allowMessage = compassion >= 70
        ? 'You are chasing a quick dopamine reset, not solving the feeling underneath. Proceed if you choose, then check in honestly about whether it helped.'
        : 'Noticing this pattern already matters. Proceed if you choose, and use the check-in to test whether this actually gives what you wanted.';
      await updateLatestExcuseVerdict('allow');
      return { verdict: 'allow', message: allowMessage };
    }
    await updateLatestExcuseVerdict('redirect');
    return {
      verdict: 'redirect',
      message: 'That does not sound like what is actually going on. What is?'
    };
  }

  const prompt = `[JAG GATEKEEPER v0.2 - respond with ONLY JSON]

Yash wants to open ${site}. It is ${time} on ${day}. Visit #${openCount} today. Streak: ${streak.current} days.
Compassion level: ${compassion}/100.
${isPresenceTime(config) ? 'IMPORTANT: It is currently a designated presence time. Be VERY strict.' : ''}
${!isWorkHours(config) ? 'It is outside work hours.' : 'It is work hours.'}${emailGatekeeperContext}${checkinContext}

${recentExcuses ? `RECENT EXCUSES for ${site} (last 7 days):\n${recentExcuses}` : ''}

Current conversation:
${conversationSoFar}

Yash's latest response: "${reason}"

TONE: ${toneDirective}

YOUR RESPONSE MUST BE EDUCATIONAL. Connect Yash's behavior to one of these research findings (pick the most relevant, weave it in naturally — don't lecture):
- Urge surfing (Marlatt): Cravings peak and pass in 90 seconds whether you act or not. Observing without acting weakens the craving-behavior link over time.
- Craving migration: When one outlet is blocked, the craving finds another. The craving itself is untouched. Same impulse, different app.
- Allen Carr insight: The scroll/refresh doesn't relieve the restlessness — it created the restlessness. The "relief" is just ending the withdrawal the last session caused.
- Dopamine downregulation (Volkow): Every high-stimulation session makes the next craving stronger. The brain adapts by reducing baseline dopamine.
- Motivational interviewing: People change when they hear themselves articulate why. The act of writing recruits conscious processing.
- Contingency management: The streak gets more valuable every day. Breaking it costs more than any single session is worth.

GATE RULES (compassion ${compassion}/100):
${!gate.denyAllowed ? '- NEVER deny access. Always allow after your reflection. The choice is always Yash\'s.' : ''}
${gate.denyAllowed ? `- Deny is available. Visit #${openCount}. Round ${userRounds}. Max pushbacks: ${gate.maxPushbacks}.` : ''}
- BS DETECTION: If the response is low-effort/dismissive (like "idk", "bored", "whatever", single words, gibberish), DO NOT deny. Instead return verdict "redirect" with a message like "That doesn't sound like what's actually going on. What is?" After ${bsRedirects >= 2 ? 'TWO redirects already happened — allow through now with your educational reflection.' : `${bsRedirects} redirect(s), re-ask for honesty.`}
${gate.maxPushbacks > 0 ? `- Pushback available (up to ${gate.maxPushbacks} rounds) for vague-but-not-BS responses.` : '- No pushback. One gentle reflection, then allow.'}

Return ONLY this JSON:
{"verdict": "allow" | "pushback" | "deny" | "redirect", "message": "your response (2-3 sentences, educational + personal, research-informed)"}`;

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
      instructions: 'You are Jag v0.2, an educational awareness companion. Return ONLY valid JSON with verdict and message. Your message must connect the user\'s behavior to relevant behavioral science research — briefly, specifically, woven into the personal reflection. Not a lecture. An insight. Keep messages 2-3 sentences max.',
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

  // Validate and enforce compassion rules
  if (!['allow', 'pushback', 'deny', 'redirect'].includes(parsed.verdict)) {
    parsed.verdict = 'allow';
  }
  if (compassion === 100 && parsed.verdict === 'allow') {
    parsed.verdict = gate.defaultVerdict;
  }
  // Enforce: at low compassion, never deny
  if (!gate.denyAllowed && parsed.verdict === 'deny') {
    parsed.verdict = 'allow';
  }
  // After 2 BS redirects, force allow
  if (parsed.verdict === 'redirect' && bsRedirects >= 2) {
    parsed.verdict = 'allow';
  }

  await updateLatestExcuseVerdict(parsed.verdict);

  return parsed;
}

function isLowEffortReason(reason) {
  const raw = (reason || '').trim();
  if (!raw) return true;
  const normalized = raw.toLowerCase().replace(/[^a-z0-9\s']/g, '').replace(/\s+/g, ' ').trim();
  const tokens = normalized ? normalized.split(' ') : [];
  const lowEffortPhrases = new Set([
    'idk',
    "i don't know",
    'dont know',
    'whatever',
    'nothing',
    'n/a',
    'na',
    'no idea',
    'bored',
    'meh',
    'asdf',
    'test',
    'just because'
  ]);

  if (lowEffortPhrases.has(normalized)) return true;
  if (/^(.)\1{3,}$/.test(normalized)) return true;
  if (/^[asdfjkl;]+$/.test(raw.toLowerCase())) return true;
  if (tokens.length <= 1 && normalized.length <= 5) return true;
  return false;
}

async function updateLatestExcuseVerdict(verdict) {
  const updated = await chrome.storage.local.get(['excuseHistory']);
  const history = updated.excuseHistory || [];
  if (history.length > 0) {
    history[history.length - 1].verdict = verdict;
    await chrome.storage.local.set({ excuseHistory: history });
  }
}

// ─── Streaks ─────────────────────────────────────────────────────

async function updateStreaks() {
  const data = await chrome.storage.local.get(['streaks']);
  const streaks = data.streaks || { ...DEFAULT_STREAKS };
  const today = new Date().toISOString().slice(0, 10);

  if (streaks.lastDate !== today) {
    if (streaks.lastDate) {
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

// ─── Active Time Tracking ────────────────────────────────────────

const activeTimers = new Map();

chrome.tabs.onActivated.addListener(async (activeInfo) => {
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
  // Clean up check-in context
  const data = await chrome.storage.local.get(['checkinContext']);
  const ctx = data.checkinContext || {};
  delete ctx[tabId];
  await chrome.storage.local.set({ checkinContext: ctx });
});

async function stopTiming(tabId) {
  const timer = activeTimers.get(tabId);
  if (timer) {
    const elapsed = (Date.now() - timer.startTime) / 1000 / 60;
    const data = await chrome.storage.local.get(['streaks']);
    const streaks = data.streaks || { ...DEFAULT_STREAKS };
    streaks.dailyMinutes = Math.round((streaks.dailyMinutes + elapsed) * 100) / 100;
    await chrome.storage.local.set({ streaks });
    activeTimers.delete(tabId);
  }
}

// ─── Main Navigation Handler ─────────────────────────────────────

const overlayActiveTabs = new Map();

chrome.webNavigation.onCommitted.addListener(async (details) => {
  if (details.frameId !== 0) return;

  const data = await chrome.storage.local.get(['sites', 'config', 'sessions', 'streaks']);
  const sites = data.sites || DEFAULT_SITES;
  const config = data.config || DEFAULT_CONFIG;
  const sessions = data.sessions || [];

  const matchedSite = matchesFlaggedSite(details.url, sites);
  if (!matchedSite) return;

  const existing = overlayActiveTabs.get(details.tabId);
  if (existing && existing.site === matchedSite.pattern && (Date.now() - existing.timestamp) < 30000) {
    return;
  }
  overlayActiveTabs.set(details.tabId, { site: matchedSite.pattern, timestamp: Date.now() });

  const streaks = await updateStreaks();
  const openCount = getOpenCount(sessions, matchedSite.pattern, config.rollingWindowMinutes) + 1;

  const sessionId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  sessions.push({
    id: sessionId,
    site: matchedSite.pattern,
    timestamp: Date.now(),
    buttonChoice: null,
    timerServed: null,
    writtenResponse: null,
    aiResponse: null
  });

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const prunedSessions = sessions.filter(s => s.timestamp > weekAgo);
  await chrome.storage.local.set({ sessions: prunedSessions });

  // Show loading
  try {
    await chrome.tabs.sendMessage(details.tabId, { type: 'JAG_SHOW_LOADING' });
  } catch (e) {
    console.log('Jag: Could not show loading screen:', e.message);
  }

  // Get awareness line
  let awareness;
  try {
    awareness = await getAwarenessFromAPI(matchedSite, openCount, config, streaks);
  } catch (err) {
    console.error('Jag: API FAILED:', err.message);
    awareness = generateFallbackAwareness(matchedSite.pattern, openCount, config.rollingWindowMinutes, streaks.current);
  }

  // Get cached alternatives
  const altData = await chrome.storage.local.get(['rssArticles', 'lichessPuzzle']);
  const articles = altData.rssArticles || [];
  const puzzle = altData.lichessPuzzle || null;

  // Pick a random article
  let article = null;
  if (articles.length > 0) {
    article = articles[Math.floor(Math.random() * articles.length)];
  }

  // Send overlay data
  try {
    await chrome.tabs.sendMessage(details.tabId, {
      type: 'JAG_SHOW_OVERLAY',
      data: {
        awareness,
        streak: {
          current: streaks.current,
          longest: streaks.longest,
          dailyMinutes: streaks.dailyMinutes,
          targetMinutes: config.dailyTargetMinutes
        },
        openCount,
        site: matchedSite.pattern,
        windowMinutes: config.rollingWindowMinutes,
        sessionId,
        compassionLevel: clampCompassionLevel(
          config.compassionLevel !== undefined ? config.compassionLevel : DEFAULT_CONFIG.compassionLevel
        ),
        alternatives: {
          article,
          puzzle
        }
      }
    });
  } catch (err) {
    console.log('Jag: Could not send message to tab:', err.message);
  }
});

// ─── Message Handler ─────────────────────────────────────────────

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
    return true;
  } else if (message.type === 'JAG_CHECKIN_RESPONSE') {
    handleCheckinResponse(message.data, sender.tab?.id);
    sendResponse({ ok: true });
  } else if (message.type === 'JAG_GET_ALTERNATIVES') {
    (async () => {
      const altData = await chrome.storage.local.get(['rssArticles', 'lichessPuzzle']);
      sendResponse({
        articles: altData.rssArticles || [],
        puzzle: altData.lichessPuzzle || null
      });
    })();
    return true;
  }
  return false;
});

async function handleButtonChoice(choice, tabId) {
  const data = await chrome.storage.local.get(['sessions']);
  const sessions = data.sessions || [];

  for (let i = sessions.length - 1; i >= 0; i--) {
    if (sessions[i].site === choice.site && sessions[i].buttonChoice === null) {
      sessions[i].buttonChoice = choice.buttonType;
      sessions[i].timerServed = choice.timerSeconds;
      sessions[i].writtenResponse = choice.reason || null;
      break;
    }
  }
  await chrome.storage.local.set({ sessions });

  if (tabId) overlayActiveTabs.delete(tabId);

  if (choice.buttonType === 'nevermind' && tabId) {
    try { await chrome.tabs.remove(tabId); } catch {}
  }

  if (choice.buttonType !== 'nevermind' && tabId) {
    activeTimers.set(tabId, { site: choice.site, startTime: Date.now() });

    // Schedule mid-session check-in
    const sessionId = choice.sessionId || null;
    scheduleCheckin(tabId, choice.site, choice.reason || '', sessionId);

    // Track email access
    const emailSites = ['mail.google.com', 'superhuman.com', 'outlook.live.com', 'mail.yahoo.com'];
    if (emailSites.some(e => choice.site.includes(e))) {
      await chrome.storage.local.set({ lastEmailAccess: Date.now() });
    }
  }
}

async function handleCheckinResponse(data, tabId) {
  const { site, wasWorthIt, minuteMark, sessionId } = data;
  const storageData = await chrome.storage.local.get(['checkins', 'checkinContext']);
  const checkins = storageData.checkins || [];

  checkins.push({
    timestamp: Date.now(),
    site,
    sessionId,
    wasWorthIt,
    durationMinutes: minuteMark
  });

  // Keep last 200 check-ins
  const trimmedCheckins = checkins.slice(-200);
  await chrome.storage.local.set({ checkins: trimmedCheckins });

  if (wasWorthIt === 'close' && tabId) {
    // Close the tab
    try { await chrome.tabs.remove(tabId); } catch {}
    // Clean up check-in context
    const ctx = storageData.checkinContext || {};
    delete ctx[tabId];
    await chrome.storage.local.set({ checkinContext: ctx });
  } else if (wasWorthIt === 'yes') {
    // Schedule next check-in: 2min -> 10min -> 20min
    let nextMinute;
    if (minuteMark === 2) nextMinute = 10;
    else if (minuteMark === 10) nextMinute = 20;
    else nextMinute = null; // no more check-ins after 20min

    if (nextMinute && tabId) {
      const delayFromNow = nextMinute - minuteMark;
      chrome.alarms.create(`jag-checkin-${tabId}-${nextMinute}`, { delayInMinutes: delayFromNow });
    }
  } else if (wasWorthIt === 'no') {
    // User said "not really" — no more check-ins, just let them be
    if (tabId) {
      const ctx = storageData.checkinContext || {};
      delete ctx[tabId];
      await chrome.storage.local.set({ checkinContext: ctx });
    }
  }
}
