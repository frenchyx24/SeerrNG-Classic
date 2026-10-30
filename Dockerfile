FROM ghcr.io/frenchyx24/seerrng-classic:1.0.7

USER root
COPY patch-responsive-polish.cjs /tmp/patch-responsive-polish.cjs
RUN node /tmp/patch-responsive-polish.cjs && rm /tmp/patch-responsive-polish.cjs
USER node
