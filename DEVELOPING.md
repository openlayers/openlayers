# Developing

## Setting up development environment

You will obviously start by
[forking](https://github.com/openlayers/ol3/fork) the ol3 repository.

### Travis CI

The Travis CI hook is enabled on the Github repository. This means every pull request
is run through a full test suite to ensure it compiles and passes the tests. Failing
pull requests will not be merged.

Although not mandatory, it is also recommended to set up Travis CI for your ol3 fork.
For that go to your ol3 fork's Service Hooks page and set up the Travis hook.
Then every time you push to your fork, the test suite will be run. This means
errors can be caught before creating a pull request. For those making
small or occasional contributions, this may be enough to check that your contributions
are ok; in this case, you do not need to install the build tools on your local environment
as described below.

### Development dependencies

The minimum requirements are:

* GNU Make
* Git
* [Node.js](http://nodejs.org/) (0.10.x or higher)
* Python 2.6 or 2.7 with a couple of extra modules (see below)
* Java 7 (JRE and JDK)

The executables `git`, `node`, `python` and `java` should be in your `PATH`.

You can check your configuration by running:

    $ make check-deps

To install the Node.js dependencies run

    $ npm install

To install the extra Python modules, run:

    $ sudo pip install -r requirements.txt
or

    $ cat requirements.txt | sudo xargs easy_install

depending on your OS and Python installation.

(You can also install the Python modules in a Python virtual environment if you want to.)

## Working with the build tool

As an ol3 developer you will use `make` to run build targets defined in the
`Makefile` located at the root of the repository. The `Makefile` includes
targets for running the linter, the compiler, the tests, etc.

The usage of `make` is as follows:

    $ make <target>

where `<target>` is the name of the build target you want to execute. For
example:

    $ make test

The main build targets are `serve`, `lint`, `build`, `test`, and `check`. The
latter is a meta-target that basically runs `lint`, `build`, and `test`.

The `serve` target starts a node-based web server, which we will refer to as the *dev server*. You'll need to start that server for running the examples and the tests in a browser. More information on that further down.

Other targets include `apidoc` and `ci`. The latter is the target used on Travis CI. See ol3's [Travis configuration file](https://github.com/openlayers/ol3/blob/master/.travis.yml).

## Running the `check` target

The `check` target is to be run before pushing code to GitHub and opening pull
requests. Branches that don't pass `check` won't pass the integration tests,
and have therefore no chance of being merged into `master`.

To run the `check` target:

    $ make check

If you want to run the full suite of integration tests, see "Running the integration
tests" below.

## Running examples

To run the examples you first need to start the dev server:

    $ make serve

Then, just point your browser <http://localhost:3000/build/examples> in your browser. For example <http://localhost:3000/build/examples/side-by-side.html>.

Run examples against the `ol.js` standalone build:

The examples can also be run against the `ol.js` standalone build, just like
the examples [hosted](http://openlayers.org/en/master/examples/) on GitHub.
Start by executing the `host-examples` build target:

    $ make host-examples

After running `host-examples` you can now open the examples index page in the browser: <http://localhost:3000/build/hosted/master/examples/>. (This assumes that you still have the dev server running.)

Append `?mode=raw` to make the example work in full debug mode. In raw mode the OpenLayers and Closure Library scripts are loaded individually by the Closure Library's `base.js` script (which the example page loads and executes before any other script).

## Running tests

To run the tests in a browser start the dev server (`make serve`) and open <http://localhost:3000/test/index.html> in the browser.

To run the tests on the console (headless testing with PhantomJS) use the `test` target:

    $ make test

See also the test-specific [README](../master/test/README.md).

## Running the integration tests

When you submit a pull request the [Travis continuous integration
server](https://travis-ci.org/) will run a full suite of tests, including
building all versions of the library and checking that all of the examples
work.  You will receive an email with the results, and the status will be
displayed in the pull request.

To run the full suite of integration tests use the `ci` target:

    $ make ci

Running the full suite of integration tests currently takes 5-10 minutes.

This makes sure that your commit won't break the build. It also runs JSDoc3 to
make sure that there are no invalid API doc directives.

## Adding examples

Adding functionality often implies adding one or several examples. This
section provides explanations related to adding examples.

The examples are located in the `examples` directory. Adding a new example
implies creating two or three files in this directory, an `.html` file, a `.js`
file, and, optionally, a `.css` file.

You can use `simple.js` and `simple.html` as templates for new examples.

### Use of the `goog` namespace in examples

Short story: the ol3 examples should not use the `goog` namespace, except
for `goog.require`.

Longer story: we want that the ol3 examples work in multiple modes, with the
standalone lib (which has implications of the symbols and properties we
export), and compiled together with the ol3 library.

Compiling the examples together with the library makes it mandatory to declare dependencies with `goog.require` statements.
