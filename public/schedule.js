// Pure timetable logic shared by the UI and tests: no DOM, no fetch.

export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri'];
export const DAY_NAMES = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday' };

export function dayKey(date) {
  const i = date.getDay();
  return i >= 1 && i <= 5 ? DAYS[i - 1] : null;
}

export function isoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseIso(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function mondayOf(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const offset = (d.getDay() + 6) % 7;
  return addDays(d, -offset);
}

export const minutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export function formatTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return `${h}:${String(m).padStart(2, '0')}`;
}

export function classById(state, id) {
  return state.classes.find((c) => c.id === id) || null;
}

// The ordered blocks (periods and breaks) for one weekday. The interval sits
// before or after P3 depending on whether that slot's class is S1–S3 or S4–S6.
export function timeline(state, day) {
  const type = state.bells.weekdays[day];
  const slots = state.slots[day] || [];
  const p3 = classById(state, slots[2]);
  const band = p3?.band === 'senior' ? 'senior' : 'bge';
  return state.bells.dayTypes[type][band].map((b) =>
    b.kind === 'period' ? { ...b, classId: slots[b.period - 1] ?? null } : { ...b });
}

export function periodBlock(state, day, period) {
  return timeline(state, day).find((b) => b.kind === 'period' && b.period === period) || null;
}

export function maxPeriods(state) {
  return Math.max(...DAYS.map((d) => timeline(state, d).filter((b) => b.kind === 'period').length));
}

// Where the teacher is right now: the block in progress (if any), the next
// period, and which school day those belong to.
export function locate(state, at) {
  const day = dayKey(at);
  const t = at.getHours() * 60 + at.getMinutes();
  if (day) {
    const blocks = timeline(state, day);
    const last = blocks[blocks.length - 1];
    if (t < minutes(last.end)) {
      const current = blocks.find((b) => minutes(b.start) <= t && t < minutes(b.end)) || null;
      const next = blocks.find((b) => b.kind === 'period' && minutes(b.start) > t) || null;
      const left = current ? minutes(current.end) - t : null;
      return { date: isoDate(at), day, blocks, current, next, minutesLeft: left, isToday: true };
    }
  }
  let d = addDays(at, 1);
  while (!dayKey(d)) d = addDays(d, 1);
  const nextDay = dayKey(d);
  const blocks = timeline(state, nextDay);
  return {
    date: isoDate(d), day: nextDay, blocks, current: null,
    next: blocks.find((b) => b.kind === 'period') || null, minutesLeft: null, isToday: false,
  };
}

// Every date this class meets in the given week, for "Meets Mon P4 · Tue P1–2".
export function meetings(state, classId) {
  const out = [];
  for (const day of DAYS) {
    const periods = (state.slots[day] || []).map((id, i) => (id === classId ? i + 1 : null)).filter(Boolean);
    if (periods.length) out.push({ day, periods });
  }
  return out;
}

export function meetingsLabel(state, classId) {
  return meetings(state, classId).map(({ day, periods }) => {
    const name = DAY_NAMES[day].slice(0, 3);
    const runs = [];
    for (const p of periods) {
      const last = runs[runs.length - 1];
      if (last && p === last[1] + 1) last[1] = p; else runs.push([p, p]);
    }
    return `${name} ${runs.map(([a, b]) => (a === b ? `P${a}` : `P${a}–${b}`)).join(', ')}`;
  }).join(' · ');
}

// The next time this class meets on or after `from`, within two weeks.
export function nextMeeting(state, classId, from) {
  for (let i = 0; i < 14; i++) {
    const d = addDays(from, i);
    const day = dayKey(d);
    if (!day) continue;
    const t = i === 0 ? from.getHours() * 60 + from.getMinutes() : -1;
    const block = timeline(state, day).find((b) => b.kind === 'period' && b.classId === classId && minutes(b.start) > t);
    if (block) return { date: isoDate(d), day, block };
  }
  return null;
}

// The now/next summary behind the home-screen widget: the lesson in progress,
// else the next one today, else the first lesson of the next school day.
export function glance(state, at) {
  const here = locate(state, at);
  const cur = here.current?.kind === 'period' ? here.current : null;
  const focus = cur || here.next;
  const name = (b) => classById(state, b?.classId)?.code ?? 'Free';
  // Free periods get a neutral grey so a widget's colour shape always has a value.
  const colour = (b) => classById(state, b?.classId)?.color ?? '#9AA1B5';
  const label = cur ? 'Now' : here.isToday ? 'Next' : DAY_NAMES[here.day];
  let detail = focus ? `P${focus.period} · ${formatTime(focus.start)}–${formatTime(focus.end)}` : '';
  if (cur) detail += ` · ${here.minutesLeft} min left`;
  const after = focus && here.blocks.find((b) => b.kind === 'period' && b.period > focus.period);
  return {
    date: here.date,
    day: DAY_NAMES[here.day],
    label,
    code: focus ? name(focus) : 'No lessons',
    detail,
    color: colour(focus),
    ink: inkOn(colour(focus)),
    then: after ? `Then ${name(after)} at ${formatTime(after.start)}` : 'Last lesson of the day',
    then_color: colour(after),
    periods: here.blocks.filter((b) => b.kind === 'period').map((b) => ({
      period: b.period, start: b.start, end: b.end, code: name(b), color: colour(b),
    })),
    updated: `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`,
  };
}

// Readable ink for text sitting on a class colour.
export function inkOn(hex) {
  const n = parseInt(hex.slice(1), 16);
  const lin = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const L = 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  const DARK_L = 0.0081; // relative luminance of #14161F
  const onWhite = 1.05 / (L + 0.05);
  const onDark = (L + 0.05) / (DARK_L + 0.05);
  return onDark >= onWhite ? '#14161F' : '#FFFFFF';
}
