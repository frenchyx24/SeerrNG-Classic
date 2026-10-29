# SeerrNG Classic

A separate customization layer for SeerrNG that adds a selectable **SeerrNG Classic 3.5.1** interface theme. The aim is to bring back the compact visual language of Seerr 3.5.1 while keeping current SeerrNG routes, permissions, APIs and added media functionality, including anime, music and books.

This repository is an **overlay**, not a copy of the full upstream source tree. At build time it checks out SeerrNG at a pinned upstream commit, applies the theme and catalog registration, then builds using SeerrNG's own Dockerfile. The upstream repository is never modified.

## What's included

- `overlays/themes/seerrngClassic/manifest.json`: registers the theme as **SeerrNG Classic 3.5.1**.
- `overlays/themes/seerrngClassic/theme.css`: based on SeerrNG's existing classic Seerr visual theme, with selectors namespaced to `seerrngClassic`.
- `scripts/apply-overrides.mjs`: copies the theme into a SeerrNG checkout and adds it to the built-in interface theme catalog. The script is idempotent and refuses to patch a directory whose package name is not `seerrng`.
- `scripts/build.sh`: clones the pinned upstream revision, applies the overlay and builds a local Docker image.

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

For reproducible builds, keep the default pinned commit. When updating the upstream version, review the catalog structure and run the app's typecheck/build before deploying.

To retain the checked-out source for inspection:

```sh
WORK_DIR="$PWD/.build" sh scripts/build.sh
```

## Enable the classic interface

After deploying the image, sign in to SeerrNG and open the theme picker. Under **Interface design**, select **SeerrNG Classic 3.5.1**. This is separate from the **Colour palette** option.

The overlay does not alter database migrations, authentication, request handling, or media integrations. The theme remains an opt-in interface choice; existing saved user preferences are not forcibly overwritten.

## Attribution

The classic stylesheet is adapted from the existing SeerrNG `seerrOrig` theme and is intended to retain the upstream project's license and attribution. Check the upstream `LICENSE` and theme header when redistributing builds.

## Limitations

This repo contains the customization layer rather than all upstream application files. The build depends on access to the pinned upstream Git repository and on the upstream build toolchain. A successful Docker build should be confirmed before deploying to a production instance.
