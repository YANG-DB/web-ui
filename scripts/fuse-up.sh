#!/usr/bin/env bash
# Starts YangDB (Fuse) on OpenSearch with Docker and loads the Dragons sample.
# Used by the Dragons tutorial (docs/tutorials/DRAGONS.md) and by CI.
#
#   scripts/fuse-up.sh            # start (or reuse) Fuse on :8888 and load the data
#   SKIP_LOAD=1 scripts/fuse-up.sh
#   scripts/fuse-down.sh          # stop and remove the containers
#
# Settings (environment):
#   FUSE_IMAGE   default ghcr.io/yang-db/yang.db:0.9.1
#   OS_IMAGE     default opensearchproject/opensearch:2.19.7
#   FUSE_PORT    default 8888
#   OS_PORT      default 9200
#   WAIT_SECS    default 300 (per service)
set -euo pipefail

FUSE_IMAGE="${FUSE_IMAGE:-ghcr.io/yang-db/yang.db:0.9.1}"
OS_IMAGE="${OS_IMAGE:-opensearchproject/opensearch:2.19.7}"
FUSE_PORT="${FUSE_PORT:-8888}"
OS_PORT="${OS_PORT:-9200}"
WAIT_SECS="${WAIT_SECS:-300}"
NETWORK=web-ui-fuse
OS_NAME=web-ui-opensearch
FUSE_NAME=web-ui-fuse
FUSE_URL="http://localhost:${FUSE_PORT}"

wait_for() { # description, url
  local desc="$1" url="$2" waited=0
  printf 'Waiting for %s ' "$desc"
  until curl -sf -o /dev/null "$url"; do
    if [ "$waited" -ge "$WAIT_SECS" ]; then
      echo " timed out after ${WAIT_SECS}s"
      return 1
    fi
    printf '.'
    sleep 5
    waited=$((waited + 5))
  done
  echo " up"
}

if curl -sf -o /dev/null "${FUSE_URL}/fuse/health"; then
  echo "Fuse is already running at ${FUSE_URL}, reusing it."
else
  docker network inspect "$NETWORK" >/dev/null 2>&1 || docker network create "$NETWORK" >/dev/null

  if ! docker ps --format '{{.Names}}' | grep -qx "$OS_NAME"; then
    docker rm -f "$OS_NAME" >/dev/null 2>&1 || true
    echo "Starting OpenSearch (${OS_IMAGE})"
    # Security plugin disabled: for local testing only.
    docker run -d --name "$OS_NAME" --network "$NETWORK" --network-alias opensearch \
      -p "${OS_PORT}:9200" \
      --ulimit nofile=65536:65536 \
      -e cluster.name=Dragons -e node.name=opensearch -e discovery.type=single-node \
      -e "OPENSEARCH_JAVA_OPTS=-Xms512m -Xmx512m" \
      -e DISABLE_INSTALL_DEMO_CONFIG=true -e DISABLE_SECURITY_PLUGIN=true \
      "$OS_IMAGE" >/dev/null
  fi
  wait_for "OpenSearch" "http://localhost:${OS_PORT}/_cluster/health?wait_for_status=yellow&timeout=5s"

  docker rm -f "$FUSE_NAME" >/dev/null 2>&1 || true
  echo "Starting Fuse (${FUSE_IMAGE})"
  # The image's config points at host "opensearch", cluster "Dragons".
  docker run -d --name "$FUSE_NAME" --network "$NETWORK" -p "${FUSE_PORT}:8888" "$FUSE_IMAGE" >/dev/null
  wait_for "Fuse" "${FUSE_URL}/fuse/health"
fi

if [ "${SKIP_LOAD:-}" != "1" ]; then
  echo "Loading the Dragons ontology and data"
  response="$(curl -sf -X POST "${FUSE_URL}/fuse/dragons/tutorial/load")"
  if ! printf '%s' "$response" | grep -q '"ok":true'; then
    echo "Loading failed: ${response}"
    exit 1
  fi
  echo "Dragons data loaded."
fi

echo "Fuse is ready at ${FUSE_URL} (health: ${FUSE_URL}/fuse/health)"
