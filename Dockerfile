FROM ghcr.io/frenchyx24/seerrng-classic:1.4.0

USER root
COPY quiet-cinema.css /tmp/quiet-cinema.css
COPY install-quiet-cinema.cjs /tmp/install-quiet-cinema.cjs
COPY fr-overrides.json /tmp/fr-overrides.json
RUN node /tmp/install-quiet-cinema.cjs && rm /tmp/quiet-cinema.css /tmp/install-quiet-cinema.cjs /tmp/fr-overrides.json
USER node
