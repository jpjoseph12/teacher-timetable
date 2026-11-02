# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Node 22 + Express + better-sqlite3 on the server; a no-build vanilla JS single-page app in `public/`. Shipped as a Docker image (ghcr.io, public) and run on the owner's Unraid server, reached over the internet behind the owner's reverse proxy.

## Users

One secondary teacher at Harris Academy (Scotland), 2026–27 session. They check the timetable between bells on a phone, and plan or write longer notes at a laptop or classroom PC. Phone and desktop matter equally.

## Product Purpose

Show the teacher's own weekly timetable (Mon–Fri, P1–P7) with the right bell times, so "what am I teaching now / next" is answered at a glance, and keep notes in two places: a running note per class group, and a dated note per individual lesson. Success: the teacher stops carrying a paper timetable and a separate notebook.

## Positioning

A personal, single-user tool built from this teacher's actual timetable and school bell schedule, not a generic school MIS or planner. It knows Harris's split interval (S1–S3 vs S4–S6) and the 7-period vs 6-period day shapes.

## Operating Context

- Timetable source: `UPDATED AGAIN Harris Timetable Year 5 2026-2027 (1).docx` (Mon–Fri grid, P1–P6 taught, P7 present Mon/Tue and empty).
- Classes: S1 Cb Lit, S1 A5, S1 B5, S2 A2, S2 B3, S3 A2, S4 A1, S4 B4, Higher. S1–S3 are BGE; S4 and Higher are senior phase.
- Bell schedule (school image): Personal Support 8:45–8:55; P1 8:55–9:45; P2 9:45–10:35; BGE interval 10:35–10:50 then P3 10:50–11:40 for S1–S3; P3 10:35–11:25 then SP interval 11:25–11:40 for S4–S6; P4 11:40–12:30. Long days: P5 12:30–13:20, lunch 13:20–14:10, P6 14:10–15:00, P7 15:00–15:50. Short days: lunch 12:30–13:20, P5 13:20–14:10, P6 14:10–15:00.
- Used in short glances between periods (phone) and longer sessions at a desk.

## Capabilities and Constraints

- Today view, week grid, per-class page, classes list, settings (bell times, day type per weekday, timetable editing, password via env, JSON export).
- Single password login; the app is internet-reachable, so every API route is authenticated.
- Notes may contain information about pupils: they live only in the server's database, never in the repo or image.
- Undecided: which weekdays are 7-period days (assumed Mon and Tue, editable); no holiday/term calendar in v1.

## Brand Commitments

- Each class keeps the colour it has in the teacher's Word timetable: S4 A1 #FA4CD9, S1 A5 #FF3F3F, S1 B5 #7030A0, S2 A2 #4EA72E, S2 B3 #FFFF00, S3 A2 #A6A6A6, S4 B4 #00B0F0, Higher #E96A2B. S1 Cb Lit is unshaded in the source.

## Evidence on Hand

- The timetable .docx and the school bell-schedule image supplied in conversation. No other assets; no logo.

## Product Principles

- Now first: the current or next lesson is always one glance away.
- Notes never get lost: autosave, visible save state, export.
- The teacher's own conventions (class codes, colours, period numbers) win over invented labels.
- Quiet by default; nothing competes with the timetable itself.

## Accessibility & Inclusion

Class colours are the teacher's, but never the only signal: every slot also shows its class code as text, with readable contrast on the coloured fill.
