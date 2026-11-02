#!/bin/sh
# Bind-mounted data folders are usually created by root on the host. When we
# start as root, hand /data to PUID:PGID (Unraid's nobody:users by default)
# and drop to that user; when started as a non-root user, just run.
set -e

if [ "$(id -u)" = "0" ]; then
  PUID="${PUID:-99}"
  PGID="${PGID:-100}"
  mkdir -p "$DATA_DIR"
  chown -R "$PUID:$PGID" "$DATA_DIR"
  exec setpriv --reuid="$PUID" --regid="$PGID" --clear-groups "$@"
fi

exec "$@"
