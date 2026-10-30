# SeerrNG Quiet Cinema

Quiet Cinema 1.8.1 is a responsive SeerrNG interface inspired by your reference: cinematic featured media, tighter poster rows, a compact sidebar and touch-friendly mobile navigation. It also completes missing French UI messages.

## Changes in 1.6.0

- Replaced the previous theme file with a shorter, coherent visual system.
- Simplified navigation, buttons, fields, filters, cards, media details, and tables.
- Removed ornamental card frames, pseudo-elements, gradients, and heavy shadows.
- Kept dark and light modes, mobile touch targets, keyboard focus, and reduced-motion support.
- Increased the bounded internal SSR API request timeout from 5 to 15 seconds to avoid cold metadata requests surfacing as TV page 500 errors.
- Removed media-type labels from posters and the title-visibility button from slider headings, without removing other filters or poster actions.
- Hid association, ratings, and favorite/watchlist controls; simplified mobile detail pages to poster, title, overview, and request actions.

Image: `ghcr.io/frenchyx24/seerrng-classic:1.6.0`

## Changes in 1.7.0

- Added French translations for UI messages missing from the upstream French catalog, including navigation, settings, discovery, requests, and profile screens.
- Added the missing French notification messages.
- Preserved existing French translations and message placeholders.

Image: `ghcr.io/frenchyx24/seerrng-classic:1.7.0`

## Changes in 1.8.0

- Reworked the dark palette with violet accents, a compact header and a cinematic featured slider.
- Refined poster rows, desktop navigation, and the mobile bottom navigation to match the supplied reference.
- Kept SeerrNG's native search, browsing, request, and media actions.

Image: `ghcr.io/frenchyx24/seerrng-classic:1.8.0`

## Changes in 1.8.1

- Increased the internal SSR API timeout for movie and TV pages to 15 seconds to prevent metadata-load timeouts from becoming HTTP 500 responses.
- Reflowed the mobile header into clear search and control rows and reserved space for the bottom navigation.
- Kept native SeerrNG request and navigation controls intact.

Image: `ghcr.io/frenchyx24/seerrng-classic:1.8.1`
