# SeerrNG Classic

Personalized SeerrNG frontend project restoring the compact Seerr 3.5.1 look while preserving SeerrNG media support.

## Fixes

- **1.0.4:** Declares public interface-theme routes in OpenAPI so the theme stylesheet loads instead of returning 404.
- **1.0.5:** Fixes mobile home shelves whose loading-card shells are wrapped differently from the previous CSS selectors. Pending posters retain portrait-card dimensions and long carousel headings can wrap instead of being truncated beside controls.

The 1.0.5 image derives from 1.0.4 and is published by GitHub Actions. Deploy `ghcr.io/frenchyx24/seerrng-classic:1.0.5` and reload Horus test. The theme stylesheet is served at `/api/v1/interface-themes/seerrng-classic/theme.css`.

Customizations preserve SeerrNG routes, permissions, APIs, and media features; no changes are intended for upstream `snapetech-org/seerrng`.
