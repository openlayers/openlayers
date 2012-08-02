# OpenLayers 3

## Build it

Run make:

    $ make

## Run the example

Run the [plovr](http://plovr.com/) web server with:

    $ make serve

Then open skeleton.html in the browser (e.g.
<http://localhost/~elemoine/ol3/skeleton.html>).

## Run tests

Run the plovr web server (see above), then open <http://localhost:9810/> in
your browser and select *List of tests* or *Test runner*.

## Run the linter

First, install the [Closure
Linter](https://developers.google.com/closure/utilities/docs/linter_howto).
Then:

    $ make lint
