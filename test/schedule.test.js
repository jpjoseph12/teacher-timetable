import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { locate, timeline, meetingsLabel, nextMeeting, inkOn } from '../public/schedule.js';

const seed = JSON.parse(fs.readFileSync(new URL('../seed/timetable.json', import.meta.url)));
const state = { classes: seed.classes, slots: seed.slots, bells: seed.bells };
const at = (s) => new Date(s);

test('Monday 11:00 is S2 A2 in P3 on the S1–S3 bell', () => {
  const r = locate(state, at('2026-11-02T11:00'));
  assert.equal(r.current.period, 3);
  assert.equal(r.current.classId, 's2-a2');
  assert.equal(r.current.start, '10:50');
  assert.equal(r.minutesLeft, 40);
});

test('Thursday 10:40 is S4 B4 in P3 on the S4–S6 bell', () => {
  const r = locate(state, at('2026-11-05T10:40'));
  assert.equal(r.current.classId, 's4-b4');
  assert.equal(r.current.start, '10:35');
  assert.equal(r.current.end, '11:25');
});

test('Monday 13:30 is lunch on a long day, S2 B3 next', () => {
  const r = locate(state, at('2026-11-02T13:30'));
  assert.equal(r.current.label, 'Lunch');
  assert.equal(r.next.period, 6);
  assert.equal(r.next.classId, 's2-b3');
});

test('Wednesday 12:45 is lunch on a short day, S1 A5 next', () => {
  const r = locate(state, at('2026-11-04T12:45'));
  assert.equal(r.current.label, 'Lunch');
  assert.equal(r.next.period, 5);
  assert.equal(r.next.classId, 's1-a5');
});

test('Friday evening rolls to Monday', () => {
  const r = locate(state, at('2026-11-06T18:00'));
  assert.equal(r.date, '2026-11-09');
  assert.equal(r.isToday, false);
  assert.equal(r.next.period, 1);
});

test('long days have seven periods, short days six', () => {
  assert.equal(timeline(state, 'tue').filter((b) => b.kind === 'period').length, 7);
  assert.equal(timeline(state, 'thu').filter((b) => b.kind === 'period').length, 6);
});

test('meeting summary groups doubles', () => {
  assert.equal(meetingsLabel(state, 's4-a1'), 'Mon P4 · Tue P1–2 · Fri P5');
});

test('next meeting skips past lessons', () => {
  const n = nextMeeting(state, 's4-a1', at('2026-11-02T13:00'));
  assert.equal(n.date, '2026-11-03');
  assert.equal(n.block.period, 1);
});

test('ink picks dark text on yellow and white on purple', () => {
  assert.equal(inkOn('#FFFF00'), '#14161F');
  assert.equal(inkOn('#7030A0'), '#FFFFFF');
  assert.equal(inkOn('#FA4CD9'), '#14161F');
  assert.equal(inkOn('#4EA72E'), '#14161F');
});
