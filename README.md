# reader-ui:  A front-end UI to a conceptual multiplex assay reader

This the front-end to a conceptual multiplexing assay reader written in
Bootstrap and Javascript.


To build:

1.  Install `npm`;

2.  Run `npm install -g gulp`;

3.  Run `npm install`;

4.  Run `gulp build-all`.

The app will build in the 'build' directory.


To run the app locally:

1.  Run `gulp run-servers`.

2. Navigate to [http://localhost:4000/Dashboard], if it doesn't come up
automatically (in Chrome or Firefox; the SVG images may not render properly
in IE).

This runs a data server in the background, to simulate data coming from the
instrument.


To run this in Docker, do the following:

1. Change config/config-servers-docker.json and
config/config-servers-docker.json to refer to the hostname of your Docker
machine.  (I'll try to make this more convenient in the near future.)

2.  Run `npm run build-docker` from the root project directory.

3.  Run `npm run docker-build`.

4.  Navigate to http://[your host]:4000/ in a web browser.

5. When you're done, you may need to ^C from the terminal (I'll fix this
soon). Then run `npm run docker-stop` (and maybe `npm run docker-rm`, if you
want to remove the container).


Note that the cancellation logic hasn't been thoroughly tested, so I'd
avoid this for now. I also haven't implemented cancellation functionality in the
simulator yet.


Have fun!