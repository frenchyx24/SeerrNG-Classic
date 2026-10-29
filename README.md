# SeerrNG Classic

A separate SeerrNG customization that applies the compact Seerr 3.5.1 visual style while preserving SeerrNG's routes, permissions, requests, server features and expanded media categories.

The official `snapetech-org/seerrng` repository is not modified. This project builds from pinned SeerrNG 3.72.5 source and applies a small, auditable overlay.

## Current version: 1.0.4

**Image:** `ghcr.io/frenchyx24/seerrng-classic:1.0.4`

The workflow publishes fixed semantic version tags only. It does not publish `latest` or commit-SHA image tags. The 1.0.4 Docker build-and-publish step succeeded: https://github.com/frenchyx24/SeerrNG-Classic/actions/runs/40880019612

## What changed in 1.0.4

- **Rolls back the risky first interface integration:** no custom `seerrng-classic` theme ID is registered anymore. The overlay styles the existing built-in `seerrOrig` package directly, and labels it “SeerrNG Classic”. That avoids new theme-catalog, stylesheet-route and saved-preference migration paths. Existing configurations that select `seerrOrig` keep using the known built-in stylesheet route.
- **Loading shelf appearance:** the built-in stylesheet provides explicit width and aspect ratio for empty poster placeholders, so they cannot collapse into tiny dots.
- **Films/Series grids:** removes the stale `minmax(..., 1fr)` poster-grid override and lets current SeerrNG fixed-width grid CSS control poster dimensions.
- **HTTP 429/500 detail page fix:** only genuine loopback calls without forwarded-client headers are exempted from the global authentication limiter and per-user external-metadata limiter. Browser requests through the reverse proxy remain rate-limited.
- **Native requester attribution:** a valid configured `X-API-Key` plus a valid numeric `X-API-User` selects the target account for the service request. Invalid/unknown IDs fail closed; normal cookie/session login is unchanged. This replaces the manual TrueNAS bind mount `/mnt/Apps/Apps/Seerr/auth.js` to `/app/dist/middleware/auth.js`.

The frontend's React discovery fetching and rendering are left at upstream behavior. If the shelf requests themselves remain pending after the stylesheet rollback, that is a separate API/request-loading issue and should be diagnosed from those requests rather than hidden by more CSS changes.

## TrueNAS

Use `ghcr.io/frenchyx24/seerrng-classic:1.0.4` on the isolated test app. Keep its configuration volume separate from production. If you need the Horus branding, mount the custom public directory read-only at `/app/public`.

GitHub Actions build: https://github.com/frenchyx24/SeerrNG-Classic/actions
