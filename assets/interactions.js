/*
 * Bloombubs mockups — makes the prototype behave like the real app.
 *
 * Everything is inferred from the markup, so a new screen only needs to include
 * this script: pill rows become selectable, steppers count, timers run, and Save
 * writes a demo entry that the Today screen reads back.
 */
(function () {
  'use strict';

  const STORE_KEY = 'bloombubs-mockup-log';

  /* ---------- demo log (localStorage) ---------- */

  function readLog() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY)) || [];
    } catch (err) {
      return [];
    }
  }

  function writeEntry(entry) {
    const log = readLog();
    log.push(entry);
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(log.slice(-200)));
    } catch (err) {
      /* private mode — the mockup still navigates, it just won't remember */
    }
  }

  function lastOf(type) {
    const log = readLog();
    for (let i = log.length - 1; i >= 0; i -= 1) {
      if (log[i].type === type) return log[i];
    }
    return null;
  }

  function todayTotal(type) {
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    return readLog()
      .filter((entry) => entry.type === type && entry.at >= midnight.getTime())
      .reduce((sum, entry) => sum + (entry.value || 0), 0);
  }

  /* ---------- formatting ---------- */

  function agoLabel(timestamp) {
    const secs = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
    if (secs < 60) return 'Just now';
    const mins = Math.floor(secs / 60);
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    return hrs + 'h ' + (mins % 60) + 'm ago';
  }

  function durationLabel(secs) {
    if (secs < 60) return secs + 's';
    const mins = Math.floor(secs / 60);
    if (mins < 60) return secs % 60 ? mins + 'm ' + (secs % 60) + 's' : mins + 'm';
    return Math.floor(mins / 60) + 'h ' + (mins % 60) + 'm';
  }

  function toast(message) {
    const screen = document.querySelector('.screen');
    if (!screen) return;
    const existing = screen.querySelector('.toast');
    if (existing) existing.remove();

    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    screen.appendChild(el);
    setTimeout(() => el.classList.add('is-out'), 1900);
    setTimeout(() => el.remove(), 2300);
  }

  /* ---------- quick action row: wheel, drag and arrow scrolling ---------- */

  function setUpQuickRow() {
    const row = document.querySelector('.quick-row');
    if (!row) return;

    const scroller = document.createElement('div');
    scroller.className = 'quick-scroller';
    row.parentNode.insertBefore(scroller, row);
    scroller.appendChild(row);
    scroller.insertAdjacentHTML(
      'beforeend',
      '<div class="quick-fade left"></div>' +
        '<div class="quick-fade right"></div>' +
        '<button class="quick-nav prev" type="button" aria-label="Scroll left">' +
        '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>' +
        '<button class="quick-nav next" type="button" aria-label="Scroll right">' +
        '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></button>'
    );

    const fadeLeft = scroller.querySelector('.quick-fade.left');
    const fadeRight = scroller.querySelector('.quick-fade.right');
    const prev = scroller.querySelector('.quick-nav.prev');
    const next = scroller.querySelector('.quick-nav.next');

    function update() {
      const max = row.scrollWidth - row.clientWidth;
      const atStart = row.scrollLeft <= 2;
      const atEnd = row.scrollLeft >= max - 2;
      fadeLeft.classList.toggle('is-visible', !atStart);
      prev.classList.toggle('is-visible', !atStart);
      fadeRight.classList.toggle('is-visible', max > 2 && !atEnd);
      next.classList.toggle('is-visible', max > 2 && !atEnd);
    }

    prev.addEventListener('click', () => row.scrollBy({ left: -190, behavior: 'smooth' }));
    next.addEventListener('click', () => row.scrollBy({ left: 190, behavior: 'smooth' }));
    row.addEventListener('scroll', update);
    window.addEventListener('resize', update);

    // A vertical mouse wheel over the row scrolls it sideways.
    row.addEventListener(
      'wheel',
      (event) => {
        const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
        if (!delta) return;
        event.preventDefault();
        row.scrollLeft += delta;
      },
      { passive: false }
    );

    // Click and drag, like swiping on a phone.
    let dragging = false;
    let startX = 0;
    let startLeft = 0;
    let moved = 0;

    row.addEventListener('dragstart', (event) => event.preventDefault());
    row.addEventListener('pointerdown', (event) => {
      dragging = true;
      moved = 0;
      startX = event.clientX;
      startLeft = row.scrollLeft;
      row.classList.add('is-dragging');
    });
    row.addEventListener('pointermove', (event) => {
      if (!dragging) return;
      const dx = event.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      row.scrollLeft = startLeft - dx;
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((name) =>
      row.addEventListener(name, () => {
        dragging = false;
        row.classList.remove('is-dragging');
      })
    );
    // Swallow the click that ends a drag so it doesn't open a screen.
    row.addEventListener(
      'click',
      (event) => {
        if (moved > 6) {
          event.preventDefault();
          event.stopPropagation();
          moved = 0;
        }
      },
      true
    );

    update();
  }

  /* ---------- shared controls ---------- */

  const timers = [];
  const changeHooks = [];

  function notifyChange() {
    changeHooks.forEach((hook) => hook());
  }

  // Choice groups: pill rows on the log screens, the boy/girl toggle on Add baby.
  function setUpChoiceGroups() {
    document.querySelectorAll('.pill-row, .gender-toggle').forEach((row) => {
      const label = row.previousElementSibling;
      const optional = !!label && /optional/i.test(label.textContent);

      row.addEventListener('click', (event) => {
        const option = event.target.closest('.pill, .gender-option');
        if (!option || !row.contains(option)) return;
        const wasSelected = option.classList.contains('is-selected');
        row
          .querySelectorAll('.pill, .gender-option')
          .forEach((other) => other.classList.remove('is-selected'));
        if (!(optional && wasSelected)) option.classList.add('is-selected');

        // Boy / girl retints the screen.
        if (option.dataset.theme) {
          const screen = document.querySelector('.screen');
          screen.classList.remove('is-boy', 'is-girl');
          screen.classList.add('is-' + option.dataset.theme);
        }
        notifyChange();
      });
    });
  }

  // Growth chart tabs: the segmented bar swaps the chart and highlights its metric card.
  function setUpSegments() {
    const bar = document.querySelector('.segmented');
    if (!bar) return;

    bar.addEventListener('click', (event) => {
      const segment = event.target.closest('.segment');
      if (!segment || !segment.dataset.panel) return;
      const key = segment.dataset.panel;

      bar.querySelectorAll('.segment').forEach((other) => other.classList.remove('is-active'));
      segment.classList.add('is-active');
      document.querySelectorAll('.card [data-panel]').forEach((panel) => {
        panel.classList.toggle('is-hidden', panel.dataset.panel !== key);
      });
      document.querySelectorAll('.metric-card').forEach((card) => {
        card.classList.toggle('is-active', card.dataset.metric === key);
      });
    });
  }

  // Switches, tap-to-explain rows and the name character counter.
  function setUpExtras() {
    document.querySelectorAll('.switch').forEach((sw) => {
      sw.addEventListener('click', () => {
        sw.classList.toggle('is-on');
        // An immunisation row follows its switch, revealing the date field.
        const row = sw.closest('.vax-row');
        if (row) row.classList.toggle('is-given', sw.classList.contains('is-on'));
      });
    });

    document.querySelectorAll('[data-toast]').forEach((el) => {
      el.addEventListener('click', () => toast(el.dataset.toast));
    });

    const counted = document.querySelector('[data-count-input]');
    const counter = document.querySelector('[data-count]');
    if (counted && counter) {
      counted.addEventListener('input', () => {
        counter.textContent = counted.value.length;
      });
    }
  }

  // A footer button that stays disabled until its gating field is filled in.
  function setUpGatedButton() {
    const gate = document.querySelector('[data-gate]');
    const button = document.querySelector('.screen-footer .btn-primary');
    if (!gate || !button) return;

    function refresh() {
      button.classList.toggle('is-disabled', !gate.value.trim());
    }

    gate.addEventListener('input', refresh);
    button.addEventListener('click', (event) => {
      if (!button.classList.contains('is-disabled')) return;
      event.preventDefault();
      toast(button.dataset.gateHint || 'Fill in the details first.');
    });
    refresh();
  }

  function screenType() {
    const heading = document.querySelector('.detail-heading');
    if (!heading) return null;
    // "Bottle feed" -> bottle, "Diaper change" -> diaper
    return heading.textContent.trim().split(/\s+/)[0].toLowerCase();
  }

  // A stepper's value lives in a span (whole numbers) or an editable input (decimals).
  function readStep(stepper) {
    const out = stepper.querySelector('.step-number');
    if (!out) return 0;
    const raw = out.tagName === 'INPUT' ? out.value : out.textContent;
    return Number(String(raw).trim()) || 0;
  }

  function writeStep(stepper, value) {
    const out = stepper.querySelector('.step-number');
    if (!out) return;
    const decimals = (String(stepper.dataset.step || '').split('.')[1] || '').length;
    const text = value.toFixed(decimals);
    if (out.tagName === 'INPUT') out.value = text;
    else out.textContent = text;
  }

  function stepperValue() {
    const first = document.querySelector('.stepper');
    return first ? readStep(first) : 0;
  }

  function anyStepperValue() {
    return Array.from(document.querySelectorAll('.stepper')).some((stepper) => readStep(stepper) > 0);
  }

  function timerTotal() {
    return timers.reduce((sum, timer) => sum + timer.seconds, 0);
  }

  function filledInputs() {
    return Array.from(document.querySelectorAll('.input, .textarea')).filter(
      (el) => el.value.trim() && el.value.trim() !== el.dataset.initial
    );
  }

  function selectedPills() {
    return Array.from(document.querySelectorAll('.pill-row .pill.is-selected')).map((pill) =>
      pill.textContent.trim()
    );
  }

  function setUpSteppers() {
    document.querySelectorAll('.stepper').forEach((stepper) => {
      const out = stepper.querySelector('.step-number');
      if (!out) return;
      const step = Number(stepper.dataset.step) || 10;
      const max = Number(stepper.dataset.max) || 500;

      stepper.querySelectorAll('.step-btn').forEach((btn) => {
        const direction = btn.textContent.trim() === '+' ? 1 : -1;
        btn.addEventListener('click', () => {
          const next = readStep(stepper) + direction * step;
          writeStep(stepper, Math.min(max, Math.max(0, next)));
          notifyChange();
        });
      });

      // Typed values are accepted as-is, then tidied up and clamped on the way out.
      if (out.tagName === 'INPUT') {
        out.addEventListener('input', notifyChange);
        out.addEventListener('blur', () => {
          writeStep(stepper, Math.min(max, Math.max(0, readStep(stepper))));
          notifyChange();
        });
      }
    });
  }

  function paintTimers() {
    timers.forEach((timer) => {
      if (timer.output) timer.output.textContent = durationLabel(timer.seconds);
    });
    const total = document.querySelector('.duration-total');
    if (!total) return;
    const value = durationLabel(timerTotal());
    total.textContent = total.dataset.prefix ? total.dataset.prefix + ' ' + value : value;
  }

  function setUpTimers() {
    const buttons = Array.from(document.querySelectorAll('.card .pill')).filter(
      (btn) => !btn.closest('.pill-row') && /resume|start/i.test(btn.textContent)
    );
    if (!buttons.length) return;

    const total = document.querySelector('.duration-total');
    if (total && total.textContent.includes(':')) {
      total.dataset.prefix = total.textContent.split(':')[0] + ':';
    }

    buttons.forEach((button) => {
      const column = button.closest('.timer-col');
      const idle = button.textContent.trim();
      const timer = {
        seconds: 0,
        running: false,
        button: button,
        output: column ? column.querySelector('.timer-value') : null,
        idle: idle,
        active: idle.replace(/Resume/i, 'Pause').replace(/Start/i, 'Stop'),
      };
      timers.push(timer);

      button.addEventListener('click', () => {
        const starting = !timer.running;
        // Only one side runs at a time, as in the app.
        timers.forEach((other) => {
          other.running = false;
          other.button.textContent = other.idle;
          other.button.classList.remove('is-running');
        });
        if (starting) {
          timer.running = true;
          button.textContent = timer.active;
          button.classList.add('is-running');
        }
        notifyChange();
      });
    });

    setInterval(() => {
      const running = timers.filter((timer) => timer.running);
      if (!running.length) return;
      running.forEach((timer) => {
        timer.seconds += 1;
      });
      paintTimers();
      notifyChange();
    }, 1000);

    paintTimers();
  }

  const SAVE_HINTS = {
    breastfeed: 'Start a timer to log a feed.',
    sleep: 'Start the timer to log sleep.',
    bottle: 'Set an amount first.',
    pumping: 'Set an amount first.',
  };

  function summaryFor(type) {
    const pills = selectedPills();

    if (type === 'breastfeed') {
      const left = timers[0] ? timers[0].seconds : 0;
      const right = timers[1] ? timers[1].seconds : 0;
      const side = left && right ? 'Both' : right ? 'Right' : 'Left';
      return { summary: side + ' · ' + durationLabel(left + right) };
    }
    if (type === 'bottle') {
      const ml = stepperValue();
      return { summary: pills.length ? ml + ' ml · ' + pills[0] : ml + ' ml', value: ml };
    }
    if (type === 'pumping') {
      const ml = stepperValue();
      return { summary: pills.length ? pills[0] + ' · ' + ml + ' ml' : ml + ' ml', value: ml };
    }
    if (type === 'diaper') {
      return { summary: pills[0] || 'Wet' };
    }
    if (type === 'sleep') {
      const slept = timers[0] ? timers[0].seconds : 0;
      return { summary: (pills[0] || 'Nap') + ' · ' + durationLabel(slept) };
    }
    if (type === 'growth') {
      const parts = [];
      document.querySelectorAll('.stepper').forEach((stepper) => {
        const value = readStep(stepper);
        const unit = stepper.querySelector('.step-unit');
        if (value > 0) parts.push(value + (unit ? ' ' + unit.textContent.trim() : ''));
      });
      return { summary: parts.join(' · ') };
    }
    const first = filledInputs()[0];
    return { summary: first ? first.value.trim() : 'Logged' };
  }

  function setUpLogScreen() {
    const type = screenType();
    if (!type) return;

    document.querySelectorAll('.input, .textarea').forEach((el) => {
      el.dataset.initial = el.value.trim();
    });

    const saveBtn = document.querySelector('.screen-footer .btn-primary');
    const alwaysReady = saveBtn && !saveBtn.classList.contains('is-disabled');

    function hasData() {
      return anyStepperValue() || timerTotal() > 0 || filledInputs().length > 0;
    }

    function refreshSave() {
      if (!saveBtn || alwaysReady) return;
      saveBtn.classList.toggle('is-disabled', !hasData());
    }

    changeHooks.push(refreshSave);
    document.querySelectorAll('.input, .textarea').forEach((el) => {
      el.addEventListener('input', notifyChange);
    });

    // Show when this activity was really last logged in the demo.
    const lastLine = document.querySelector('.detail-last');
    const previous = lastOf(type);
    if (lastLine && previous) lastLine.textContent = 'Last: ' + agoLabel(previous.at);

    if (saveBtn) {
      saveBtn.addEventListener('click', (event) => {
        event.preventDefault();
        if (saveBtn.classList.contains('is-disabled')) {
          toast(SAVE_HINTS[type] || 'Fill in the details first.');
          return;
        }
        const built = summaryFor(type);
        writeEntry({ type: type, at: Date.now(), summary: built.summary, value: built.value || 0 });
        location.href = 'home.html?saved=' + type;
      });
    }

    refreshSave();
  }

  /* ---------- Today screen ---------- */

  function setUpHome() {
    if (!document.querySelector('.quick-row')) return;

    document.querySelectorAll('[data-last]').forEach((el) => {
      const entry = lastOf(el.dataset.last);
      if (entry) el.textContent = agoLabel(entry.at);
    });
    document.querySelectorAll('[data-last-detail]').forEach((el) => {
      const entry = lastOf(el.dataset.lastDetail);
      if (entry && entry.summary) el.textContent = entry.summary;
    });

    const bottleTotal = document.querySelector('[data-total="bottle"]');
    if (bottleTotal) {
      const ml = todayTotal('bottle');
      if (ml) bottleTotal.textContent = ml + ' ml';
    }

    const reset = document.querySelector('[data-reset]');
    if (reset) {
      reset.addEventListener('click', (event) => {
        event.preventDefault();
        localStorage.removeItem(STORE_KEY);
        location.href = 'home.html';
      });
    }

    const saved = new URLSearchParams(location.search).get('saved');
    if (saved) {
      toast(saved.charAt(0).toUpperCase() + saved.slice(1) + ' saved');
      history.replaceState(null, '', 'home.html');
    }
  }

  setUpQuickRow();
  setUpLogScreen();
  setUpGatedButton();
  setUpHome();
  setUpChoiceGroups();
  setUpSegments();
  setUpSteppers();
  setUpTimers();
  setUpExtras();
  notifyChange();
})();
