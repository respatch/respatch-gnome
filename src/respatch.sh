#!/bin/sh
export GJS_PATH=/app/share/respatch/src
exec gjs -m /app/share/respatch/src/main.mjs "$@"