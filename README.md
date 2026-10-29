# SeerrNG Classic

A separate SeerrNG customization intended to restore the compact Seerr 3.5.1 visual style while retaining SeerrNG's backend, permissions, routes, requests and expanded media features (anime, music, books and games).

This repository is an overlay, not a copy of upstream. Each image is built from a pinned SeerrNG 3.72.5 source commit, applies the changes below, then uses the upstream Dockerfile. The official `snapetech-org/seerrng` repository is never modified.

## Current version: 1.0.3

**Image:** `ghcr.io/frenchyx24/seerrng-classic:1.0.3`

The workflow publishes only semantic-version image tags. It does not publish a moving `latest` tag or commit-SHA tags. Use the numbered tag in TrueNAS for repeatable deployments.

## Fixes in 1.0.3

- Adds the compact Seerr 3.5.1 visual profile and maps saved stock `seerrOrig` preferences to it in this dedicated build.
- **Fixes the root HTTP 429/500 issue:** the global authentication middleware applies a 600/minute limiter before nearly every API route. Server-side rendering calls the same API over loopback and was consuming that bucket. Only true loopback calls without forwarded-client headers are exempt; browser/proxy traffic remains rate-limited.
- Retains the scoped loopback exception for the per-user external-metadata limiter (60/minute).
- Adds explicit poster dimensions to loading placeholders, preventing empty loading cards from shrinking into tiny dots in discovery shelves and vertical grids.
- Removes legacy flexible poster-grid overrides from the classic CSS so the current shared fixed-width grid layout continues to work on Movies, Series and other media pages.
- Ports `X-API-User` attribution into `server/middleware/auth.ts`. A valid configured `X-API-Key` plus a valid numeric `X-API-User` selects that account for service API requests; invalid IDs fail closed and normal cookie/session authentication remains unchanged. This replaces the manual mount `/mnt/Apps/Apps/Seerr/auth.js` to `/app/dist/middleware/auth.js`.
- Leaves React discovery fetching/rendering at upstream behavior, removing the previous speculative component changes.

## Build

GitHub Actions applies the overlay, validates the version, builds with the upstream Dockerfile, and pushes the versioned image.

Builds: https://github.com/frenchyx24/SeerrNG-Classic/actions

## TrueNAS notes

- Use `ghcr.io/frenchyx24/seerrng-classic:1.0.3`.
- Keep the test app's configuration volume separate from production.
- To preserve the custom Horus branding from the current instance, mount its custom `public` directory read-only at `/app/public`; the logo is an instance asset and is not embedded in this overlay.
- GHCR packages are private by default. Enable public visibility at [package settings](https://github.com/users/frenchyx24/packages/container/package/seerrng-classic) for anonymous pulls, or configure GHCR credentials with `read:packages`.

## Validation

The overlay apply step is checked in GitHub Actions before compilation. The 1.0.3 image build/publish must succeed before deploying. A live browser smoke test on the isolated TrueNAS instance is still necessary after the fixes; compilation alone cannot prove every request flow on your host.
