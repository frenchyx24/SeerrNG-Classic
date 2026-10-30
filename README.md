# SeerrNG Classic

Personalized SeerrNG frontend project aimed at restoring the compact, classic Seerr 3.5.1 look while preserving SeerrNG's expanded media support (movies, series, anime, music and books).

## Theme loading fix

The SeerrNG Classic image already contains the loading-card CSS, but the app's OpenAPI request validator rejected the public interface-themes routes because they were missing from seerr-api.yml. This made the linked theme stylesheet return 404 and left poster shelves stuck as tiny loading dots.

The Dockerfile in this repository derives from image 1.0.3 and adds those two public paths to the bundled OpenAPI schema. GitHub Actions publishes the fixed image as ghcr.io/frenchyx24/seerrng-classic:1.0.4 after pushes to main.

To use it, update the TrueNAS app image tag to 1.0.4 and redeploy. Verify that /api/v1/interface-themes/seerrng-classic/theme.css returns HTTP 200 (Content-Type: text/css), then hard-refresh the browser.

## Project status

The classic-style theme is based on the theme already present in SeerrNG. Customizations should preserve current routes, permissions, APIs, and media features. No changes are intended for upstream snapetech-org/seerrng.
