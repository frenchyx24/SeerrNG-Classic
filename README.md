# SeerrNG Quiet Cinema

Quiet Cinema 1.7 is a restrained, responsive theme for SeerrNG. It removes decorative layers, preserves core request and navigation features, and completes the missing French UI messages.

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
