# Developing

## Setting up development environment

You will obviously start by
[forking](https://github.com/openlayers/openlayers/fork) the OpenLayers repository.

### CircleCI

The CircleCI hook is enabled on the Github repository. This means every pull request
is run through a full test suite to ensure it compiles and passes the tests. Failing
pull requests will not be merged.

### Development dependencies

The minimum requirements are:

* Git
* [Node.js](http://nodejs.org/) (version 8 and above)

The executables `git` and `node` should be in your `PATH`.

To install the Node.js dependencies run

    $ npm install

## Running examples

To run the examples you first need to start the dev server:

    $ npm run serve-examples

Then, load <http://localhost:8080/> in your browser.

## Running tests

To run the tests once:

    $ npm test

To run the tests continuously during development:

    $ npm run karma

## Adding examples

Adding functionality often implies adding one or several examples. This
section provides explanations related to adding examples.

The examples are located in the `examples` directory. Adding a new example
implies creating two or three files in this directory, an `.html` file, a `.js`
file, and, optionally, a `.css` file.

You can use `simple.js` and `simple.html` as templates for new examples.
