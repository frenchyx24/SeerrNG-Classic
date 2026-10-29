#!/usr/bin/env sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
UPSTREAM_REPO="${UPSTREAM_REPO:-https://github.com/snapetech-org/seerrng.git}"
UPSTREAM_REF="${UPSTREAM_REF:-471271589e28a77a2e1564b2ef4e1c152e7cf103}"
IMAGE_NAME="${IMAGE_NAME:-frenchyx24/seerrng-classic:local}"

if ! command -v git >/dev/null 2>&1; then
  echo "ERROR: git is required." >&2
  exit 1
fi
if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js is required to apply the overlay." >&2
  exit 1
fi
if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: Docker is required to build the image." >&2
  exit 1
fi

TEMP_ROOT=""
if [ -n "${WORK_DIR:-}" ]; then
  mkdir -p "$WORK_DIR"
  SRC="$WORK_DIR/seerrng-source"
  rm -rf "$SRC"
else
  TEMP_ROOT="$(mktemp -d)"
  SRC="$TEMP_ROOT/seerrng-source"
  trap 'rm -rf "$TEMP_ROOT"' EXIT HUP INT TERM
fi

echo "Cloning SeerrNG at pinned commit $UPSTREAM_REF..."
git clone --filter=blob:none "$UPSTREAM_REPO" "$SRC"
git -C "$SRC" fetch --depth 1 origin "$UPSTREAM_REF"
git -C "$SRC" checkout --detach FETCH_HEAD

echo "Applying SeerrNG Classic overlay..."
node "$ROOT/scripts/apply-overrides.mjs" "$SRC"

echo "Building $IMAGE_NAME..."
docker build \
  --file "$SRC/Dockerfile" \
  --build-arg COMMIT_TAG="$UPSTREAM_REF" \
  --build-arg BUILD_VERSION="classic" \
  --tag "$IMAGE_NAME" \
  "$SRC"

echo "Build complete: $IMAGE_NAME"
echo "Run it with your normal SeerrNG environment and persistent /app/config volume."

