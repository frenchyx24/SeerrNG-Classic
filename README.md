# SeerrNG Classic

Restores the compact Seerr 3.5.1 look while preserving SeerrNG media features.

## Fixes

- **1.0.4:** Declares public interface-theme routes in OpenAPI.
- **1.0.5:** Adds mobile poster sizing and wrapping for long carousel titles.
- **1.0.6:** Sizes home carousel card shells across wrapper variants and versions the theme CSS URL so mobile browsers cannot reuse the cached old stylesheet.

Deploy ghcr.io/frenchyx24/seerrng-classic:1.0.6 for the latest Horus test fix. The CSS URL is /api/v1/interface-themes/seerrng-classic/theme.css?v=1.0.6.

Changes preserve SeerrNG routes, permissions, APIs and media features; upstream snapetech-org/seerrng is unchanged.
