# Debian Stretch
# Try "10.15.3-stretch-slim" if this works
FROM node:10.15.3-stretch

WORKDIR /usr/src/app

# Copy just the package.json file, so the installation can be layered
COPY package*.json ./

# Install the packages (just the "production" packages)
RUN npm install --production

# Only copy the necessary files over...
# This should be cleaned up...
COPY ./docker/run.js .
COPY ./build/site/Dashboard ./site
COPY ./build/servers ./servers

# Expose the 2 ports used by the servers
EXPOSE 4000 5000

# Now run
CMD node run.js