# reader-ui:  A front-end UI to a conceptual multiplex assay reader

This the front-end to a conceptual multiplexing assay reader written in
Bootstrap and Javascript.


To build:

1.  Install `npm` (Node Package Manager);

2.  Run `npm install -g gulp`;

3.  Run `npm install`;

4.  Run `gulp`.

The app will build into the "dist" folder.


Note that I'm only validating this on Chrome for performance/capability
reasons. To use the app:

1.  Run `npm install http-server -g`

2.  cd to the "dist" folder;

3.  Run `http-server -c-1`;

4. Navigate to [http://localhost:8080/Dashboard] (in Chrome or Firefox; the
SVG images may not render properly in IE).


I've also implemented a simulation sequencer that the front-end can talk to.
Both the file server and the simulator can be run with

```
gulp launch-servers
```

This will serve real (but obfuscated) data, one well per "results" request.


Note that Chrome is insanely stubborn about not refreshing the cache. I've found
that clicking on the refresh button while holding down <CTRL> (Linux) or <Shift>
(Windows?) often works.


Also note that the cancellation logic hasn't been thoroughly tested, so I'd
avoid this for now. I also haven't implemented cancellation functionality in the
simulator yet.


Have fun!