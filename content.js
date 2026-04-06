// Jag - Content Script
// Renders full-page overlay and enforces timer

(function () {
  'use strict';

  let overlayActive = false;
  let currentData = null;

  // Listen for overlay trigger from background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'JAG_SHOW_OVERLAY') {
      currentData = message.data;
      showOverlay(message.data);
      sendResponse({ ok: true });
    }
    return false;
  });

  function showOverlay(data) {
    if (overlayActive) return;
    overlayActive = true;

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
      // Block Escape and most keyboard shortcuts while overlay is up
      if (e.key === 'Escape' || (e.ctrlKey && e.key === 'w')) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  }

  function buildOverlayHTML(data) {
    const { awareness, buttons, streak, openCount, site, windowMinutes } = data;
    const windowLabel = windowMinutes >= 60
      ? `${Math.round(windowMinutes / 60)}h`
      : `${windowMinutes}m`;

    return `
      <div class="jag-container">
        <div class="jag-header">
          <span class="jag-logo">jag</span>
        </div>

        <div class="jag-awareness">
          ${escapeHTML(awareness)}
        </div>

        <div class="jag-stats">
          <div class="jag-stat">
            <span class="jag-stat-value">${streak.current}</span>
            <span class="jag-stat-label">day streak</span>
          </div>
          <div class="jag-stat-divider"></div>
          <div class="jag-stat">
            <span class="jag-stat-value">${streak.longest}</span>
            <span class="jag-stat-label">longest</span>
          </div>
          <div class="jag-stat-divider"></div>
          <div class="jag-stat">
            <span class="jag-stat-value">${Math.round(streak.dailyMinutes)}<span class="jag-stat-unit">/${streak.targetMinutes}m</span></span>
            <span class="jag-stat-label">today</span>
          </div>
          <div class="jag-stat-divider"></div>
          <div class="jag-stat">
            <span class="jag-stat-value">${openCount}</span>
            <span class="jag-stat-label">visits (${windowLabel})</span>
          </div>
        </div>

        <div class="jag-buttons" id="jag-buttons">
          ${buttons.map((btn, i) => `
            <button class="jag-btn jag-btn-${btn.type}" data-index="${i}" data-type="${btn.type}" data-timer="${btn.timer_seconds}">
              ${escapeHTML(btn.label)}
              ${btn.timer_seconds > 0 ? `<span class="jag-btn-timer">${btn.timer_seconds}s wait</span>` : ''}
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
          // Tab will be closed by background script
          // Show brief confirmation
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
      timerText.textContent = `${remaining}s`;
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
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();
