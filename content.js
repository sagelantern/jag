// Jag - Content Script
// Conversational gatekeeper overlay

(function () {
  'use strict';

  let overlayActive = false;
  let currentData = null;
  let idleTimer = null;
  let lastActivity = Date.now();
  let chatHistory = [];

  // Immediately inject a full-screen blocker before any page content renders
  // This runs at document_start — fastest possible interception
  (async function earlyBlock() {
    try {
      const data = await chrome.storage.local.get(['sites']);
      const sites = data.sites || [];
      const hostname = window.location.hostname;
      const isFlagged = sites.some(s => s.enabled && hostname.includes(s.pattern));
      if (isFlagged) {
        // Inject a covering div immediately
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
      showOverlay(message.data);
      sendResponse({ ok: true });
    }
    return false;
  });

  // Track user activity for idle timeout
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

  function showLoadingOverlay() {
    // Remove any existing overlay first
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
            <div class="jag-message-text">Why do you need to open this right now?</div>
          </div>
        </div>

        <div class="jag-input-area" id="jag-input-area">
          <div class="jag-input-row">
            <input type="text" id="jag-input" class="jag-input" placeholder="Type your reason..." autocomplete="off" />
            <button id="jag-send" class="jag-send-btn">→</button>
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

    // Focus input — stagger retries to beat page JS focus-stealing (Superhuman etc)
    const tryFocus = () => { if (input && !input.disabled && document.activeElement !== input) input.focus(); };
    setTimeout(tryFocus, 100);
    setTimeout(tryFocus, 600);
    setTimeout(tryFocus, 1500);
    setTimeout(tryFocus, 3000);
    setTimeout(tryFocus, 5000);

    // For aggressive SPAs (Superhuman), keep reclaiming focus for 10 seconds
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

    // Send on Enter
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
      setTimeout(() => {
        // Tab will be closed by background
      }, 800);
    });
  }

  async function submitReason(overlay, data) {
    const input = overlay.querySelector('#jag-input');
    const chatDiv = overlay.querySelector('#jag-chat');
    const inputArea = overlay.querySelector('#jag-input-area');
    const reason = input.value.trim();

    if (!reason) return;

    // Show user's message
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
        <div class="jag-message-text"><span class="jag-dots">···</span></div>
      </div>
    `;
    chatDiv.scrollTop = chatDiv.scrollHeight;

    // Disable input while waiting
    input.disabled = true;

    // Track conversation
    chatHistory.push({ role: 'user', text: reason });

    // Ask background to evaluate via API
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

      // Remove typing indicator
      const typing = overlay.querySelector('#jag-typing');
      if (typing) typing.remove();

      if (response && response.verdict === 'allow') {
        // Valid reason — show response and proceed button
        chatHistory.push({ role: 'agent', text: response.message });

        chatDiv.innerHTML += `
          <div class="jag-message jag-message-agent">
            <div class="jag-message-text">${escapeHTML(response.message)}</div>
          </div>
        `;
        chatDiv.scrollTop = chatDiv.scrollHeight;

        // Replace input with proceed button
        inputArea.innerHTML = `
          <button id="jag-proceed" class="jag-proceed-btn">Continue to ${escapeHTML(data.site)}</button>
        `;

        overlay.querySelector('#jag-proceed').addEventListener('click', () => {
          chrome.runtime.sendMessage({
            type: 'JAG_BUTTON_CHOICE',
            data: {
              site: data.site,
              buttonType: 'browse',
              timerSeconds: 0,
              reason: chatHistory.map(m => m.text).join(' | '),
              timestamp: Date.now()
            }
          });
          removeOverlay(overlay);
        });

      } else if (response && response.verdict === 'deny') {
        // Not valid — show response and only nevermind
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
          // Brief pause then close
          setTimeout(() => {}, 500);
        });

      } else if (response && response.verdict === 'pushback') {
        // Needs more justification
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
      // Remove typing indicator
      const typing = overlay.querySelector('#jag-typing');
      if (typing) typing.remove();

      // Fallback: allow through on error
      inputArea.innerHTML = `
        <button id="jag-proceed" class="jag-proceed-btn">Continue</button>
      `;
      overlay.querySelector('#jag-proceed').addEventListener('click', () => {
        removeOverlay(overlay);
      });
    }
  }

  function removeOverlay(overlay) {
    overlayActive = false;
    document.removeEventListener('keydown', blockKeys, true);
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    overlay.remove();
    // Remove early blocker if still present
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
