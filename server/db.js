import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SEED_PATH = path.join(here, '..', 'seed', 'timetable.json');

export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri'];

export function openDb(dataDir) {
  fs.mkdirSync(dataDir, { recursive: true });
  const db = new Database(path.join(dataDir, 'timetable.db'));
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      band TEXT NOT NULL CHECK (band IN ('bge', 'senior')),
      color TEXT NOT NULL,
      sort INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS slots (
      day TEXT NOT NULL,
      period INTEGER NOT NULL,
      class_id TEXT REFERENCES classes(id),
      PRIMARY KEY (day, period)
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS class_notes (
      class_id TEXT PRIMARY KEY REFERENCES classes(id),
      body TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS lesson_notes (
      date TEXT NOT NULL,
      period INTEGER NOT NULL,
      class_id TEXT REFERENCES classes(id),
      body TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (date, period)
    );
    CREATE INDEX IF NOT EXISTS lesson_notes_class ON lesson_notes (class_id, date);
  `);

  const seeded = db.prepare('SELECT 1 FROM settings WHERE key = ?').get('bells');
  if (!seeded) seed(db, JSON.parse(fs.readFileSync(SEED_PATH, 'utf8')));
  return db;
}

function seed(db, data) {
  const insertClass = db.prepare('INSERT INTO classes (id, code, band, color, sort) VALUES (?, ?, ?, ?, ?)');
  const insertSlot = db.prepare('INSERT INTO slots (day, period, class_id) VALUES (?, ?, ?)');
  db.transaction(() => {
    data.classes.forEach((c, i) => insertClass.run(c.id, c.code, c.band, c.color, i));
    for (const day of DAYS) {
      (data.slots[day] || []).forEach((classId, i) => insertSlot.run(day, i + 1, classId));
    }
    setSetting(db, 'bells', data.bells);
  })();
}

export function getSetting(db, key) {
  const row = db.prepare('SELECT json FROM settings WHERE key = ?').get(key);
  return row ? JSON.parse(row.json) : null;
}

export function setSetting(db, key, value) {
  db.prepare('INSERT INTO settings (key, json) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET json = excluded.json')
    .run(key, JSON.stringify(value));
}

export function getState(db) {
  const classes = db.prepare('SELECT id, code, band, color FROM classes ORDER BY sort, code').all();
  const slots = Object.fromEntries(DAYS.map((d) => [d, []]));
  for (const row of db.prepare('SELECT day, period, class_id FROM slots ORDER BY period').all()) {
    if (slots[row.day]) slots[row.day][row.period - 1] = row.class_id;
  }
  for (const day of DAYS) slots[day] = Array.from(slots[day], (v) => v ?? null);
  return { classes, slots, bells: getSetting(db, 'bells') };
}
