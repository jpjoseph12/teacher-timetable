# Harris timetable

A personal timetable for the 2026–27 session at Harris Academy, with a running note for each class and a dated note for each lesson. It works on a phone between bells and on a laptop at a desk.

- **Today**: what's on now and next, with the current lesson's notes.
- **Week**: the full Mon–Fri grid. Click a lesson to open its notes beside the grid.
- **Classes**: each class's running note and its lesson log, newest first.
- **Settings**: bell times, which weekdays run seven periods, the timetable itself, class colours, light or dark mode, the home screen widget link, and a JSON export of every note.

The timetable and bell times are seeded from `seed/timetable.json` the first time the app starts. After that they live in the database and are edited in Settings.

## Run on Unraid

The image is built by GitHub Actions on every push to `main` and published to `ghcr.io/jpjoseph12/teacher-timetable:latest`.

1. Copy `unraid/teacher-timetable.xml` to `/boot/config/plugins/dockerMan/templates-user/my-teacher-timetable.xml` on the server.
2. In the Unraid web UI, open **Docker → Add Container**, then pick **teacher-timetable** from the template list.
3. Set **Password**. The other defaults are:
   - port 8095
   - data at `/mnt/user/appdata/teacher-timetable`
   - the data folder is owned by `PUID` 99 and `PGID` 100 (Unraid's nobody:users). These are under **Show more settings**.
4. Apply. The app is at `http://<server>:8095`.

To update, use **Check for Updates** on the Docker tab after a new build finishes.

### Reaching it from school

Point your reverse proxy or tunnel (for example Nginx Proxy Manager, SWAG or a Cloudflare Tunnel) at `http://<server>:8095` and serve it over HTTPS.

- The app trusts `X-Forwarded-Proto`, so its session cookie is marked Secure behind HTTPS.
- Sign-in attempts are limited to 10 per 15 minutes per address.

### Home screen widget (Android)

**Settings → Home screen widget** gives a private link to `/widget.json`, a feed of what's on now and next. It has class names and times only, never notes. Use it with the free KWGT app; Settings lists copy-paste formulas with your link already filled in. **Make a new link** stops the old one working.

When the app is installed to the home screen, long-pressing its icon also offers **Today** and **This week** shortcuts.

### Backups

Everything is in `/mnt/user/appdata/teacher-timetable/timetable.db`. **Settings → Export notes** downloads a JSON copy.

Notes can contain information about pupils, so they stay on your server. They are never in this repository or in the Docker image.

## Develop

```bash
npm install
APP_PASSWORD=test DATA_DIR=data-dev npm run dev
npm test
```

Add `?now=2026-11-02T11:00` to the URL to pin the clock when checking the now/next logic.

| Variable | Default | |
|---|---|---|
| `APP_PASSWORD` | (required) | Sign-in password |
| `PORT` | `8080` | Port inside the container |
| `DATA_DIR` | `./data` (`/data` in Docker) | SQLite database and session secret |
| `SESSION_SECRET` | auto-generated in `DATA_DIR` | Signs the session cookie |
