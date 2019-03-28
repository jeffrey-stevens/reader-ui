# reader-ui:  A front-end UI to a conceptual multiplex assay reader

This the front-end to a conceptual multiplexing assay reader written in
Bootstrap and Javascript.


To build:

1.  Install `npm`;

2.  Run `npm install -g gulp`;

3.  Run `npm install`;

4.  Run `gulp`.

The app will build into the "dist" folder.


To run the app:

1.  Run `gulp run-all`.

2. Navigate to [http://localhost:4000/Dashboard], if it doesn't come up
automatically (in Chrome or Firefox; the SVG images may not render properly
in IE).

This runs a data server in the background, to simulate data coming from the
instrument.

Note that Chrome is insanely stubborn about not refreshing the cache. I've found
that clicking on the refresh button while holding down <CTRL> (Linux) or <Shift>
(Windows?) often works.


Also note that the cancellation logic hasn't been thoroughly tested, so I'd
avoid this for now. I also haven't implemented cancellation functionality in the
simulator yet.


Have fun!