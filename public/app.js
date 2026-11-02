import {
  DAYS, DAY_NAMES, dayKey, isoDate, parseIso, addDays, mondayOf, minutes, formatTime,
  classById, timeline, periodBlock, locate, meetingsLabel, nextMeeting, inkOn,
} from './schedule.js';

const root = document.getElementById('root');
let state = null;

// ?now=2026-11-02T11:00 pins the clock, for checking the now/next logic.
const pinned = new URLSearchParams(location.search).get('now');
const clock = () => (pinned ? new Date(pinned) : new Date());

/* ---------- helpers ---------- */

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const ICONS = {
  today: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  week: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  classes: '<path d="M4 19.5V5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2Zm0 0A2 2 0 0 0 6 22h13"/><path d="M9 7h6"/>',
  settings: '<path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  note: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
  out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
};
const icon = (name, label) =>
  `<svg class="icon" viewBox="0 0 24 24" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}>${ICONS[name]}</svg>`;

const longDate = (d) => d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
const shortDate = (d) => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
const range = (b) => `${formatTime(b.start)}–${formatTime(b.end)}`;
const colourVars = (cls) => (cls ? `--c:${cls.color};--on:${inkOn(cls.color)}` : '');

class ApiError extends Error {}

async function api(path, opts = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: opts.body ? { 'Content-Type': 'application/json' } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: 'same-origin',
    keepalive: opts.keepalive,
  });
  if (res.status === 401 && path !== '/api/login') {
    showLogin();
    throw new ApiError('signed out');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || 'Something went wrong.');
  return data;
}

/* ---------- autosaving editors ---------- */

const pending = new Set();

// Binds a textarea to a save function: debounced, retried, and flushed when
// the page is hidden so a note is never lost between bells.
function autosave(textarea, statusEl, save) {
  let timer = null;
  let retry = null;
  let lastSaved = textarea.value;
  const set = (text, cls = '') => { statusEl.textContent = text; statusEl.className = `status ${cls}`; };

  const run = async (keepalive = false) => {
    clearTimeout(timer);
    const value = textarea.value;
    if (value === lastSaved) { pending.delete(job); return; }
    set('Saving…');
    try {
      await save(value, keepalive);
      lastSaved = value;
      pending.delete(job);
      if (textarea.value === value) {
        set(`Saved ${new Date().toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' })}`, 'ok');
      }
    } catch (e) {
      if (e.message === 'signed out') return;
      set("Couldn't save. Retrying…", 'err');
      clearTimeout(retry);
      retry = setTimeout(run, 4000);
    }
  };
  const job = { flush: () => run(true) };

  textarea.addEventListener('input', () => {
    pending.add(job);
    set('Editing…');
    clearTimeout(timer);
    timer = setTimeout(run, 600);
  });
  textarea.addEventListener('blur', () => run());
}

const flushAll = () => pending.forEach((j) => j.flush());
addEventListener('pagehide', flushAll);
document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && flushAll());

const saveLesson = (date, period, classId) => (body, keepalive) =>
  api(`/api/lessons/${date}/${period}`, { method: 'PUT', body: { body, classId }, keepalive });
const saveClassNote = (classId) => (body, keepalive) =>
  api(`/api/classes/${classId}/note`, { method: 'PUT', body: { body }, keepalive });

/* ---------- shell ---------- */

function shell(active, content) {
  const tab = (name, href, label) =>
    `<a class="tab" href="${href}" ${active === name ? 'aria-current="page"' : ''}>${icon(name)}<span>${label}</span></a>`;
  root.innerHTML = `
    <div class="app">
      <nav class="rail" aria-label="Main">
        <a class="mark" href="#/today" aria-label="Harris timetable, today">H</a>
        ${tab('today', '#/today', 'Today')}
        ${tab('week', '#/week', 'Week')}
        ${tab('classes', '#/classes', 'Classes')}
        ${tab('settings', '#/settings', 'Settings')}
        <span class="spacer"></span>
        <a class="tab signout" href="#/signout">${icon('out')}<span>Sign out</span></a>
      </nav>
      <main id="main">${content}</main>
    </div>`;
}

/* ---------- lesson panel (shared by Today and Week) ---------- */

async function lessonPanel(date, period, { closeHref } = {}) {
  const d = parseIso(date);
  const day = dayKey(d);
  const block = day && periodBlock(state, day, period);
  if (!block) return '<p class="empty">No lesson at that time.</p>';
  const cls = classById(state, block.classId);
  const [notes, classNote, history] = await Promise.all([
    api(`/api/lessons?from=${date}&to=${date}`),
    cls ? api(`/api/classes/${cls.id}/note`) : null,
    cls ? api(`/api/classes/${cls.id}/lessons`) : [],
  ]);
  const mine = notes.find((n) => n.period === period);
  const earlier = history.filter((n) => n.date < date || (n.date === date && n.period < period)).slice(0, 3);
  const title = cls ? esc(cls.code) : 'Free period';

  return `
    <aside class="panel" aria-label="Lesson">
      ${closeHref ? `<a class="btn back" href="${closeHref}">${icon('left')}Back to week</a>` : ''}
      <div class="panel-head">
        <div>
          <h2 class="code ${cls ? 'tabbed' : ''}" style="${colourVars(cls)}">${title}</h2>
          <p class="meta">${longDate(d)} · Period ${period} · ${range(block)}</p>
          ${cls ? `<p class="meta">Meets ${esc(meetingsLabel(state, cls.id))} · <a href="#/class/${cls.id}">Open class</a></p>` : ''}
        </div>
        ${closeHref ? `<a class="btn icon-only" href="${closeHref}">${icon('close', 'Close lesson')}</a>` : ''}
      </div>
      <div class="field">
        <h3><label for="lesson-note">This lesson</label><span class="status" id="lesson-status"></span></h3>
        <textarea class="note" id="lesson-note" data-date="${date}" data-period="${period}" data-class="${cls?.id ?? ''}"
          placeholder="${cls ? 'Plan, what you covered, homework set' : 'Marking, cover, reminders'}">${esc(mine?.body)}</textarea>
      </div>
      ${cls ? `
      <div class="field">
        <h3><label for="class-note">Class note</label><span class="status" id="class-status"></span></h3>
        <textarea class="note short" id="class-note" data-class="${cls.id}"
          placeholder="Seating plan, targets, reminders for every ${esc(cls.code)} lesson">${esc(classNote?.body)}</textarea>
      </div>
      <div class="field">
        <h3>Earlier lessons</h3>
        ${earlier.length ? `<ul class="log">${earlier.map(logItem).join('')}</ul>` : '<p class="empty">Notes from earlier lessons with this class show up here.</p>'}
      </div>` : ''}
    </aside>`;
}

function bindPanel() {
  const ln = document.getElementById('lesson-note');
  if (ln) autosave(ln, document.getElementById('lesson-status'), saveLesson(ln.dataset.date, Number(ln.dataset.period), ln.dataset.class || null));
  const cn = document.getElementById('class-note');
  if (cn) autosave(cn, document.getElementById('class-status'), saveClassNote(cn.dataset.class));
}

function logItem(n) {
  const d = parseIso(n.date);
  return `<li><a href="#/week/${isoDate(mondayOf(d))}/${n.date}/${n.period}">
    <span class="when">${shortDate(d)} · P${n.period}</span>
    <span class="body">${esc(n.body)}</span></a></li>`;
}

/* ---------- Today ---------- */

async function viewToday(dateParam) {
  const now = clock();
  const here = locate(state, now);
  const showing = dateParam ? parseIso(dateParam) : parseIso(here.date);
  const date = isoDate(showing);
  const day = dayKey(showing);
  const live = date === here.date;
  const prev = isoDate(stepSchoolDay(showing, -1));
  const next = isoDate(stepSchoolDay(showing, 1));

  const head = `
    <header class="view-head">
      <div>
        <h1>${longDate(showing)}</h1>
        <p class="sub">${dayLabel(day)}${live && !here.isToday ? ' · next school day' : ''}</p>
      </div>
      <div class="pager">
        <a class="btn icon-only" href="#/today/${prev}">${icon('left', 'Previous school day')}</a>
        ${dateParam ? '<a class="btn" href="#/today">Today</a>' : ''}
        <a class="btn icon-only" href="#/today/${next}">${icon('right', 'Next school day')}</a>
      </div>
    </header>`;

  if (!day) {
    shell('today', `<div class="view">${head}<p class="empty">No school on weekends.</p></div>`);
    return;
  }

  const blocks = timeline(state, day);
  const notes = await api(`/api/lessons?from=${date}&to=${date}`);
  const t = now.getHours() * 60 + now.getMinutes();
  const isNowDay = live && here.isToday;

  // The focus lesson: the one in progress, else the next one, else the first.
  const current = isNowDay ? here.current : null;
  const upcoming = isNowDay ? here.next : (live ? here.next : null);
  let focus = current?.kind === 'period' ? current : upcoming;
  if (!focus) focus = blocks.find((b) => b.kind === 'period');
  const fcls = classById(state, focus.classId);

  let stateLine;
  if (current?.kind === 'period') stateLine = `<strong>Now</strong> · ${here.minutesLeft} min left`;
  else if (current?.kind === 'break') stateLine = `<strong>${esc(current.label)}</strong> until ${formatTime(current.end)} · then`;
  else if (isNowDay || (live && !here.isToday)) stateLine = '<strong>Next</strong>';
  else stateLine = 'First lesson';

  const classNote = fcls ? await api(`/api/classes/${fcls.id}/note`) : null;
  const card = `
    <section class="nowcard ${fcls ? 'tabbed' : ''}" style="${colourVars(fcls)}" aria-label="Current lesson">
      ${isNowDay || (live && !here.isToday) ? '<span class="ribbon-mark" aria-hidden="true"></span>' : ''}
      <p class="state">${stateLine}</p>
      <h2 class="code">${fcls ? esc(fcls.code) : 'Free'}</h2>
      <p class="when">Period ${focus.period} · ${range(focus)}${fcls ? ` · ${esc(meetingsLabel(state, fcls.id))}` : ''}</p>
      ${classNote?.body ? `<p class="classnote">${esc(classNote.body)}</p>` : ''}
    </section>`;

  const rows = blocks.map((b) => {
    if (b.kind === 'break') {
      return `<div class="row brk"><span></span><span class="t">${formatTime(b.start)}</span><span>${esc(b.label)}</span></div>`;
    }
    const cls = classById(state, b.classId);
    const past = isNowDay && minutes(b.end) <= t;
    const isCur = isNowDay && current?.kind === 'period' && current.period === b.period;
    const isNext = Boolean(upcoming) && upcoming.period === b.period;
    const flagged = notes.some((n) => n.period === b.period);
    const href = `#/week/${isoDate(mondayOf(showing))}/${date}/${b.period}`;
    return `<a class="row ${cls ? 'tabbed' : 'free'} ${past ? 'past' : ''} ${isCur ? 'current' : ''} ${isNext && !isCur ? 'next' : ''}"
      style="${colourVars(cls)}" href="${href}">
      <span class="p">${b.period}</span>
      <span class="t">${formatTime(b.start)}<span class="end">–${formatTime(b.end)}</span></span>
      <span class="code">${cls ? esc(cls.code) : 'Free'}${isNext && !isCur ? ' <span class="next-tag">Next</span>' : ''}</span>
      <span class="note-flag">${flagged ? icon('note', 'Has a note') : ''}</span></a>`;
  }).join('');

  const panel = await lessonPanel(date, focus.period);
  shell('today', `
    <div class="view">
      ${head}
      <div class="today">
        ${card}
        ${panel}
        <div class="dayline">${rows}</div>
      </div>
    </div>`);
  bindPanel();
}

function stepSchoolDay(d, dir) {
  let x = addDays(d, dir);
  while (!dayKey(x)) x = addDays(x, dir);
  return x;
}

function dayLabel(day) {
  if (!day) return '';
  const n = timeline(state, day).filter((b) => b.kind === 'period').length;
  return `${n}-period day · ends ${formatTime(timeline(state, day).at(-1).end)}`;
}

/* ---------- Week ---------- */

// Row tracks: header, then P1 g1 P2 g2 … P7. A break lands in the gap after
// the period before it, so each day's interval and lunch sit where they fall.
const periodRow = (p) => 2 + (p - 1) * 2;
const gapRow = (p) => 3 + (p - 1) * 2;

async function viewWeek(mondayParam, openDate, openPeriod) {
  const now = clock();
  const monday = mondayParam ? parseIso(mondayParam) : mondayOf(parseIso(locate(state, now).date));
  const dates = DAYS.map((_, i) => addDays(monday, i));
  const from = isoDate(dates[0]);
  const to = isoDate(dates[4]);
  const notes = await api(`/api/lessons?from=${from}&to=${to}`);
  const todayIso = isoDate(now);
  const t = now.getHours() * 60 + now.getMinutes();
  const open = openDate && openPeriod ? { date: openDate, period: Number(openPeriod) } : null;
  const weekHref = `#/week/${from}`;

  const maxP = Math.max(...DAYS.map((d) => timeline(state, d).filter((b) => b.kind === 'period').length));
  let html = '<div style="grid-row:1;grid-column:1"></div>';
  dates.forEach((d, i) => {
    const iso = isoDate(d);
    html += `<div class="dh ${iso === todayIso ? 'today' : ''}" style="grid-row:1;grid-column:${i + 2}">${d.toLocaleDateString('en-GB', { weekday: 'short' })}<small>${d.getDate()}</small></div>`;
  });
  for (let p = 1; p <= maxP; p++) {
    html += `<div class="idx" style="grid-row:${periodRow(p)};grid-column:1">${p}</div>`;
    if (p < maxP) html += `<div class="gap-idx" style="grid-row:${gapRow(p)};grid-column:1"></div>`;
  }

  let ribbon = '';
  dates.forEach((d, i) => {
    const iso = isoDate(d);
    const day = DAYS[i];
    const col = i + 2;
    const blocks = timeline(state, day);
    const periods = blocks.filter((b) => b.kind === 'period');
    const usedGaps = new Set();
    blocks.forEach((b, j) => {
      if (b.kind === 'break') {
        const before = blocks.slice(0, j).reverse().find((x) => x.kind === 'period');
        if (!before) return;
        usedGaps.add(before.period);
        html += `<div class="band" style="grid-row:${gapRow(before.period)};grid-column:${col}">${esc(b.label)} ${formatTime(b.start)}</div>`;
        return;
      }
      const cls = classById(state, b.classId);
      const selected = open && open.date === iso && open.period === b.period;
      const isNow = iso === todayIso && minutes(b.start) <= t && t < minutes(b.end);
      const flagged = notes.some((n) => n.date === iso && n.period === b.period);
      html += `<a class="cell ${cls ? 'tabbed' : 'free'} ${selected ? 'selected' : ''} ${isNow ? 'now' : ''} ${iso === todayIso ? 'today-col' : ''}"
        style="grid-row:${periodRow(b.period)};grid-column:${col};${colourVars(cls)}"
        href="${selected ? weekHref : `${weekHref}/${iso}/${b.period}`}" ${selected ? 'aria-current="true"' : ''}>
        ${flagged ? `<span class="has-note">${icon('note', 'Has a note')}</span>` : ''}
        <span class="t">${formatTime(b.start)}</span>
        <span class="code">${cls ? esc(cls.code) : 'Free'}</span></a>`;
    });
    for (let p = 1; p < maxP; p++) {
      if (!usedGaps.has(p)) html += `<div class="gap" style="grid-row:${gapRow(p)};grid-column:${col}"></div>`;
    }
    for (let p = periods.length + 1; p <= maxP; p++) {
      html += `<div class="cell none" style="grid-row:${periodRow(p)};grid-column:${col}"></div>`;
    }
    // Ribbon: from the day header down to whatever is happening now.
    if (iso === todayIso) {
      const cur = blocks.find((b) => minutes(b.start) <= t && t < minutes(b.end));
      if (cur) {
        let endRow;
        if (cur.kind === 'period') endRow = periodRow(cur.period) + 1;
        else {
          const before = blocks.slice(0, blocks.indexOf(cur)).reverse().find((x) => x.kind === 'period');
          endRow = before ? gapRow(before.period) + 1 : 2;
        }
        ribbon = `<span class="ribbon" aria-hidden="true" style="grid-row:1 / ${endRow};grid-column:${col}"></span>`;
      }
    }
  });

  const label = `${monday.getDate()} ${monday.toLocaleDateString('en-GB', { month: 'long' })}`;
  const thisMonday = isoDate(mondayOf(parseIso(locate(state, now).date)));
  const head = `
    <header class="view-head">
      <div><h1>Week of ${label}</h1><p class="sub">${shortDate(dates[0])} – ${shortDate(dates[4])}</p></div>
      <div class="pager">
        <a class="btn icon-only" href="#/week/${isoDate(addDays(monday, -7))}">${icon('left', 'Previous week')}</a>
        ${from !== thisMonday ? `<a class="btn" href="#/week/${thisMonday}">This week</a>` : ''}
        <a class="btn icon-only" href="#/week/${isoDate(addDays(monday, 7))}">${icon('right', 'Next week')}</a>
      </div>
    </header>`;

  const panel = open ? await lessonPanel(open.date, open.period, { closeHref: weekHref }) : '';
  shell('week', `
    <div class="view">
      ${head}
      <div class="week-layout ${open ? 'has-panel' : ''}">
        <div class="week ${open ? 'focus' : ''}" style="grid-template-rows:auto ${Array.from({ length: maxP * 2 - 1 }, (_, k) => (k % 2 ? 'auto' : 'minmax(82px, auto)')).join(' ')}">
          ${html}${ribbon}
        </div>
        ${panel}
      </div>
    </div>`);
  bindPanel();
  if (open && innerWidth <= 900) scrollTo(0, 0);
}

/* ---------- Classes ---------- */

async function viewClasses() {
  const notes = await Promise.all(state.classes.map((c) => api(`/api/classes/${c.id}/note`)));
  const items = state.classes.map((c, i) => `
    <li><a class="tabbed" style="${colourVars(c)}" href="#/class/${c.id}">
      <span class="code">${esc(c.code)}</span>
      <span class="meets">${esc(meetingsLabel(state, c.id) || 'Not on the timetable')}</span>
      <span class="excerpt">${esc(notes[i].body.split('\n')[0] || 'No class note yet')}</span>
    </a></li>`).join('');
  shell('classes', `
    <div class="view">
      <header class="view-head"><div><h1>Classes</h1><p class="sub">${state.classes.length} classes this session</p></div></header>
      <ul class="classes">${items}</ul>
    </div>`);
}

async function viewClass(id) {
  const cls = classById(state, id);
  if (!cls) return viewNotFound();
  const [note, lessons] = await Promise.all([api(`/api/classes/${id}/note`), api(`/api/classes/${id}/lessons`)]);
  const nm = nextMeeting(state, id, clock());
  shell('classes', `
    <div class="view">
      <header class="view-head">
        <div>
          <h1 class="code tabbed" style="${colourVars(cls)}">${esc(cls.code)}</h1>
          <p class="sub">Meets ${esc(meetingsLabel(state, id) || 'nowhere yet')}${cls.band === 'senior' ? ' · S4–S6 bell' : ' · S1–S3 bell'}</p>
        </div>
        ${nm ? `<a class="btn" href="#/week/${isoDate(mondayOf(parseIso(nm.date)))}/${nm.date}/${nm.block.period}">Next: ${shortDate(parseIso(nm.date))} P${nm.block.period}</a>` : ''}
      </header>
      <div class="classpage">
        <div class="field">
          <h3><label for="class-note">Class note</label><span class="status" id="class-status"></span></h3>
          <textarea class="note" id="class-note" data-class="${id}" placeholder="Seating plan, targets, assessment dates, reminders">${esc(note.body)}</textarea>
        </div>
        <div class="field">
          <h3>Lesson log</h3>
          ${lessons.length ? `<ul class="log">${lessons.map(logItem).join('')}</ul>` : '<p class="empty">Notes you write on a lesson with this class show up here, newest first.</p>'}
        </div>
      </div>
    </div>`);
  bindPanel();
}

/* ---------- Settings ---------- */

function viewSettings() {
  const bells = structuredClone(state.bells);
  const typeName = { long: '7-period day', short: '6-period day' };
  const bandName = { bge: 'S1–S3', senior: 'S4–S6' };
  const bellTable = (type, band) => `
    <div>
      <h3>${typeName[type]}, ${bandName[band]}</h3>
      <table><tbody>
        ${bells.dayTypes[type][band].map((b, i) => `
          <tr><th scope="row">${b.kind === 'period' ? `Period ${b.period}` : esc(b.label)}</th>
          <td><input type="time" aria-label="Start" data-type="${type}" data-band="${band}" data-i="${i}" data-k="start" value="${b.start}"></td>
          <td><input type="time" aria-label="End" data-type="${type}" data-band="${band}" data-i="${i}" data-k="end" value="${b.end}"></td></tr>`).join('')}
      </tbody></table>
    </div>`;
  const options = (selected) => `<option value="">Free</option>${state.classes.map((c) => `<option value="${c.id}" ${c.id === selected ? 'selected' : ''}>${esc(c.code)}</option>`).join('')}`;

  shell('settings', `
    <div class="view">
      <header class="view-head"><div><h1>Settings</h1><p class="sub">Bell times, timetable, classes and backups</p></div></header>
      <div class="settings">
        <section>
          <h2>Bell times</h2>
          <p>Choose which weekdays run seven periods, then adjust times if the school changes them.</p>
          <div class="weekdays">
            ${DAYS.map((d) => `<label>${DAY_NAMES[d]}<select data-weekday="${d}">
              <option value="long" ${bells.weekdays[d] === 'long' ? 'selected' : ''}>7 periods</option>
              <option value="short" ${bells.weekdays[d] === 'short' ? 'selected' : ''}>6 periods</option></select></label>`).join('')}
          </div>
          <div class="bells">${['long', 'short'].map((t) => ['bge', 'senior'].map((b) => bellTable(t, b)).join('')).join('')}</div>
          <div class="actions"><button class="btn primary" id="save-bells">Save bell times</button><span class="status" id="bells-status"></span></div>
        </section>
        <section>
          <h2>Timetable</h2>
          <p>Which class you teach each period.</p>
          <div class="scroll-x"><table class="slotgrid">
            <thead><tr><th></th>${DAYS.map((d) => `<th>${DAY_NAMES[d].slice(0, 3)}</th>`).join('')}</tr></thead>
            <tbody>${[1, 2, 3, 4, 5, 6, 7].map((p) => `<tr><th scope="row">P${p}</th>${DAYS.map((d) =>
              `<td><select aria-label="${DAY_NAMES[d]} period ${p}" data-day="${d}" data-p="${p}">${options(state.slots[d][p - 1])}</select></td>`).join('')}</tr>`).join('')}
            </tbody></table></div>
          <h3 style="margin:24px 0 6px;font-size:20px">Classes</h3>
          <div class="scroll-x"><table id="class-table"><thead><tr><th>Code</th><th>Colour</th><th>Bell</th></tr></thead><tbody>
            ${state.classes.map((c) => classRow(c)).join('')}
          </tbody></table></div>
          <div class="actions">
            <button class="btn" id="add-class">Add a class</button>
            <button class="btn primary" id="save-timetable">Save timetable</button>
            <span class="status" id="tt-status"></span>
          </div>
        </section>
        <section>
          <h2>Backup</h2>
          <p>Download every class note and lesson note as a JSON file.</p>
          <div class="actions"><a class="btn" href="/api/export" download>${icon('download')}Export notes</a>
          <a class="btn" href="#/signout">${icon('out')}Sign out</a></div>
        </section>
      </div>
    </div>`);

  const status = (id, text, cls = '') => { const el = document.getElementById(id); el.textContent = text; el.className = `status ${cls}`; };

  document.getElementById('save-bells').addEventListener('click', async () => {
    document.querySelectorAll('[data-weekday]').forEach((s) => { bells.weekdays[s.dataset.weekday] = s.value; });
    document.querySelectorAll('input[type=time]').forEach((inp) => {
      bells.dayTypes[inp.dataset.type][inp.dataset.band][inp.dataset.i][inp.dataset.k] = inp.value;
    });
    status('bells-status', 'Saving…');
    try {
      state = await api('/api/settings/bell-times', { method: 'PUT', body: bells });
      status('bells-status', 'Bell times saved', 'ok');
    } catch (e) { status('bells-status', e.message, 'err'); }
  });

  document.getElementById('add-class').addEventListener('click', () => {
    document.querySelector('#class-table tbody').insertAdjacentHTML('beforeend', classRow({ id: '', code: '', color: '#8A93A8', band: 'bge' }));
  });

  document.getElementById('save-timetable').addEventListener('click', async () => {
    const classes = [...document.querySelectorAll('#class-table tbody tr')].map((tr) => {
      const code = tr.querySelector('[data-f=code]').value.trim();
      return {
        id: tr.dataset.id || code.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        code, color: tr.querySelector('[data-f=color]').value, band: tr.querySelector('[data-f=band]').value,
      };
    }).filter((c) => c.code);
    const slots = Object.fromEntries(DAYS.map((d) => [d, []]));
    document.querySelectorAll('select[data-day]').forEach((s) => { slots[s.dataset.day][s.dataset.p - 1] = s.value || null; });
    status('tt-status', 'Saving…');
    try {
      state = await api('/api/timetable', { method: 'PUT', body: { classes, slots } });
      status('tt-status', 'Timetable saved', 'ok');
    } catch (e) { status('tt-status', e.message, 'err'); }
  });
}

function classRow(c) {
  return `<tr data-id="${c.id}">
    <td><input type="text" data-f="code" aria-label="Class code" value="${esc(c.code)}" placeholder="S3 B2"></td>
    <td><input type="color" data-f="color" aria-label="Colour" value="${c.color}"></td>
    <td><select data-f="band" aria-label="Bell"><option value="bge" ${c.band === 'bge' ? 'selected' : ''}>S1–S3</option>
      <option value="senior" ${c.band === 'senior' ? 'selected' : ''}>S4–S6</option></select></td></tr>`;
}

function viewNotFound() {
  shell('', `<div class="view"><header class="view-head"><div><h1>Page not found</h1></div></header>
    <a class="btn" href="#/today">Go to today</a></div>`);
}

/* ---------- login ---------- */

function showLogin() {
  root.innerHTML = `
    <div class="login">
      <form id="login">
        <h1>Harris timetable</h1>
        <p>Sign in to see your timetable and notes.</p>
        <label for="pw">Password</label>
        <input id="pw" type="password" autocomplete="current-password" required>
        <div class="error" id="login-error" role="alert"></div>
        <button class="btn primary" type="submit">Sign in</button>
      </form>
    </div>`;
  const pw = document.getElementById('pw');
  pw.focus();
  pw.addEventListener('input', () => { document.getElementById('login-error').textContent = ''; });
  document.getElementById('login').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await api('/api/login', { method: 'POST', body: { password: pw.value } });
      state = null;
      route();
    } catch (err) {
      document.getElementById('login-error').textContent = err.message;
      pw.select();
    }
  });
}

/* ---------- router ---------- */

async function route() {
  try {
    if (!state) state = await api('/api/state');
    const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    const [view, ...args] = parts;
    if (!view || view === 'today') return await viewToday(args[0]);
    if (view === 'week') return await viewWeek(args[0], args[1], args[2]);
    if (view === 'classes') return await viewClasses();
    if (view === 'class') return await viewClass(args[0]);
    if (view === 'settings') return viewSettings();
    if (view === 'signout') {
      flushAll();
      await api('/api/logout', { method: 'POST' });
      state = null;
      history.replaceState(null, '', '#/today');
      return showLogin();
    }
    viewNotFound();
  } catch (e) {
    if (e.message !== 'signed out') {
      root.innerHTML = `<div class="view"><p class="empty">Couldn't load your timetable. ${esc(e.message)} <a href="">Try again</a></p></div>`;
    }
  }
}

addEventListener('hashchange', () => { flushAll(); route(); });

// Keep "now" honest between bells without disturbing someone mid-sentence.
setInterval(() => {
  if (pinned || !state) return;
  const typing = document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.tagName === 'INPUT';
  const view = location.hash.split('/')[1] || 'today';
  if (!typing && pending.size === 0 && (view === 'today' || view === 'week')) route();
}, 60000);

route();
