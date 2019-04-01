# Todo


## Tasks

* Rotate "analyte" axis labels in the results plot.
* Only analytes A-H are displaying in the results plot!
* Launch the servers serially, to make sure that the simulator is ready
for the UI.
* Add a project description to the first page
* Move test code to the "tests" directory
* Pass in the sequencer URL as an argument to main-dashboard.js,
rather than hard-coding it. Better yet, create a separate file with this
global info.


## Misc

* Include descriptive comments
* What if there's an error with the eject/  etc. requests?
* Chartjs app:  Default to opening the simulation data


## New features

* Include some descriptive text in the "Introduction" page describing what's
  going on
* Include descriptive text in the side bars
* For ejecting a plate, etc., include a description of what's going on,
  and say press any key or click on the screen to continue
* Simulate errors
* When done, mention that the user can start the next plate when this one
  is done
* View a well by clicking on it (get rid of the drop-down list)
* Make the "analytes" data field text, not numeric (sorting may be awkward,
  though)


## Long-term improvements

* Migrate to ES6
 

## Component improvements

### UI

* Add error reporting/notification
* Increase font sizes for the panel tabs
* Increase font sizes for the dialogs
* Increase size of text in "Ready!" button.
* Increate font sizes throughout


### Communications

* Handle "error" fields in the JSON responses
* Implement request timeouts (especially for cancel, load, etc.)


### Wells selection

* Set SVG size to span the containing div; ensure that the SVG doesn't appear
  below the screen
* Fix issue with dragging outside the SVG space
* Tweak styling to blend better with Bootstrap, and to make it appear less
  cartoonish


### Plot

* Draw blank plot on startup
* Fix clipping issue on the right margin of the plot
* Center the plot if only a single well is run


### Results

* Suppress highlighting of "Cancel" button upon click
* Add legend to the progress plate
* Add an eject glyphicon?


## Bugs

* Once in a while the selection plate won't render when the "Let's begin!"
  button is pressed (though it generally will upon refresh...).
  
* The plots appear stretched in the canvas...

* "Start a new run":  Don't say "Ejecting plate..."; say "Preparing the reader",
  or something like that.
  
* When changing from the first plot representation to the second, the plot
  size will change, but when changing back to the first the plot size doesn't
  change.  The same thing happens when changing wells.
  
* For starting with a new plate, it tells you to load the plate *twice*.

* When hovering over the median box in the plots, the median should read
  "median" rather than "reading"