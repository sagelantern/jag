// Jag - Content Script
// Renders full-page overlay and enforces timer

(function () {
  'use strict';

  let overlayActive = false;
  let currentData = null;
  let idleTimer = null;
  let lastActivity = Date.now();

  // Listen for overlay trigger from background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'JAG_SHOW_OVERLAY') {
      currentData = message.data;
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
    // Monitor mouse, keyboard, scroll activity
    ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetIdleTimer, { passive: true });
    });

    // Check every 10 seconds if user has been idle for 60+ seconds
    idleTimer = setInterval(() => {
      if (!overlayActive && currentData && (Date.now() - lastActivity) >= 60000) {
        // User has been idle for 1+ minute on a flagged site, re-trigger overlay
        chrome.runtime.sendMessage({
          type: 'JAG_IDLE_RETRIGGER',
          data: { site: currentData.site, timestamp: Date.now() }
        });
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

  function showOverlay(data) {
    if (overlayActive) return;
    overlayActive = true;
    stopIdleMonitoring();

    // Create overlay container
    const overlay = document.createElement('div');
    overlay.id = 'jag-overlay';
    overlay.innerHTML = buildOverlayHTML(data);

    // Prevent any interaction with the page beneath
    overlay.addEventListener('click', (e) => e.stopPropagation());
    overlay.addEventListener('keydown', (e) => e.stopPropagation());

    // Block scrolling
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    // Insert overlay
    if (document.body) {
      document.body.appendChild(overlay);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(overlay);
      });
    }

    // Attach button handlers
    setupButtons(overlay, data);

    // Block escape key and other dismiss attempts
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
    const { awareness, buttons, streak, openCount, site, windowMinutes } = data;

    return `
      <div class="jag-container">
        <div class="jag-header">
          <span class="jag-logo">jag</span>
        </div>

        <div class="jag-awareness">
          ${escapeHTML(awareness)}
        </div>

        <div class="jag-meta">
          Day ${streak.current}${streak.current > 0 ? ' streak' : ''} · Visit #${openCount} today
        </div>

        <div class="jag-buttons" id="jag-buttons">
          ${buttons.map((btn, i) => `
            <button class="jag-btn jag-btn-${btn.type}" data-index="${i}" data-type="${btn.type}" data-timer="${btn.timer_seconds}">
              ${escapeHTML(btn.label)}
              ${btn.timer_seconds > 0 ? `<span class="jag-btn-timer">${formatTimer(btn.timer_seconds)} wait</span>` : ''}
            </button>
          `).join('')}
        </div>

        <div class="jag-timer-display" id="jag-timer-display" style="display: none;">
          <div class="jag-timer-text" id="jag-timer-text"></div>
          <div class="jag-timer-bar-container">
            <div class="jag-timer-bar" id="jag-timer-bar"></div>
          </div>
        </div>
      </div>
    `;
  }

  function formatTimer(seconds) {
    if (seconds >= 60) {
      const min = Math.floor(seconds / 60);
      const sec = seconds % 60;
      return sec > 0 ? `${min}m ${sec}s` : `${min}m`;
    }
    return `${seconds}s`;
  }

  function setupButtons(overlay, data) {
    const buttons = overlay.querySelectorAll('.jag-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        const timerSeconds = parseInt(btn.dataset.timer, 10) || 0;

        // Report choice to background
        chrome.runtime.sendMessage({
          type: 'JAG_BUTTON_CHOICE',
          data: {
            site: data.site,
            buttonType: type,
            timerSeconds: timerSeconds,
            timestamp: Date.now()
          }
        });

        if (type === 'nevermind') {
          const container = overlay.querySelector('.jag-container');
          container.innerHTML = `
            <div class="jag-farewell">
              <div class="jag-farewell-text">Good choice.</div>
            </div>
          `;
          return;
        }

        // Start timer countdown
        if (timerSeconds > 0) {
          startTimer(overlay, timerSeconds, data);
        } else {
          removeOverlay(overlay);
        }
      });
    });
  }

  function startTimer(overlay, totalSeconds, data) {
    const buttonsDiv = overlay.querySelector('#jag-buttons');
    const timerDisplay = overlay.querySelector('#jag-timer-display');
    const timerText = overlay.querySelector('#jag-timer-text');
    const timerBar = overlay.querySelector('#jag-timer-bar');

    buttonsDiv.style.display = 'none';
    timerDisplay.style.display = 'block';

    let remaining = totalSeconds;

    function updateTimer() {
      timerText.textContent = formatTimer(remaining);
      const progress = ((totalSeconds - remaining) / totalSeconds) * 100;
      timerBar.style.width = `${progress}%`;

      if (remaining <= 0) {
        removeOverlay(overlay);
        return;
      }

      remaining--;
      setTimeout(updateTimer, 1000);
    }

    updateTimer();
  }

  function removeOverlay(overlay) {
    overlayActive = false;
    document.removeEventListener('keydown', blockKeys, true);
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    overlay.remove();

    // Start idle monitoring after overlay is dismissed
    lastActivity = Date.now();
    startIdleMonitoring();
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();
