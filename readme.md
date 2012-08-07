# OpenLayers 3

## Build it

Run make:

    $ make

## Run the examples

Run make (as above), then explore the `demos/` directory with your web browser.

## Run the examples in debug mode

Run the [Plovr](http://plovr.com/) web server with:

    $ make serve

Then, start a simple webserver, for example:

    $ python -mSimpleHTTPServer

Explore the `demos/` directory through this server, for example <http://localhost:8000/demos/side-by-side/debug.html>. You can turn off compilation by appending `?mode=RAW` to the URL, for example <http://localhost:8000/demos/side-by-side/debug.html?mode=RAW>.

Note that appending `?mode=RAW` doesn't work with `file://` URLs, which is why you need to access the `demos/` directory though a web server.

## Run tests

Run the plovr web server (see above), then open <http://localhost:9810/> in your browser and select *List of tests* or *Test runner*.

## Run the linter

First, install the [Closure Linter](https://developers.google.com/closure/utilities/docs/linter_howto).  Then:

    $ make lint
