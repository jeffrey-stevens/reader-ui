# Debian Stretch
# Try "10.15.3-stretch-slim" if this works
FROM node:10.15.3-stretch

WORKDIR /usr/src/app

# Copy just the package.json file, so the installation can be layered
COPY package*.json ./

# Install gulp
RUN npm install -g gulp

# Do the rest of the install
RUN npm install

# Only copy the necessary files over...
# This should be cleaned up...
COPY gulpfile.hs .
COPY js/file-server.js ./js/
COPY js/sequencer-sim.js ./js/
COPY js/util.js ./js/
COPY dist/Dashboard ./dist/

# Build