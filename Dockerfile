FROM ghcr.io/frenchyx24/seerrng-classic:1.0.5

USER root
COPY patch-homepage-cache-bust.cjs /tmp/patch-homepage-cache-bust.cjs
RUN node /tmp/patch-homepage-cache-bust.cjs && rm /tmp/patch-homepage-cache-bust.cjs
USER node
