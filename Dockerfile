FROM ghcr.io/frenchyx24/seerrng-classic:1.4.0

USER root
COPY quiet-cinema.css /tmp/quiet-cinema.css
COPY install-quiet-cinema.cjs /tmp/install-quiet-cinema.cjs
RUN node /tmp/install-quiet-cinema.cjs && rm /tmp/quiet-cinema.css /tmp/install-quiet-cinema.cjs
USER node
