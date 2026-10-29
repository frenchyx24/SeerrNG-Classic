# SeerrNG Classic

A personal SeerrNG customization that makes **SeerrNG Classic 3.5.1** the default interface for new installs and retains the current SeerrNG backend, routes, permissions, APIs and expanded media features, including anime, music and books.

This repository is an **overlay**, not a copy of the full upstream source tree. At build time it checks out SeerrNG at a pinned upstream commit, applies the classic theme and default-theme changes, then builds using SeerrNG's own Dockerfile. The upstream repository is never modified.

## What's included

- `overlays/themes/seerrng-classic/manifest.json`: the registered interface theme.
- `overlays/themes/seerrng-classic/theme.css`: adapted from SeerrNG's classic Seerr visual stylesheet, with selectors namespaced to `seerrng-classic`.
- `scripts/apply-overrides.mjs`: applies the theme, registers it with the server/frontend theme catalogs, switches the clean-install default, and exempts server-to-self loopback requests from the per-user external-metadata limiter (60 requests/minute) that can otherwise turn server-rendered media pages into HTTP 500 errors. It is idempotent and refuses to patch a directory whose package name is not `seerrng`.
- `scripts/build.sh`: checks out a pinned upstream revision, applies the overlay and builds a local Docker image using the upstream Dockerfile.

## Container image

The latest built image is `ghcr.io/frenchyx24/seerrng-classic:latest`. The Docker build and publish workflow succeeded on 2026-10-29 with the native requester-attribution and SSR rate-limit fixes included.

GitHub Container Registry packages are private by default. To pull this image from TrueNAS without a registry login, open [the package settings](https://github.com/users/frenchyx24/packages/container/package/seerrng-classic) and change package visibility to **Public** once. If you prefer to keep the package private, configure a GHCR login with a token that has `read:packages` on the host that pulls the image.

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

The overlay does not replace database data or media integrations. It changes the default theme; fixes request attribution for authenticated service-API calls that supply `X-API-User`; and lets true loopback SSR requests (without forwarded-client headers) reach metadata handlers without consuming the per-user 60/minute bucket. Browser clients routed through a reverse proxy retain the limiter. Only share the service API key with trusted systems, because a valid API key plus `X-API-User` can perform actions as the identified account.

## Attribution

The classic stylesheet is adapted from SeerrNG's existing `seerrOrig` theme. The upstream `LICENSE` is included; preserve attribution and license terms when redistributing builds.

## Validation status

The overlay build that includes the native request-attribution change was built and pushed successfully by GitHub Actions on 2026-10-29. Image: `ghcr.io/frenchyx24/seerrng-classic:latest`. The workflow's Docker build/publish step succeeded; a complete browser test suite has not been run against a live TrueNAS instance.
