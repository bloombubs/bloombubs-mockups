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

  function saveLog(log) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(log.slice(-200)));
    } catch (err) {
      /* private mode — the mockup still navigates, it just won't remember */
    }
  }

  function replaceEntry(id, changes) {
    const log = readLog();
    const index = log.findIndex((entry) => String(entry.at) === String(id));
    if (index === -1) return;
    log[index] = Object.assign({}, log[index], changes);
    saveLog(log);
  }

  function removeEntry(id) {
    saveLog(readLog().filter((entry) => String(entry.at) !== String(id)));
  }

  // The entry the current log screen is editing, if it was opened from a
  // tap on the Today list.
  function editingEntry() {
    const id = new URLSearchParams(location.search).get('edit');
    if (!id) return null;
    return readLog().filter((entry) => String(entry.at) === id)[0] || null;
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

  function durationSeconds(text) {
    const hours = /(\d+)h/.exec(text);
    const mins = /(\d+)m(?!l)/.exec(text);
    const secs = /(\d+)s/.exec(text);
    return (hours ? +hours[1] * 3600 : 0) + (mins ? +mins[1] * 60 : 0) + (secs ? +secs[1] : 0);
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
  // Work that has to wait until the controls on the page have been wired up.
  const afterSetup = [];

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

  // Put a saved entry back into the controls so it can be changed.
  function prefill(type, entry) {
    const summary = entry.summary || '';
    const steppers = Array.from(document.querySelectorAll('.stepper'));

    if (type === 'growth') {
      summary.split('·').forEach((part) => {
        const amount = parseFloat(part);
        const unit = part.replace(/[\d.\s]/g, '');
        const target = steppers.filter(
          (stepper) => (stepper.querySelector('.step-unit') || {}).textContent === unit && readStep(stepper) === 0
        )[0];
        if (target && !isNaN(amount)) writeStep(target, amount);
      });
    } else if (steppers.length && entry.value) {
      writeStep(steppers[0], entry.value);
    }

    document.querySelectorAll('.pill-row').forEach((row) => {
      row.querySelectorAll('.pill').forEach((pill) => {
        if (summary.indexOf(pill.textContent.trim()) === -1) return;
        row.querySelectorAll('.pill').forEach((other) => other.classList.remove('is-selected'));
        pill.classList.add('is-selected');
      });
    });

    const seconds = durationSeconds(summary);
    if (seconds && timers.length) {
      const onRight = timers.length > 1 && /right/i.test(summary) && !/both/i.test(summary);
      if (/both/i.test(summary) && timers.length > 1) {
        timers[0].seconds = Math.round(seconds / 2);
        timers[1].seconds = seconds - timers[0].seconds;
      } else {
        timers[onRight ? 1 : 0].seconds = seconds;
      }
      paintTimers();
    }

    if (!steppers.length && !timers.length) {
      const field = Array.from(document.querySelectorAll('.input, .textarea')).filter((el) => !el.value)[0];
      if (field) field.value = summary;
    }
  }

  function setUpEditing(type, entry, saveBtn) {
    const lastLine = document.querySelector('.detail-last');
    if (lastLine) lastLine.textContent = 'Editing entry from ' + clockLabel(entry.at);

    if (saveBtn && saveBtn.firstChild && saveBtn.firstChild.nodeType === 3) {
      saveBtn.firstChild.textContent = '\n      Update\n      ';
    }

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'delete-entry';
    remove.textContent = 'Delete this entry';
    remove.addEventListener('click', () => {
      removeEntry(entry.at);
      location.href = 'home.html?deleted=' + type;
    });
    const body = document.querySelector('.screen-body');
    if (body) body.appendChild(remove);
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

    const editing = editingEntry();
    if (editing) {
      // The timers do not exist yet, so filling the controls waits its turn.
      afterSetup.push(() => prefill(type, editing));
      setUpEditing(type, editing, saveBtn);
    } else {
      // Show when this activity was really last logged in the demo.
      const lastLine = document.querySelector('.detail-last');
      const previous = lastOf(type);
      if (lastLine && previous) lastLine.textContent = 'Last: ' + agoLabel(previous.at);
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', (event) => {
        event.preventDefault();
        if (saveBtn.classList.contains('is-disabled')) {
          toast(SAVE_HINTS[type] || 'Fill in the details first.');
          return;
        }
        const built = summaryFor(type);
        if (editing) {
          replaceEntry(editing.at, { summary: built.summary, value: built.value || 0 });
          location.href = 'home.html?updated=' + type;
          return;
        }
        writeEntry({ type: type, at: Date.now(), summary: built.summary, value: built.value || 0 });
        location.href = 'home.html?saved=' + type;
      });
    }

    refreshSave();
  }

  /* ---------- Today screen ---------- */

  function entriesToday() {
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    return readLog().filter((entry) => entry.at >= midnight.getTime());
  }

  // The quick action row already carries an icon and colour per activity, so the
  // timeline and lists borrow them instead of repeating the markup.
  function activityVisuals() {
    const visuals = {};
    document.querySelectorAll('.quick').forEach((link) => {
      const key = (link.getAttribute('href') || '').replace('log-', '').replace('.html', '');
      const circle = link.querySelector('.quick-circle');
      if (!circle) return;
      const style = circle.getAttribute('style') || '';
      visuals[key] = {
        style: style,
        colour: (style.match(/color:\s*([^;]+)/) || [])[1] || 'var(--primary)',
        icon: circle.innerHTML,
        label: link.querySelector('.quick-label').textContent.trim(),
      };
    });
    return visuals;
  }

  function dayPercent(timestamp) {
    const when = new Date(timestamp);
    return ((when.getHours() * 60 + when.getMinutes()) / 1440) * 100;
  }

  function clockLabel(timestamp) {
    const when = new Date(timestamp);
    return String(when.getHours()).padStart(2, '0') + ':' + String(when.getMinutes()).padStart(2, '0');
  }

  // Redraw the timeline, the day summary and the entry list from what has been logged.
  function paintDay() {
    const entries = entriesToday();
    // With nothing logged the screen keeps its sample day, which is a coherent
    // snapshot — the live "now" line would not line up with it.
    if (!entries.length) return;

    const track = document.querySelector('.tl-track');
    const now = document.querySelector('.tl-now');
    if (now) now.style.left = dayPercent(Date.now()) + '%';

    const visuals = activityVisuals();

    if (track) {
      track.querySelectorAll('.tl-mark').forEach((mark) => mark.remove());
      track.querySelectorAll('.tl-span').forEach((span) => span.remove());
      entries.forEach((entry) => {
        const colour = (visuals[entry.type] || {}).colour || 'var(--primary)';
        const label = (visuals[entry.type] || {}).label || entry.type;
        const slept = entry.type === 'sleep' ? durationSeconds(entry.summary || '') : 0;

        // Sleep covers a stretch of the day, everything else is a moment.
        if (slept > 0) {
          const span = document.createElement('span');
          span.className = 'tl-span';
          span.style.left = dayPercent(entry.at - slept * 1000) + '%';
          span.style.width = (slept / 86400) * 100 + '%';
          span.style.background = colour;
          span.title = label;
          track.insertBefore(span, now);
          return;
        }

        const mark = document.createElement('span');
        mark.className = 'tl-mark';
        mark.style.left = dayPercent(entry.at) + '%';
        mark.style.background = colour;
        mark.title = label;
        track.insertBefore(mark, now);
      });
    }

    const summary = document.querySelector('[data-summary]');
    if (summary) {
      const grouped = {};
      entries.forEach((entry) => {
        if (!grouped[entry.type]) grouped[entry.type] = { count: 0, details: [] };
        grouped[entry.type].count += 1;
        if (entry.summary) grouped[entry.type].details.push(entry.summary);
      });
      summary.innerHTML = Object.keys(grouped)
        .map((type) => {
          const visual = visuals[type] || { style: '', icon: '' };
          const group = grouped[type];
          return (
            '<div class="summary-row">' +
            '<span class="summary-dot" style="' + visual.style + '">' + visual.icon + '</span>' +
            '<span class="summary-count">' + group.count + '</span>' +
            '<span class="summary-detail">' + (group.details.join(' · ') || visual.label || type) + '</span>' +
            '</div>'
          );
        })
        .join('');
    }

    const list = document.querySelector('[data-entries]');
    if (list) {
      const chevron =
        '<svg class="entry-chevron" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" ' +
        'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';
      list.innerHTML = entries
        .slice()
        .reverse()
        .slice(0, 8)
        .map((entry) => {
          const visual = visuals[entry.type] || { style: '', icon: '', label: entry.type };
          // Tapping an entry reopens its log screen with the values filled in.
          return (
            '<a class="entry" href="log-' + entry.type + '.html?edit=' + entry.at + '">' +
            '<span class="entry-icon" style="' + visual.style + '">' + visual.icon + '</span>' +
            '<span class="entry-main">' +
            '<span class="entry-time">' + clockLabel(entry.at) + '</span>' +
            '<span class="entry-detail">' + (entry.summary || visual.label) + '</span>' +
            '</span>' +
            chevron +
            '</a>'
          );
        })
        .join('');
    }
  }

  // A day's worth of sample entries, so the Today list is populated — and every
  // entry on it opens for editing — before anything has been logged by hand.
  function seedSampleDay() {
    const minute = 60000;
    const now = Date.now();
    saveLog([
      { type: 'sleep', at: now - 480 * minute, summary: 'Night · 5h 30m', value: 0 },
      { type: 'breastfeed', at: now - 180 * minute, summary: 'Left · 12m', value: 0 },
      { type: 'diaper', at: now - 150 * minute, summary: 'Wet', value: 0 },
      { type: 'bottle', at: now - 90 * minute, summary: '15 ml · Formula', value: 15 },
      { type: 'breastfeed', at: now - 25 * minute, summary: 'Right · 8m', value: 0 },
    ]);
  }

  function setUpHome() {
    if (!document.querySelector('.quick-row')) return;

    if (!readLog().length) seedSampleDay();

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

    paintDay();

    const params = new URLSearchParams(location.search);
    ['saved', 'updated', 'deleted'].forEach((action) => {
      const type = params.get(action);
      if (!type) return;
      toast(type.charAt(0).toUpperCase() + type.slice(1) + ' ' + action);
      history.replaceState(null, '', 'home.html');
    });
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
  afterSetup.forEach((task) => task());
  notifyChange();
})();
