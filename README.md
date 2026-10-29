# SeerrNG Classic

A separate SeerrNG customization intended to restore the compact Seerr 3.5.1 visual style while retaining SeerrNG's backend, permissions, requests, routes and expanded media features (anime, music, books and games).

This repository is an overlay, not a copy of upstream. Each image is built from a pinned SeerrNG 3.72.5 source commit, applies only the reviewed changes listed below, and uses the upstream Dockerfile. The official `snapetech-org/seerrng` repository is never modified.

## Current version: 1.0.2

- Version-pinned image: `ghcr.io/frenchyx24/seerrng-classic:1.0.2`

The workflow publishes only semantic-version image tags. It does not publish a moving `latest` tag or commit-SHA tags. Use the numbered tag in TrueNAS for repeatable deployments.

## Fixes in 1.0.2

- Adds the classic Seerr 3.5.1 profile as a selectable interface theme and migrates saved `seerrOrig` preferences to it in this dedicated build.
- **Fixes the root HTTP 429/500 issue:** the global authentication middleware applies a 600/minute limiter before most API routes. Server-side rendering calls the same API over loopback and was consuming that bucket. Only loopback calls without forwarded-client headers are exempt; browser/proxy traffic stays rate-limited.
- Keeps the previous per-user external-metadata limiter exception scoped to trusted loopback server-to-self calls; ordinary proxied browser requests remain limited.
- Adds explicit poster dimensions to empty loading placeholders in horizontal shelves and vertical grids, so their containers cannot collapse into tiny dots.
- Ports `X-API-User` attribution into `server/middleware/auth.ts`. A valid configured `X-API-Key` plus a valid numeric user ID selects that account for the service API request; invalid IDs fail closed and normal cookie/session authentication remains unchanged. This replaces the manual bind mount `/mnt/Apps/Apps/Seerr/auth.js` to `/app/dist/middleware/auth.js`.
- Removes the earlier experimental discovery React overrides; data fetching and shelf rendering remain upstream behavior.

## Build workflow

GitHub Actions applies the overlay to the pinned upstream source, extracts server assets, builds the Docker image and publishes the versioned tag plus `latest`.

Builds: https://github.com/frenchyx24/SeerrNG-Classic/actions

To release a new version, increment the root `VERSION` file and the manifest version, then push the changes. The workflow requires a stable `major.minor.patch` version.

## TrueNAS deployment notes

- Use `ghcr.io/frenchyx24/seerrng-classic:1.0.2` for the fixed release.
- Keep the test app's config volume separate from production.
- If preserving custom branding from the existing instance, mount its custom `public` directory read-only at `/app/public`; it is not embedded automatically by this overlay.
- GHCR packages are private by default. For anonymous pulls, set the package visibility to Public at [package settings](https://github.com/users/frenchyx24/packages/container/package/seerrng-classic), or configure a GHCR login with `read:packages`.

## Validation

The overlay installer is executed by the build workflow before compilation. Version 1.0.2 specifically targets the logged 429 response to `/api/v1/movie/:id` that caused server-rendered detail pages to return 500. The GitHub Docker build validates compilation and publication, but it does not replace a live smoke test against the isolated TrueNAS instance.
