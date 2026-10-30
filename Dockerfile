FROM ghcr.io/frenchyx24/seerrng-classic:1.0.3

USER root
COPY patch-interface-theme-api.cjs /tmp/patch-interface-theme-api.cjs
RUN node /tmp/patch-interface-theme-api.cjs && rm /tmp/patch-interface-theme-api.cjs
USER node
