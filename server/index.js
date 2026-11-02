import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDb, getState, setSetting, DAYS } from './db.js';
import { createAuth, createWidgetKey } from './auth.js';
import { glance } from '../public/schedule.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 8080;
const DATA_DIR = process.env.DATA_DIR || path.join(here, '..', 'data');

const db = openDb(DATA_DIR);
const auth = createAuth({ password: process.env.APP_PASSWORD, secret: process.env.SESSION_SECRET, dataDir: DATA_DIR });
const widgetKey = createWidgetKey(DATA_DIR);

const app = express();
// Trust X-Forwarded-* only from a reverse proxy on a private network, so the
// login rate limit can't be dodged with a forged header.
app.set('trust proxy', 'loopback, linklocal, uniquelocal');
app.disable('x-powered-by');
app.use(express.json({ limit: '256kb' }));

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;
const COLOR = /^#[0-9a-fA-F]{6}$/;
const MAX_NOTE = 20000;
const now = () => new Date().toISOString();
const bad = (res, msg) => res.status(400).json({ error: msg });

app.get('/health', (req, res) => res.json({ ok: true }));

// Widget feed: class names and times only, never notes.
app.get('/widget.json', (req, res) => {
  res.set({ 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex' });
  if (!widgetKey.matches(req.query.key)) return res.status(404).json({ error: 'Not found.' });
  const at = typeof req.query.now === 'string' && !Number.isNaN(Date.parse(req.query.now)) ? new Date(req.query.now) : new Date();
  res.json(glance(getState(db), at));
});

app.post('/api/login', auth.login);
app.post('/api/logout', auth.logout);
app.use('/api', auth.require);

app.get('/api/state', (req, res) => res.json(getState(db)));

app.get('/api/widget-key', (req, res) => res.json({ key: widgetKey.get() }));
app.post('/api/widget-key', (req, res) => res.json({ key: widgetKey.rotate() }));

app.put('/api/settings/bell-times', (req, res) => {
  const bells = req.body;
  const types = ['long', 'short'];
  const okBlocks = (list) => Array.isArray(list) && list.every((b) =>
    TIME.test(b.start) && TIME.test(b.end) && b.start < b.end &&
    (b.kind === 'period' ? Number.isInteger(b.period) && b.period >= 1 && b.period <= 7 : b.kind === 'break' && typeof b.label === 'string'));
  if (!bells?.weekdays || !DAYS.every((d) => types.includes(bells.weekdays[d]))) return bad(res, 'Each weekday needs a day type.');
  if (!types.every((t) => okBlocks(bells.dayTypes?.[t]?.bge) && okBlocks(bells.dayTypes?.[t]?.senior))) {
    return bad(res, 'Every block needs a start before its end.');
  }
  setSetting(db, 'bells', bells);
  res.json(getState(db));
});

app.put('/api/timetable', (req, res) => {
  const { classes, slots } = req.body || {};
  if (!Array.isArray(classes) || !slots) return bad(res, 'Send classes and slots.');
  for (const c of classes) {
    if (!/^[a-z0-9-]{1,40}$/.test(c.id) || !c.code?.trim() || !['bge', 'senior'].includes(c.band) || !COLOR.test(c.color)) {
      return bad(res, `Check the details for ${c.code || 'a class'}.`);
    }
  }
  const ids = new Set(classes.map((c) => c.id));
  const upsert = db.prepare(`INSERT INTO classes (id, code, band, color, sort) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET code = excluded.code, band = excluded.band, color = excluded.color, sort = excluded.sort`);
  const setSlot = db.prepare('INSERT INTO slots (day, period, class_id) VALUES (?, ?, ?) ON CONFLICT(day, period) DO UPDATE SET class_id = excluded.class_id');
  db.transaction(() => {
    classes.forEach((c, i) => upsert.run(c.id, c.code.trim(), c.band, c.color, i));
    for (const day of DAYS) {
      for (let p = 1; p <= 7; p++) {
        const id = slots[day]?.[p - 1] ?? null;
        setSlot.run(day, p, id && ids.has(id) ? id : null);
      }
    }
  })();
  res.json(getState(db));
});

app.get('/api/classes/:id/note', (req, res) => {
  const row = db.prepare('SELECT body, updated_at FROM class_notes WHERE class_id = ?').get(req.params.id);
  res.json(row || { body: '', updated_at: null });
});

app.put('/api/classes/:id/note', (req, res) => {
  const body = req.body?.body;
  if (typeof body !== 'string' || body.length > MAX_NOTE) return bad(res, 'Notes are limited to 20,000 characters.');
  if (!db.prepare('SELECT 1 FROM classes WHERE id = ?').get(req.params.id)) return res.status(404).json({ error: 'No such class.' });
  const at = now();
  db.prepare(`INSERT INTO class_notes (class_id, body, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(class_id) DO UPDATE SET body = excluded.body, updated_at = excluded.updated_at`).run(req.params.id, body, at);
  res.json({ body, updated_at: at });
});

app.get('/api/classes/:id/lessons', (req, res) => {
  res.json(db.prepare(`SELECT date, period, class_id, body, updated_at FROM lesson_notes
    WHERE class_id = ? ORDER BY date DESC, period DESC LIMIT 200`).all(req.params.id));
});

app.get('/api/lessons', (req, res) => {
  const { from, to } = req.query;
  if (!DATE.test(from) || !DATE.test(to)) return bad(res, 'Use from and to as YYYY-MM-DD.');
  res.json(db.prepare('SELECT date, period, class_id, body, updated_at FROM lesson_notes WHERE date BETWEEN ? AND ? ORDER BY date, period').all(from, to));
});

app.put('/api/lessons/:date/:period', (req, res) => {
  const { date } = req.params;
  const period = Number(req.params.period);
  const { body, classId } = req.body || {};
  if (!DATE.test(date) || !Number.isInteger(period) || period < 1 || period > 7) return bad(res, 'Unknown lesson.');
  if (typeof body !== 'string' || body.length > MAX_NOTE) return bad(res, 'Notes are limited to 20,000 characters.');
  if (!body.trim()) {
    db.prepare('DELETE FROM lesson_notes WHERE date = ? AND period = ?').run(date, period);
    return res.json({ date, period, class_id: classId ?? null, body: '', updated_at: null });
  }
  const cls = classId && db.prepare('SELECT id FROM classes WHERE id = ?').get(classId) ? classId : null;
  const at = now();
  db.prepare(`INSERT INTO lesson_notes (date, period, class_id, body, updated_at) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(date, period) DO UPDATE SET class_id = excluded.class_id, body = excluded.body, updated_at = excluded.updated_at`)
    .run(date, period, cls, body, at);
  res.json({ date, period, class_id: cls, body, updated_at: at });
});

app.get('/api/export', (req, res) => {
  const stamp = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Disposition', `attachment; filename="timetable-notes-${stamp}.json"`);
  res.json({
    exported_at: now(),
    ...getState(db),
    class_notes: db.prepare('SELECT * FROM class_notes').all(),
    lesson_notes: db.prepare('SELECT * FROM lesson_notes ORDER BY date, period').all(),
  });
});

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

app.use('/fonts', express.static(path.join(here, '..', 'node_modules', '@fontsource'), { maxAge: '365d', immutable: true }));
// Revalidate the app shell on every load so an update shows up straight away.
app.use(express.static(path.join(here, '..', 'public'), { index: 'index.html', maxAge: 0 }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

app.listen(PORT, () => console.log(`Timetable listening on :${PORT} (data in ${DATA_DIR})`));
