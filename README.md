# SeerrNG Classic

A personal SeerrNG customization that makes **SeerrNG Classic 3.5.1** the default interface for new installs and retains the current SeerrNG backend, routes, permissions, APIs and expanded media features, including anime, music and books.

This repository is an **overlay**, not a copy of the full upstream source tree. At build time it checks out SeerrNG at a pinned upstream commit, applies the classic theme and default-theme changes, then builds using SeerrNG's own Dockerfile. The upstream repository is never modified.

## What's included

- `overlays/themes/seerrng-classic/manifest.json`: the registered interface theme.
- `overlays/themes/seerrng-classic/theme.css`: adapted from SeerrNG's classic Seerr visual stylesheet, with selectors namespaced to `seerrng-classic`.
- `scripts/apply-overrides.mjs`: applies the theme, registers it with the server/frontend theme catalogs, switches the clean-install default, and exempts server-to-self loopback requests from the per-user external-metadata limiter (60 requests/minute) that can otherwise turn server-rendered media pages into HTTP 500 errors. It is idempotent and refuses to patch a directory whose package name is not `seerrng`.
- `scripts/build.sh`: checks out a pinned upstream revision, applies the overlay and builds a local Docker image using the upstream Dockerfile.

## Container image

The release version is tracked in the root `VERSION` file. Current release: **1.0.1**.

- Version-pinned image: `ghcr.io/frenchyx24/seerrng-classic:1.0.1`
- Moving convenience tag: `ghcr.io/frenchyx24/seerrng-classic:latest`

The build workflow publishes semantic version tags, not commit-SHA tags. Bump `VERSION` when preparing a new release. Keep `latest` for convenient testing; use the numbered tag in TrueNAS for reproducible deployments.

GitHub Container Registry packages are private by default. To pull this image anonymously from TrueNAS, set package visibility to **Public** at [the package settings](https://github.com/users/frenchyx24/packages/container/package/seerrng-classic). Otherwise, configure a GHCR login with a token that has `read:packages`.

## Build

Run from a machine with Git, Node.js and Docker installed:

```sh
sh scripts/build.sh
```

The default image tag is `frenchyx24/seerrng-classic:local`.

You can override the upstream source/ref and image tag:

```sh
UPSTREAM_REF=main IMAGE_NAME=seerrng-classic:testing sh scripts/build.sh
```

For reproducible builds, keep the default pinned commit. When updating the upstream version, review the files patched by the installer and run the upstream typecheck/tests before deploying.

To retain the checked-out source for inspection:

```sh
WORK_DIR="$PWD/.build" sh scripts/build.sh
```

## Existing users

New installs default to the classic interface. An existing account's saved interface-theme choice is intentionally not overwritten; select **SeerrNG Classic 3.5.1** under **Interface design** once after deploying this build if you want to switch that account. This is separate from **Colour palette**.

The overlay does not replace database data or media integrations. It fixes request attribution for authenticated service-API calls using `X-API-User` and exempts only trusted loopback SSR requests (without forwarded-client headers) from the per-user 60/minute metadata limiter. Browser clients routed through a reverse proxy retain the limiter. Discovery component behavior and poster-loading CSS are kept at their upstream behavior while the loading issue is isolated. Only share the service API key with trusted systems, because a valid API key plus `X-API-User` can perform actions as the identified account.

## Attribution

The classic stylesheet is adapted from SeerrNG's existing `seerrOrig` theme. The upstream `LICENSE` is included; preserve attribution and license terms when redistributing builds.

## Validation status

The earlier image with the native request-attribution and rate-limit fixes built successfully. The latest build also contains the legacy-theme mapping, discovery timeouts/retry notices and loading-poster sizing correction; deploy it only after the corresponding GitHub Actions run below succeeds. The complete browser test suite has not been run against a live TrueNAS instance.
