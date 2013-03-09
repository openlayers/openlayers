# OpenLayers 3

[![Travis CI Status](https://secure.travis-ci.org/openlayers/ol3.png)](http://travis-ci.org/#!/openlayers/ol3)


## Hosted Examples

The examples are hosted on GitHub (as GitHub pages): http://openlayers.github.com/ol3/master/examples/.

By default the examples use the `ol.js` script, which is compiled using Closure
Compiler's ADVANCED mode.  By appending `?mode=simple` or `?mode=whitespace` to
the URL you can make the example page load the `ol-simple.js` or
`ol-whitespace.js` builds instead of `ol.js`. As their names suggest it,
`ol-simple.js` and `ol-whitespace.js` are compiled using the SIMPLE and
WHITESPACE modes, respectively. And by appending `?mode=debug` or `?mode=raw`
you will make the example work in full debug mode.

For example:
http://openlayers.github.com/ol3/master/examples/full-screen.html?mode=simple.

## Build OpenLayers 3

Run build.py:

    $ ./build.py

Windows users should run `build` instead.

## Run Examples locally

Run the [Plovr](http://plovr.com/) web server with:

    $ ./build.py serve

Windows users should run `build serve` instead.

Then, either open one of the example html files from the `examples` directory directly in your browser, or start a simple webserver, for example:

    $ python -mSimpleHTTPServer

and explore the `examples/` directory, for example by opening
<http://localhost:8000/examples/side-by-side.html>.

You can turn off compilation by appending `?mode=RAW` to the URL, for example
<http://localhost:8000/examples/side-by-side.html?mode=RAW>. (By default mode is `ADVANCED`.)

Run examples without Plovr:

The examples can also be run against the `ol.js` standalone lib, without Plovr,
just like the examples [hosted](http://openlayers.github.com/ol3/master/examples/)
on GitHub. Start by executing the `hostexamples` build target:

    $ ./build.py hostexamples
    
This will build `ol.js`, `ol-simple.js`, `ol-whitespace.js`, and `ol.css`,
create the examples index page, and copy everything to
`build/gh-pages/<branch_name>/`, where `<branch_name>` is the name of the local
checked out Git branch. You can now open the examples index page in the
browser, for example: <http://localhost:8000/build/gh-pages/master/examples/>.
To make an example use `ol-simple.js` or `ol-whitespace.js` instead of `ol.js`
append `?mode=simple` or `?mode=whitespace` to the example URL. And append
`?mode=debug` or `?mode=raw` to make the example work in full debug mode.

## Run tests

Run the plovr web server (see above), and either open the `test/ol.html` file
in the browser (e.g. <http://localhost:8000/test/ol.html>), or run `./build.py test`
on the console (headless testing with PhantomJS, make sure to install it first from http://phantomjs.org/download.html).

See also the test-specific [readme](https://github.com/openlayers/ol3/tree/master/test).

## Run the linter

First, install the [Closure
Linter](https://developers.google.com/closure/utilities/docs/linter_howto).
Then:

    $ ./build.py lint

## Run the precommit hook before pushing a commit:

First, install the latest version of [JSDoc3](https://github.com/jsdoc3/jsdoc). Then:

    $ ./build.py precommit

This makes sure that your commit won't break the build. It also runs JSDoc3 to make sure that there are no invalid API doc directives. 

## Add examples

The examples are located in the `examples` directory. Adding a new example
implies creating two files in this directory, an `.html` file and a `.js` file.
See `examples/full-screen.html` and `examples/full-screen.js` for instance.

The `.html` file needs to include a script tag with
`loader.js?id=<example_name>` as its `src`. For example, if the two files for
the example are `myexample.js` and `myexample.html` then the script tag's `src`
should be set to `myexample`.

`build.py serve` should be stopped and restarted for the
`loader.js?id=<example_name>` script tag to refer to a valid URL. `build.py
serve` triggers the `examples` target which creates a Plovr JSON file for each
example.

A note on the use of the `goog` namespace in the examples:

Short story: the OL3 examples should not use the `goog` namespace, except
for `goog.require`.

Longer story:

We want that the OL3 examples work in multiple modes: with the standalone lib
(which has implications of the symbols and properties we export), with Plovr in
ADVANCED mode, and with Plovr in RAW (debug) mode.

Running the examples with Plovr makes it mandatory to declare dependencies with
`goog.require` statements. And for the examples to also run with the standalone
lib we [export](https://github.com/openlayers/ol3/blob/master/src/goog.exports)
`goog.require` as the null function.

Exporting `goog.require` has a side effect: it adds the `goog` namespace object
to the global object. This is why we can, for example, have `if (goog.DEBUG)`
statements in the code of the examples.
