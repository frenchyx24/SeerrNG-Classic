# SeerrNG Classic

A personal SeerrNG customization that makes **SeerrNG Classic 3.5.1** the default interface for new installs and retains the current SeerrNG backend, routes, permissions, APIs and expanded media features, including anime, music and books.

This repository is an **overlay**, not a copy of the full upstream source tree. At build time it checks out SeerrNG at a pinned upstream commit, applies the classic theme and default-theme changes, then builds using SeerrNG's own Dockerfile. The upstream repository is never modified.

## What's included

- `overlays/themes/seerrng-classic/manifest.json`: the registered interface theme.
- `overlays/themes/seerrng-classic/theme.css`: adapted from SeerrNG's classic Seerr visual stylesheet, with selectors namespaced to `seerrng-classic`.
- `scripts/apply-overrides.mjs`: applies the theme, registers it with the server/frontend theme catalogs, switches the clean-install default, and exempts server-to-self loopback API calls from the public API rate limit. It is idempotent and refuses to patch a directory whose package name is not `seerrng`.
- `scripts/build.sh`: checks out a pinned upstream revision, applies the overlay and builds a local Docker image using the upstream Dockerfile.

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

The overlay does not replace database data, authentication or media integrations. It changes the default interface theme and prevents the server's own loopback SSR requests from exhausting the shared public API rate-limit bucket. External clients remain rate-limited.

## Attribution

The classic stylesheet is adapted from SeerrNG's existing `seerrOrig` theme. The upstream `LICENSE` is included; preserve attribution and license terms when redistributing builds.

## Validation status

A Docker build succeeded against the pinned SeerrNG source before the loopback rate-limit fix. The current commit is rebuilding in GitHub Actions; verify its result before deploying. The complete browser test suite has not been run here.
