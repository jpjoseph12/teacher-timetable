---
name: Harris timetable
description: A teacher's week-to-view planner, bound in cobalt cloth, with a red ribbon on now.
colors:
  cloth: "#2340A8"
  cloth-deep: "#1A3088"
  cloth-ink: "#FFFFFF"
  cloth-soft: "#C3CEF5"
  page: "#FFFFFF"
  band: "#F4F6FA"
  rule: "#D9DEE8"
  rule-strong: "#B4BCCD"
  ink: "#15182B"
  ink-2: "#464B62"
  ink-3: "#5A6078"
  ribbon: "#D7263D"
  ribbon-deep: "#A8172B"
  ok: "#24724A"
  warn: "#A64B12"
  class-s4-a1: "#FA4CD9"
  class-s1-a5: "#FF3F3F"
  class-s1-b5: "#7030A0"
  class-s2-a2: "#4EA72E"
  class-s2-b3: "#FFFF00"
  class-s3-a2: "#A6A6A6"
  class-s4-b4: "#00B0F0"
  class-higher: "#E96A2B"
  class-s1-cb-lit: "#C9CDD6"
typography:
  display:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "64px"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "0.005em"
  headline:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "46px"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "0.005em"
  title:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "40px"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "0.005em"
  code:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    letterSpacing: "0.01em"
  period-index:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "34px"
    fontWeight: 700
    lineHeight: 1
  body:
    fontFamily: "Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "tnum"
  note:
    fontFamily: "Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: "28px"
  label:
    fontFamily: "Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  band-label:
    fontFamily: "Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    letterSpacing: "0.06em"
rounded:
  tab: "3px"
  field-sm: "6px"
  md: "8px"
  card: "10px"
  sheet: "12px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  gutter: "28px"
  page: "36px"
  rail: "88px"
  panel: "440px"
components:
  button:
    backgroundColor: "{colors.page}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "9px 14px"
  button-hover:
    backgroundColor: "{colors.band}"
  button-primary:
    backgroundColor: "{colors.cloth}"
    textColor: "{colors.cloth-ink}"
    rounded: "{rounded.md}"
    padding: "9px 14px"
  button-primary-hover:
    backgroundColor: "{colors.cloth-deep}"
  button-icon:
    backgroundColor: "{colors.page}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px"
  rail:
    backgroundColor: "{colors.cloth}"
    textColor: "{colors.cloth-soft}"
    width: "{spacing.rail}"
  rail-tab:
    textColor: "{colors.cloth-soft}"
    rounded: "{rounded.md}"
    padding: "10px 0"
    width: "72px"
  rail-tab-active:
    backgroundColor: "{colors.cloth-deep}"
    textColor: "{colors.cloth-ink}"
  week-cell:
    backgroundColor: "{colors.page}"
    textColor: "{colors.ink-2}"
    padding: "9px 12px 9px 16px"
    height: "82px"
  week-cell-hover:
    backgroundColor: "{colors.band}"
  week-band:
    backgroundColor: "{colors.band}"
    textColor: "{colors.ink-3}"
    typography: "{typography.band-label}"
    padding: "3px 12px 3px 16px"
  now-card:
    backgroundColor: "{colors.page}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "20px 24px 22px 30px"
  note-field:
    backgroundColor: "{colors.page}"
    textColor: "{colors.ink}"
    typography: "{typography.note}"
    rounded: "{rounded.md}"
    padding: "12px 14px"
  settings-input:
    backgroundColor: "{colors.page}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field-sm}"
    padding: "6px 8px"
---

# Design System: Harris timetable

## Overview

**Creative North Star: "The Week-to-View Planner"**

The app is the teacher's own planner, not a calendar app. A cobalt bookcloth binding (the rail on desktop, the header and tab bar on phone) holds white, ruled pages. Each lesson carries its class colour the way a planner carries a coloured edge tab, and a red ribbon marks the page you are on: it drops down today's column to the current period in the week, and hangs from the top of the now card on Today.

Density follows the glance. A phone between bells must answer "what now, what next" in one look, so Today runs a fixed size ramp: the now card's code at 64px, the next row at 30px, later rows at 22px. The desktop week is a ruled grid indexed by large cobalt period numbers, with break and lunch as quiet shaded bands. When a lesson opens, it owns a right-hand panel and the rest of the week dims; one region dominates each screen.

The system refuses the calendar-app default of pastel blocks on a grey-white grid with a blue now line. Class colour is never a fill behind text; it is a tab on the edge, and the class code is always present as text.

**Key Characteristics:**
- Cobalt cloth shell, white ruled pages, near-black ink.
- Class colour as a 7px edge tab, the same form at every scale.
- Class codes and period numbers in Barlow Condensed; times, body and notes in Atkinson Hyperlegible with tabular numerals.
- One red ribbon marks now; red appears nowhere else as decoration.
- Flat surfaces divided by hairline rules; heavy 2px ink rules open each table.
- Focus dims the rest rather than adding chrome.

## Colors

Three materials and a set of borrowed colours: cobalt cloth, white ruled paper, ribbon red, and the teacher's own class colours from the Word timetable.

### Primary
- **Cobalt Bookcloth** (cloth): the shell. Desktop rail, phone header and tab bar, login backdrop, primary buttons, period numbers, the note-flag icon, inline links in lesson meta, and focus borders on text fields.
- **Deep Cloth** (cloth-deep): the pressed state of the binding. Active and hovered rail tabs, primary button hover.
- **Cloth Ink** (cloth-ink) and **Faded Cloth Lettering** (cloth-soft): text on cobalt. Full white for the active tab, the mark and headings; cloth-soft for resting tabs and the phone header's subline.

### Secondary
- **Ribbon Red** (ribbon): the now marker only. The week ribbon, the now card's ribbon mark, the login sheet's ribbon, the focus outline, and the text caret.
- **Deep Ribbon** (ribbon-deep): red as text. Today's day heading in the week, the "Next" tag on Today, and the ribbon's folded edge.

### Tertiary: Class Colours
The teacher's Word timetable colours, fixed by brand commitment: **S4 A1 Magenta** (class-s4-a1), **S1 A5 Red** (class-s1-a5), **S1 B5 Purple** (class-s1-b5), **S2 A2 Green** (class-s2-a2), **S2 B3 Yellow** (class-s2-b3), **S3 A2 Grey** (class-s3-a2), **S4 B4 Cyan** (class-s4-b4), **Higher Orange** (class-higher). **S1 Cb Lit** is unshaded in the source; the build gives it a cool paper grey (class-s1-cb-lit) so its tab still reads as a tab. Each is applied per element as the `--c` custom property and painted only as the edge tab, a 12% tint on a selected week cell, and a faded tab on past rows.

### Neutral
- **Page White** (page): every page, card, field and button at rest.
- **Ruled Band** (band): hover wash on rows and cells, break and lunch bands, the break rows on Today.
- **Hairline Rule** (rule): every divider in grids, lists, tables and panels.
- **Strong Rule** (rule-strong): borders of controls (buttons, fields, the now card) and scrollbar thumbs.
- **Planner Ink** (ink): headings, class codes, and the 2px rules that open the week, the day list and the classes list; also the 2px inset frame on the current week cell.
- **Second Ink** (ink-2): sublines, times, lesson meta, body copy in lists.
- **Pencil** (ink-3): free periods, past lessons, band labels, empty states, placeholders, timestamps.
- **Saved Green** (ok) and **Warning Rust** (warn): save status text and login errors only.

### Named Rules
**The Edge Tab Rule.** Class colour sits on the edge of an element as a tab, never as a fill behind text. The code beside it carries the meaning; the colour confirms it.

**The One Ribbon Rule.** Ribbon red means now. It marks the current period and the focus position and does no decorative work anywhere else.

**The Teacher's Colours Rule.** Class colours come from the teacher's timetable and are never adjusted, harmonised or swapped for a nicer palette. Readability is solved by placement, not by changing the colour.

## Typography

**Display Font:** Barlow Condensed 700 (with Arial Narrow, sans-serif); a 600 cut is used only for "Free".
**Body Font:** Atkinson Hyperlegible 400 and 700 (with system-ui, sans-serif)

**Character:** A condensed timetable face for the things a teacher scans (period numbers, class codes, headings) next to a legibility face for the things they read (times, notes). Tabular numerals are on everywhere, so times line up down a column.

### Hierarchy
- **Display** (700, 64px, 1.05): the class code on the now card; 52px on phone.
- **Headline** (700, 46px): the lesson panel title; class page title at 56px desktop, 40px phone.
- **Title** (700, 40px): view headings (Week of, Classes); 28px in the phone header; settings sections at 30px, field labels at 20px.
- **Code** (700, 22px, 0.01em): class codes in the day list and then-line. The same face scales by role: 30px for the next row and the classes list, 21px in week cells, 15px on phone cells.
- **Period Index** (700, 34px, 1): cobalt period numbers down the week; 26px in the day list, 22px on phone.
- **Body** (400, 16px, 1.5, tabular): default text, meta lines, list content.
- **Note** (400, 17px, 28px line): notes in ruled fields; the 28px line matches the ruling.
- **Label** (400, 13px): times in cells, timestamps, save status, rail tab labels.
- **Band Label** (400, 12px, 0.06em, uppercase): the names of break and lunch bands only.

### Named Rules
**The One Form Rule.** A class code is set the same way at every scale (Barlow Condensed 700 with its edge tab), whether it is a 15px phone cell or a 64px now card. Size changes; form does not.

**The Fixed Ramp Rule.** On Today, size is rank: now is largest, next is next, later is smallest. Do not let a later item outgrow an earlier one.

## Layout

Desktop is an 88px cobalt rail plus a fluid main column padded 28px 36px 48px. The week is a CSS grid of a 56px period index plus five equal day columns, alternating minmax(82px, auto) period rows with auto gap rows that hold break and lunch bands. Opening a lesson adds a 440px panel (380px under 1180px) separated by a hairline and a 28px gutter. Today is a two-column grid (card and list on the left, the lesson panel on the right, 36px apart). Text-heavy pages cap their width: classes list 980px, settings 1100px, class page 1200px in two equal columns 40px apart.

Under 900px the panel stacks: Today becomes card, panel, list; an open lesson replaces the week entirely and shows a Back button. Under 768px the rail becomes a fixed bottom tab bar (with safe-area padding), the view header turns cobalt and bleeds to the edges, the period index narrows to 30px, and cells drop their times to keep only the code.

Spacing runs on a small set (4, 8, 12, 16, 20, 28, 36px); 6px and 14px appear inside controls.

## Elevation & Depth

The system is flat. Depth comes from paper and rule, not shadow: hairline rules divide, a 2px ink rule opens each table, the band tint marks breaks and hover, and focus dims everything except the open lesson (unselected cells drop to 0.42 opacity). The only shadows are edge details and rings.

### Shadow Vocabulary
- **Tab edge** (`box-shadow: inset -1px 0 0 rgb(0 0 0 / 0.12)`): gives pale class tabs (yellow, grey) a visible edge on white.
- **Ribbon fold** (`box-shadow: 1px 0 0 #A8172B`): the folded edge of the week ribbon.
- **Now frame** (`box-shadow: inset 0 0 0 2px #15182B`): the current period's cell in the week.
- **Field focus ring** (`box-shadow: 0 0 0 3px rgb(35 64 168 / 0.18)`): text fields on focus, with a cobalt border.

### Named Rules
**The Paper Rule.** Surfaces never lift. If something needs emphasis, rule it, tint it, or dim its neighbours.

## Shapes

Mostly square and ruled. Controls have gently rounded corners (8px on buttons, note fields and rail tabs; 6px on the small settings inputs); the now card is 10px and the login sheet 12px. Edge tabs are 7px wide (10-12px on titles, 5px on phone), inset 8px top and bottom, with a 3px radius on the outer side only, like a die-cut tab. The ribbon is a strip with a swallowtail notch cut by clip-path (8px notch in the week, a 78% notch on the 20x56px mark). Note fields are ruled every 28px with a #E4E8F0 line that scrolls with the text; free periods carry a faint 16px ruling.

## Components

### Buttons
Plain and quiet; the timetable is the content.
- **Shape:** gently rounded (8px), 1px strong-rule border.
- **Default:** page white, ink text, Atkinson 15px, 9px 14px padding, with an optional 22px stroke icon.
- **Hover / Focus:** hover darkens the border to pencil and washes the band tint; keyboard focus gets the 3px ribbon outline, offset 2px.
- **Primary:** cobalt fill and border, white text; hover goes to deep cloth.
- **Icon-only:** 8px padding square for the pager arrows and panel close; always carries an accessible label.
- **On the phone header:** transparent with white text and a 45% white border; hover goes to deep cloth.

### Navigation (Rail)
- Cobalt column 88px wide, sticky full height, with a condensed "H" mark at 28px, tabs stacked 6px apart and Sign out pushed to the bottom.
- Tabs are 72px wide: a 22px stroke icon above a 13px label, cloth-soft at rest; hover and the current page both take deep cloth with white text.
- Under 768px it becomes a fixed bottom bar, tabs flex equally at 12px labels, and the mark and Sign out hide.

### Lesson Cell (Week)
The signature unit. A ruled cell at least 82px tall with a 1px left and bottom hairline, the start time in a 13px label and the class code in Barlow 21px, the edge tab on its left. Hover washes the band tint; selected takes a 12% tint of the class colour; the current period is framed in a 2px ink inset; free periods are pencil-grey on faint ruling; empty slots lose their left rule. A note-flag icon floats right in cobalt.

### Ribbon
A 14px red strip (8px on phone) that drops from the top of today's column to the end of the current period, scaling in from the top over 0.9s on the shared ease. On Today it is a 20x56px mark hanging from the now card. It is aria-hidden; the now state is also given in text.

### Now Card
White, 1px strong-rule border, 10px corners, 10px edge tab. The class code at display size links to the class page; under it the period and time, then a hairline and a "Then" line with the next code at 22px.

### Day Rows (Today)
A ruled list opened by a 2px ink rule: cobalt period number, time, code and note flag in a 56/92/flexible/auto grid. The next row grows (14px padding, 30px code) and gains a deep-ribbon "Next" tag; the current row takes a faint red wash (#FFF5F6); past rows go pencil with their tab at 45%; breaks are band-tinted uppercase rows.

### Inputs / Fields
- **Note field:** full width, strong-rule border, 8px corners, 12px 14px padding, Atkinson 17px on a 28px ruling. Minimum 150px (110px for the class note in the panel, 320px on the class page), resizable vertically. The caret is ribbon red.
- **Focus:** the outline is replaced by a cobalt border and a 3px cobalt ring at 18%.
- **Save state:** a 13px status beside the field label: pencil while idle, green "Saved ..." when stored, rust on error.
- **Settings inputs:** compact, 6px corners, 6px 8px padding, Atkinson 15px; colour pickers are 44x34px.

### Week Band
Break and lunch as a quiet band between period rows: band tint, pencil 12px uppercase label at 0.06em with the start time. On phone the label shortens (for example "Lun.") and the full name stays for screen readers.

## Do's and Don'ts

### Do:
- **Do** paint class colour only through the `--c` edge tab (7px desktop, 5px phone, 3px outer radius), the 12% selected tint, or the faded past tab.
- **Do** show the class code as text wherever a class colour appears.
- **Do** set every class code and period number in Barlow Condensed 700, and every time, note and body line in Atkinson Hyperlegible with tabular numerals.
- **Do** keep the shell cobalt (#2340A8) and the pages white with #D9DEE8 hairlines.
- **Do** open lists and grids with a 2px ink rule and divide them with hairlines.
- **Do** dim neighbours (0.42 opacity) to focus an open lesson instead of adding chrome.
- **Do** turn off the ribbon drop and all transitions under prefers-reduced-motion.

### Don't:
- **Don't** fill a block with class colour behind text, or use pastel blocks on a grey grid.
- **Don't** alter, lighten or replace the teacher's class colours.
- **Don't** use ribbon red for anything but the ribbon itself, now and today markers, focus and the caret; status uses green and rust.
- **Don't** add drop shadows or raised cards; the Paper Rule holds.
- **Don't** mark now with a thin blue line; now is the red ribbon.
- **Don't** let a later lesson on Today outsize the current or next one.
