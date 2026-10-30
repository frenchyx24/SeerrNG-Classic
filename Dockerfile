FROM ghcr.io/frenchyx24/seerrng-classic:1.0.4

USER root
COPY patch-mobile-homepage.cjs /tmp/patch-mobile-homepage.cjs
RUN node /tmp/patch-mobile-homepage.cjs && rm /tmp/patch-mobile-homepage.cjs
USER node
