#!/usr/bin/env bash
# Stops and removes the containers started by scripts/fuse-up.sh (the data goes with them).
set -uo pipefail
docker rm -f web-ui-fuse web-ui-opensearch >/dev/null 2>&1
docker network rm web-ui-fuse >/dev/null 2>&1
echo "Fuse and OpenSearch containers removed."
