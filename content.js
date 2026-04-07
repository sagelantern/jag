// Jag v0.2 - Content Script
// Overlay with combined prompt, alternatives, mid-session check-ins, BS redirect

(function () {
  'use strict';

  let overlayActive = false;
  let currentData = null;
  let idleTimer = null;
  let lastActivity = Date.now();
  let chatHistory = [];
  let bsRedirectCount = 0;

  // Immediately inject a full-screen blocker before any page content renders
  (async function earlyBlock() {
    try {
      const data = await chrome.storage.local.get(['sites']);
      const sites = data.sites || [];
      const hostname = window.location.hostname;
      const isFlagged = sites.some(s => s.enabled && hostname.includes(s.pattern));
      if (isFlagged) {
        const blocker = document.createElement('div');
        blocker.id = 'jag-early-blocker';
        blocker.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:2147483646;background:#1a1a2e;';
        (document.documentElement || document.body || document).appendChild(blocker);
      }
    } catch (e) {}
  })();

  // Listen for messages from background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'JAG_SHOW_LOADING') {
      showLoadingOverlay();
      sendResponse({ ok: true });
    } else if (message.type === 'JAG_SHOW_OVERLAY') {
      currentData = message.data;
      chatHistory = [];
      bsRedirectCount = 0;
      showOverlay(message.data);
      sendResponse({ ok: true });
    } else if (message.type === 'JAG_CHECKIN') {
      showCheckinBanner(message.data);
      sendResponse({ ok: true });
    }
    return false;
  });

  // ─── Idle Monitoring ─────────────────────────────────────────

  function resetIdleTimer() {
    lastActivity = Date.now();
  }

  function startIdleMonitoring() {
    ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetIdleTimer, { passive: true });
    });
    idleTimer = setInterval(() => {
      if (!overlayActive && currentData && (Date.now() - lastActivity) >= 60000) {
        chrome.runtime.sendMessage({
          type: 'JAG_IDLE_RETRIGGER',
          data: { site: currentData.site, timestamp: Date.now() }
        });
        chatHistory = [];
        bsRedirectCount = 0;
        showOverlay(currentData);
      }
    }, 10000);
  }

  function stopIdleMonitoring() {
    if (idleTimer) {
      clearInterval(idleTimer);
      idleTimer = null;
    }
    ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'].forEach(event => {
      document.removeEventListener(event, resetIdleTimer);
    });
  }

  // ─── Loading Overlay ─────────────────────────────────────────

  function showLoadingOverlay() {
    const existing = document.getElementById('jag-overlay');
    if (existing) existing.remove();

    overlayActive = true;
    stopIdleMonitoring();

    const overlay = document.createElement('div');
    overlay.id = 'jag-overlay';
    overlay.innerHTML = `
      <div class="jag-container">
        <div class="jag-header">
          <span class="jag-logo">jag</span>
        </div>
        <div class="jag-loading">
          <div class="jag-loading-dot"></div>
        </div>
      </div>
    `;

    overlay.addEventListener('click', (e) => e.stopPropagation());
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    if (document.body) {
      document.body.appendChild(overlay);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(overlay);
      });
    }

    document.addEventListener('keydown', blockKeys, true);
  }

  // ─── Main Overlay ────────────────────────────────────────────

  function showOverlay(data) {
    const existing = document.getElementById('jag-overlay');
    if (existing) {
      existing.innerHTML = buildOverlayHTML(data);
      setupChat(existing, data);
      return;
    }

    overlayActive = true;
    stopIdleMonitoring();

    const overlay = document.createElement('div');
    overlay.id = 'jag-overlay';
    overlay.innerHTML = buildOverlayHTML(data);

    overlay.addEventListener('click', (e) => e.stopPropagation());
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    if (document.body) {
      document.body.appendChild(overlay);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(overlay);
      });
    }

    setupChat(overlay, data);
    document.addEventListener('keydown', blockKeys, true);
  }

  function blockKeys(e) {
    if (overlayActive) {
      if (e.key === 'Escape' || (e.ctrlKey && e.key === 'w')) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  }

  function buildOverlayHTML(data) {
    const { awareness, streak, openCount } = data;

    return `
      <div class="jag-container">
        <div class="jag-header">
          <span class="jag-logo">jag</span>
          <span class="jag-meta">Day ${streak.current}${streak.current > 0 ? ' streak' : ''} · Visit #${openCount} today</span>
        </div>

        <div class="jag-chat" id="jag-chat">
          <div class="jag-message jag-message-agent">
            <div class="jag-message-text">${escapeHTML(awareness)}</div>
          </div>
          <div class="jag-message jag-message-agent">
            <div class="jag-message-text">Why do you want to open this? What is the underlying feeling or desire?</div>
          </div>
        </div>

        <div class="jag-input-area" id="jag-input-area">
          <div class="jag-input-row">
            <input type="text" id="jag-input" class="jag-input" placeholder="Be honest with yourself..." autocomplete="off" />
            <button id="jag-send" class="jag-send-btn">&rarr;</button>
          </div>
          <button id="jag-nevermind" class="jag-nevermind-btn">I don't need this</button>
        </div>
      </div>
    `;
  }

  function setupChat(overlay, data) {
    const input = overlay.querySelector('#jag-input');
    const sendBtn = overlay.querySelector('#jag-send');
    const nevermindBtn = overlay.querySelector('#jag-nevermind');
    const chatDiv = overlay.querySelector('#jag-chat');

    // Focus input with staggered retries
    const tryFocus = () => { if (input && !input.disabled && document.activeElement !== input) input.focus(); };
    setTimeout(tryFocus, 100);
    setTimeout(tryFocus, 600);
    setTimeout(tryFocus, 1500);
    setTimeout(tryFocus, 3000);
    setTimeout(tryFocus, 5000);

    let focusGuardCount = 0;
    const focusGuard = setInterval(() => {
      if (!overlayActive || focusGuardCount > 20 || (input && input.disabled)) {
        clearInterval(focusGuard);
        return;
      }
      if (document.activeElement !== input && input && !input.disabled) {
        input.focus();
      }
      focusGuardCount++;
    }, 500);

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submitReason(overlay, data);
      }
    });

    sendBtn.addEventListener('click', () => submitReason(overlay, data));

    nevermindBtn.addEventListener('click', () => {
      chrome.runtime.sendMessage({
        type: 'JAG_BUTTON_CHOICE',
        data: {
          site: data.site,
          buttonType: 'nevermind',
          timerSeconds: 0,
          timestamp: Date.now()
        }
      });

      chatDiv.innerHTML += `
        <div class="jag-message jag-message-agent">
          <div class="jag-message-text">Good choice.</div>
        </div>
      `;
      overlay.querySelector('#jag-input-area').style.display = 'none';
      setTimeout(() => {}, 800);
    });
  }

  // ─── Submit Reason & Handle Verdicts ─────────────────────────

  async function submitReason(overlay, data) {
    const input = overlay.querySelector('#jag-input');
    const chatDiv = overlay.querySelector('#jag-chat');
    const inputArea = overlay.querySelector('#jag-input-area');
    const reason = input.value.trim();

    if (!reason) return;

    // Show user message
    chatDiv.innerHTML += `
      <div class="jag-message jag-message-user">
        <div class="jag-message-text">${escapeHTML(reason)}</div>
      </div>
    `;
    input.value = '';
    chatDiv.scrollTop = chatDiv.scrollHeight;

    // Show typing indicator
    chatDiv.innerHTML += `
      <div class="jag-message jag-message-agent jag-typing" id="jag-typing">
        <div class="jag-message-text"><span class="jag-dots">&middot;&middot;&middot;</span></div>
      </div>
    `;
    chatDiv.scrollTop = chatDiv.scrollHeight;

    input.disabled = true;

    chatHistory.push({ role: 'user', text: reason });

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'JAG_EVALUATE_REASON',
        data: {
          site: data.site,
          reason: reason,
          chatHistory: chatHistory,
          openCount: data.openCount,
          streak: data.streak
        }
      });

      const typing = overlay.querySelector('#jag-typing');
      if (typing) typing.remove();

      if (response && response.verdict === 'redirect') {
        // BS redirect: show message, re-enable input
        bsRedirectCount++;
        chatHistory.push({ role: 'agent', text: response.message, isBSRedirect: true });

        chatDiv.innerHTML += `
          <div class="jag-message jag-message-agent">
            <div class="jag-message-text">${escapeHTML(response.message)}</div>
          </div>
        `;
        chatDiv.scrollTop = chatDiv.scrollHeight;

        input.disabled = false;
        input.placeholder = 'Try again honestly...';
        input.focus();

      } else if (response && response.verdict === 'allow') {
        chatHistory.push({ role: 'agent', text: response.message });

        chatDiv.innerHTML += `
          <div class="jag-message jag-message-agent">
            <div class="jag-message-text">${escapeHTML(response.message)}</div>
          </div>
        `;
        chatDiv.scrollTop = chatDiv.scrollHeight;

        // Show alternatives + proceed
        showAlternativesAndProceed(overlay, data, reason);

      } else if (response && response.verdict === 'deny') {
        chatHistory.push({ role: 'agent', text: response.message });

        chatDiv.innerHTML += `
          <div class="jag-message jag-message-agent">
            <div class="jag-message-text">${escapeHTML(response.message)}</div>
          </div>
        `;
        chatDiv.scrollTop = chatDiv.scrollHeight;

        inputArea.innerHTML = `
          <button id="jag-close" class="jag-nevermind-btn">Close</button>
        `;

        overlay.querySelector('#jag-close').addEventListener('click', () => {
          chrome.runtime.sendMessage({
            type: 'JAG_BUTTON_CHOICE',
            data: {
              site: data.site,
              buttonType: 'nevermind',
              timerSeconds: 0,
              timestamp: Date.now()
            }
          });
          setTimeout(() => {}, 500);
        });

      } else if (response && response.verdict === 'pushback') {
        chatHistory.push({ role: 'agent', text: response.message });

        chatDiv.innerHTML += `
          <div class="jag-message jag-message-agent">
            <div class="jag-message-text">${escapeHTML(response.message)}</div>
          </div>
        `;
        chatDiv.scrollTop = chatDiv.scrollHeight;

        input.disabled = false;
        input.focus();
      }

    } catch (err) {
      console.error('Jag: Evaluate failed:', err);
      const typing = overlay.querySelector('#jag-typing');
      if (typing) typing.remove();

      // Fallback: allow through on error
      showAlternativesAndProceed(overlay, data, reason);
    }
  }

  // ─── Alternatives + Proceed ──────────────────────────────────

  function showAlternativesAndProceed(overlay, data, reason) {
    const inputArea = overlay.querySelector('#jag-input-area');
    const chatDiv = overlay.querySelector('#jag-chat');
    data.latestUserReason = reason;
    const alternatives = data.alternatives || {};
    const article = alternatives.article;
    const puzzle = alternatives.puzzle;

    let altHTML = '';

    if (article || puzzle) {
      altHTML += '<div class="jag-alternatives">';
      altHTML += '<div class="jag-alt-header">Or try something better:</div>';

      if (article) {
        altHTML += `
          <button class="jag-alt-btn" id="jag-alt-article">
            <span class="jag-alt-icon">&#128214;</span>
            <span class="jag-alt-info">
              <span class="jag-alt-title">${escapeHTML(article.title.slice(0, 60))}${article.title.length > 60 ? '...' : ''}</span>
              <span class="jag-alt-source">${escapeHTML(article.source)} · 2-3 min read</span>
            </span>
          </button>
        `;
      }

      if (puzzle) {
        altHTML += `
          <button class="jag-alt-btn" id="jag-alt-puzzle">
            <span class="jag-alt-icon">&#9816;</span>
            <span class="jag-alt-info">
              <span class="jag-alt-title">Lichess Daily Puzzle</span>
              <span class="jag-alt-source">Rating ${puzzle.rating || '?'} · 30 sec</span>
            </span>
          </button>
        `;
      }

      altHTML += '</div>';
    }

    inputArea.innerHTML = `
      ${altHTML}
      <button id="jag-proceed" class="jag-proceed-btn">Continue to ${escapeHTML(data.site)}</button>
    `;

    // Proceed button
    overlay.querySelector('#jag-proceed').addEventListener('click', () => {
      chrome.runtime.sendMessage({
        type: 'JAG_BUTTON_CHOICE',
        data: {
          site: data.site,
          buttonType: 'browse',
          timerSeconds: 0,
          reason,
          sessionId: data.sessionId,
          timestamp: Date.now()
        }
      });
      removeOverlay(overlay);
    });

    // Article alternative
    if (article) {
      overlay.querySelector('#jag-alt-article').addEventListener('click', () => {
        showArticleInOverlay(overlay, data, article);
      });
    }

    // Puzzle alternative
    if (puzzle) {
      overlay.querySelector('#jag-alt-puzzle').addEventListener('click', () => {
        showPuzzleInOverlay(overlay, data, puzzle);
      });
    }
  }

  // ─── Article Reader (in overlay) ─────────────────────────────

  function showArticleInOverlay(overlay, data, article) {
    const container = overlay.querySelector('.jag-container');
    container.innerHTML = `
      <div class="jag-header">
        <span class="jag-logo">jag</span>
        <span class="jag-meta">One Interesting Thing</span>
      </div>
      <div class="jag-article-reader" id="jag-article-reader">
        <div class="jag-article-source">${escapeHTML(article.source)}</div>
        <h2 class="jag-article-title">${escapeHTML(article.title)}</h2>
        <div class="jag-article-body">${escapeHTML(article.content || article.preview)}</div>
      </div>
      <div class="jag-input-area">
        <div class="jag-article-done-text">That's it. Back to what you were doing?</div>
        <button id="jag-article-close" class="jag-nevermind-btn">Close & go back to work</button>
        <button id="jag-article-proceed" class="jag-proceed-btn">Continue to ${escapeHTML(data.site)} anyway</button>
      </div>
    `;

    overlay.querySelector('#jag-article-close').addEventListener('click', () => {
      chrome.runtime.sendMessage({
        type: 'JAG_BUTTON_CHOICE',
        data: {
          site: data.site,
          buttonType: 'alternative_article',
          timerSeconds: 0,
          timestamp: Date.now()
        }
      });
      removeOverlay(overlay);
    });

    overlay.querySelector('#jag-article-proceed').addEventListener('click', () => {
      chrome.runtime.sendMessage({
        type: 'JAG_BUTTON_CHOICE',
        data: {
          site: data.site,
          buttonType: 'browse',
          timerSeconds: 0,
          reason: data.latestUserReason || '',
          sessionId: data.sessionId,
          timestamp: Date.now()
        }
      });
      removeOverlay(overlay);
    });
  }

  // ─── Lichess Puzzle (in overlay) ─────────────────────────────

  function showPuzzleInOverlay(overlay, data, puzzle) {
    const container = overlay.querySelector('.jag-container');
    container.innerHTML = `
      <div class="jag-header">
        <span class="jag-logo">jag</span>
        <span class="jag-meta">Lichess Daily Puzzle</span>
      </div>
      <div class="jag-puzzle-container">
        <div class="jag-puzzle-info">
          <span>Rating: ${puzzle.rating || '?'}</span>
        </div>
        <div class="jag-puzzle-board">
          <a href="${escapeHTML(puzzle.url)}" target="_blank" rel="noopener" class="jag-puzzle-link">
            Open puzzle on Lichess &rarr;
          </a>
          <div class="jag-puzzle-fen">${escapeHTML(puzzle.fen || 'Puzzle loading...')}</div>
        </div>
      </div>
      <div class="jag-input-area">
        <button id="jag-puzzle-close" class="jag-nevermind-btn">Close & go back to work</button>
        <button id="jag-puzzle-proceed" class="jag-proceed-btn">Continue to ${escapeHTML(data.site)} anyway</button>
      </div>
    `;

    overlay.querySelector('#jag-puzzle-close').addEventListener('click', () => {
      chrome.runtime.sendMessage({
        type: 'JAG_BUTTON_CHOICE',
        data: {
          site: data.site,
          buttonType: 'alternative_puzzle',
          timerSeconds: 0,
          timestamp: Date.now()
        }
      });
      removeOverlay(overlay);
    });

    overlay.querySelector('#jag-puzzle-proceed').addEventListener('click', () => {
      chrome.runtime.sendMessage({
        type: 'JAG_BUTTON_CHOICE',
        data: {
          site: data.site,
          buttonType: 'browse',
          timerSeconds: 0,
          reason: data.latestUserReason || '',
          sessionId: data.sessionId,
          timestamp: Date.now()
        }
      });
      removeOverlay(overlay);
    });
  }

  // ─── Mid-Session Check-In Banner ─────────────────────────────

  function showCheckinBanner(data) {
    // Remove any existing check-in banner
    const existing = document.getElementById('jag-checkin');
    if (existing) existing.remove();

    const banner = document.createElement('div');
    banner.id = 'jag-checkin';

    const quoteText = data.userResponse
      ? `You said: "${data.userResponse.slice(0, 80)}${data.userResponse.length > 80 ? '...' : ''}"`
      : `You've been here ${data.minuteMark} minutes.`;

    banner.innerHTML = `
      <div class="jag-checkin-content">
        <div class="jag-checkin-quote">${escapeHTML(quoteText)}</div>
        <div class="jag-checkin-question">Is this helping?</div>
        <div class="jag-checkin-buttons">
          <button class="jag-checkin-btn jag-checkin-yes" data-response="yes">Yes</button>
          <button class="jag-checkin-btn jag-checkin-no" data-response="no">Not really</button>
          <button class="jag-checkin-btn jag-checkin-close" data-response="close">Close site</button>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    // Auto-dismiss after 30 seconds if no response
    const autoDismiss = setTimeout(() => {
      if (banner.parentNode) banner.remove();
    }, 30000);

    banner.querySelectorAll('.jag-checkin-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        clearTimeout(autoDismiss);
        const response = btn.dataset.response;
        chrome.runtime.sendMessage({
          type: 'JAG_CHECKIN_RESPONSE',
          data: {
            site: data.site,
            wasWorthIt: response,
            minuteMark: data.minuteMark,
            sessionId: data.sessionId
          }
        });

        // Animate out
        banner.style.animation = 'jag-slide-down 0.3s ease-in forwards';
        setTimeout(() => {
          if (banner.parentNode) banner.remove();
        }, 300);
      });
    });

    // Slide in animation
    requestAnimationFrame(() => {
      banner.style.animation = 'jag-slide-up 0.3s ease-out forwards';
    });
  }

  // ─── Remove Overlay ──────────────────────────────────────────

  function removeOverlay(overlay) {
    overlayActive = false;
    document.removeEventListener('keydown', blockKeys, true);
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    overlay.remove();
    const blocker = document.getElementById('jag-early-blocker');
    if (blocker) blocker.remove();

    lastActivity = Date.now();
    startIdleMonitoring();
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();
